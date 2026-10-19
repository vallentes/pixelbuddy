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
}

pub use imp::{foreground_fullscreen, idle_seconds, left_button_down};

#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SystemState {
    pub idle: bool,
    pub fullscreen: bool,
}
