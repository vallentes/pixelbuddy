//! Idle time, fullscreen detection and mouse button state via small native calls.

#[cfg(target_os = "windows")]
mod imp {
    use windows_sys::Win32::System::SystemInformation::GetTickCount;
    use windows_sys::Win32::UI::Input::KeyboardAndMouse::{GetAsyncKeyState, GetLastInputInfo, LASTINPUTINFO, VK_LBUTTON};
    use windows_sys::Win32::UI::Shell::{
        SHQueryUserNotificationState, QUERY_USER_NOTIFICATION_STATE, QUNS_BUSY, QUNS_PRESENTATION_MODE,
        QUNS_RUNNING_D3D_FULL_SCREEN,
    };

    pub fn idle_seconds() -> u64 {
        let mut info = LASTINPUTINFO { cbSize: std::mem::size_of::<LASTINPUTINFO>() as u32, dwTime: 0 };
        // SAFETY: info is a valid, correctly sized LASTINPUTINFO.
        if unsafe { GetLastInputInfo(&mut info) } == 0 {
            return 0;
        }
        let now = unsafe { GetTickCount() };
        (now.wrapping_sub(info.dwTime) / 1000) as u64
    }

    pub fn foreground_fullscreen() -> bool {
        let mut state: QUERY_USER_NOTIFICATION_STATE = 0;
        // SAFETY: state is a valid out pointer.
        if unsafe { SHQueryUserNotificationState(&mut state) } != 0 {
            return false;
        }
        state == QUNS_BUSY || state == QUNS_RUNNING_D3D_FULL_SCREEN || state == QUNS_PRESENTATION_MODE
    }

    pub fn left_button_down() -> bool {
        // SAFETY: plain query of async key state.
        (unsafe { GetAsyncKeyState(VK_LBUTTON as i32) } as u16 & 0x8000) != 0
    }

    /// The window in front (not ours): app path, title, frame and whether it is maximized.
    pub fn foreground() -> Option<super::Foreground> {
        use windows_sys::Win32::Foundation::{CloseHandle, RECT};
        use windows_sys::Win32::Graphics::Dwm::{DwmGetWindowAttribute, DWMWA_EXTENDED_FRAME_BOUNDS};
        use windows_sys::Win32::System::Threading::{OpenProcess, QueryFullProcessImageNameW, PROCESS_QUERY_LIMITED_INFORMATION};
        use windows_sys::Win32::UI::WindowsAndMessaging::{
            GetForegroundWindow, GetWindowTextLengthW, GetWindowTextW, GetWindowThreadProcessId, IsIconic, IsZoomed,
        };
        // SAFETY: every call gets valid buffers/handles; the process handle is closed below.
        unsafe {
            let hwnd = GetForegroundWindow();
            if hwnd.is_null() {
                return None;
            }
            let mut pid = 0u32;
            GetWindowThreadProcessId(hwnd, &mut pid);
            if pid == 0 || pid == std::process::id() {
                return None;
            }
            let len = GetWindowTextLengthW(hwnd).clamp(0, 512);
            let mut buf = vec![0u16; len as usize + 1];
            let n = GetWindowTextW(hwnd, buf.as_mut_ptr(), buf.len() as i32);
            let title = String::from_utf16_lossy(&buf[..n.max(0) as usize]);
            let mut app = String::new();
            let proc = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, 0, pid);
            if !proc.is_null() {
                let mut path = vec![0u16; 1024];
                let mut size = path.len() as u32;
                if QueryFullProcessImageNameW(proc, 0, path.as_mut_ptr(), &mut size) != 0 {
                    app = String::from_utf16_lossy(&path[..size as usize]);
                }
                CloseHandle(proc);
            }
            let mut r = RECT { left: 0, top: 0, right: 0, bottom: 0 };
            let ok = DwmGetWindowAttribute(
                hwnd,
                DWMWA_EXTENDED_FRAME_BOUNDS as u32,
                &mut r as *mut RECT as *mut _,
                std::mem::size_of::<RECT>() as u32,
            ) == 0;
            let iconic = IsIconic(hwnd) != 0;
            let rect = (ok && !iconic && r.right > r.left && r.bottom > r.top).then(|| [r.left, r.top, r.right - r.left, r.bottom - r.top]);
            Some(super::Foreground { app, title, rect, maximized: IsZoomed(hwnd) != 0 })
        }
    }

    /// True if there was input since the last call while the mouse stayed put (typing, roughly).
    /// Only the time of the last input is read, never which key.
    pub fn typed_since_last_sample() -> bool {
        use std::sync::Mutex;
        use windows_sys::Win32::Foundation::POINT;
        use windows_sys::Win32::UI::WindowsAndMessaging::GetCursorPos;
        static LAST: Mutex<(u32, i32, i32)> = Mutex::new((0, 0, 0));
        let mut info = LASTINPUTINFO { cbSize: std::mem::size_of::<LASTINPUTINFO>() as u32, dwTime: 0 };
        let mut pt = POINT { x: 0, y: 0 };
        // SAFETY: valid out pointers.
        unsafe {
            GetLastInputInfo(&mut info);
            GetCursorPos(&mut pt);
        }
        let mut last = LAST.lock().unwrap();
        let typed = last.0 != 0 && info.dwTime != last.0 && (pt.x, pt.y) == (last.1, last.2);
        *last = (info.dwTime, pt.x, pt.y);
        typed
    }
}

