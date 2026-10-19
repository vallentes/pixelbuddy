fn main() {
    println!("cargo:rerun-if-env-changed=PIXELBUDDY_TWITCH_CLIENT_ID");
    tauri_build::build()
}