#[cfg(target_os = "macos")]
mod imp {
    #[link(name = "CoreGraphics", kind = "framework")]
    extern "C" {
        fn CGEventSourceSecondsSinceLastEventType(state: i32, event_type: u32) -> f64;
        fn CGEventSourceButtonState(state: i32, button: u32) -> bool;
    }
    const COMBINED_SESSION: i32 = 0;
    const ANY_INPUT: u32 = u32::MAX;

    pub fn idle_seconds() -> u64 {
        // SAFETY: pure query functions from CoreGraphics.
        let s = unsafe { CGEventSourceSecondsSinceLastEventType(COMBINED_SESSION, ANY_INPUT) };
        if s.is_finite() && s > 0.0 {
            s as u64
        } else {
            0
        }
    }

    /// macOS puts fullscreen apps in their own Space where our windows are not shown, so pets
    /// are already out of the way; nothing extra to detect here.
    pub fn foreground_fullscreen() -> bool {
        false
    }

    pub fn left_button_down() -> bool {
        // SAFETY: pure query function from CoreGraphics.
        unsafe { CGEventSourceButtonState(COMBINED_SESSION, 0) }
    }

    /// A key went down in the last ~0.3 s. Only the time is read, never which key.
    pub fn typed_since_last_sample() -> bool {
        const KEY_DOWN: u32 = 10;
        // SAFETY: pure query function from CoreGraphics.
        let s = unsafe { CGEventSourceSecondsSinceLastEventType(COMBINED_SESSION, KEY_DOWN) };
        s.is_finite() && s < 0.32
    }

    /// The frontmost app's name (via NSWorkspace). Window titles would need the Screen Recording
    /// permission, which we deliberately do not ask for, so the title stays empty on macOS.
    pub fn foreground() -> Option<super::Foreground> {
        use std::ffi::{c_char, c_void, CStr};
        #[link(name = "AppKit", kind = "framework")]
        extern "C" {}
        #[link(name = "objc")]
        extern "C" {
            fn objc_getClass(name: *const c_char) -> *mut c_void;
            fn sel_registerName(name: *const c_char) -> *mut c_void;
            fn objc_msgSend();
            fn objc_autoreleasePoolPush() -> *mut c_void;
            fn objc_autoreleasePoolPop(pool: *mut c_void);
        }
        type Send0 = unsafe extern "C" fn(*mut c_void, *mut c_void) -> *mut c_void;
        // SAFETY: plain Objective-C message sends to NSWorkspace / NSRunningApplication; nil is
        // checked before every use and an autorelease pool scopes the returned objects.
        unsafe {
            let send: Send0 = std::mem::transmute(objc_msgSend as unsafe extern "C" fn());
            let pool = objc_autoreleasePoolPush();
            let sel = |n: &CStr| sel_registerName(n.as_ptr());
            let ws = send(objc_getClass(c"NSWorkspace".as_ptr()), sel(c"sharedWorkspace"));
            let front = if ws.is_null() { std::ptr::null_mut() } else { send(ws, sel(c"frontmostApplication")) };
            let mut out = None;
            if !front.is_null() {
                let name = send(front, sel(c"localizedName"));
                if !name.is_null() {
                    let utf8 = send(name, sel(c"UTF8String")) as *const c_char;
                    if !utf8.is_null() {
                        let app = CStr::from_ptr(utf8).to_string_lossy().into_owned();
                        if app != "PixelBuddy" {
                            out = Some(super::Foreground { app, title: String::new(), rect: None, maximized: false });
                        }
                    }
                }
            }
            objc_autoreleasePoolPop(pool);
            out
        }
    }
}

#[cfg(not(any(target_os = "windows", target_os = "macos")))]
mod imp {
    pub fn idle_seconds() -> u64 {
        0
    }
    pub fn foreground_fullscreen() -> bool {
        false
    }
    pub fn left_button_down() -> bool {
        false
    }
    pub fn foreground() -> Option<super::Foreground> {
        None
    }
    pub fn typed_since_last_sample() -> bool {
        false
    }
}

pub use imp::{foreground, foreground_fullscreen, idle_seconds, left_button_down, typed_since_last_sample};

/// The active window, read only for "React to what I'm doing" (see activity.rs).
pub struct Foreground {
    pub app: String,
    pub title: String,
    pub rect: Option<[i32; 4]>,
    pub maximized: bool,
}

#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SystemState {
    pub idle: bool,
    pub fullscreen: bool,
}
