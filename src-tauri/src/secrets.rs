//! OS keychain storage (Windows Credential Manager, macOS Keychain). Secrets never cross into
//! the webview, and the `Secret` wrapper keeps them out of `Debug` output and logs.

use std::collections::HashMap;
use std::sync::Mutex;

const SERVICE: &str = "app.pixelbuddy.desktop";

#[derive(Clone, PartialEq, Eq)]
pub struct Secret(String);

impl Secret {
    pub fn new(s: impl Into<String>) -> Self {
        Self(s.into())
    }
    pub fn expose(&self) -> &str {
        &self.0
    }
}

impl std::fmt::Debug for Secret {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str("Secret(<redacted>)")
    }
}

pub trait SecretStore: Send + Sync {
    fn get(&self, name: &str) -> Option<Secret>;
    fn set(&self, name: &str, value: &Secret) -> Result<(), String>;
    fn delete(&self, name: &str);
}

pub struct KeychainStore;

impl SecretStore for KeychainStore {
    fn get(&self, name: &str) -> Option<Secret> {
        keyring::Entry::new(SERVICE, name).ok()?.get_password().ok().map(Secret)
    }
    fn set(&self, name: &str, value: &Secret) -> Result<(), String> {
        keyring::Entry::new(SERVICE, name)
            .and_then(|e| e.set_password(value.expose()))
            .map_err(|e| format!("keychain write failed: {e}"))
    }
    fn delete(&self, name: &str) {
        if let Ok(e) = keyring::Entry::new(SERVICE, name) {
            let _ = e.delete_credential();
        }
    }
}

/// In-memory store for tests.
#[derive(Default)]
pub struct MemoryStore(Mutex<HashMap<String, String>>);

impl SecretStore for MemoryStore {
    fn get(&self, name: &str) -> Option<Secret> {
        self.0.lock().unwrap().get(name).cloned().map(Secret)
    }
    fn set(&self, name: &str, value: &Secret) -> Result<(), String> {
        self.0.lock().unwrap().insert(name.into(), value.expose().into());
        Ok(())
    }
    fn delete(&self, name: &str) {
        self.0.lock().unwrap().remove(name);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn debug_never_prints_secret() {
        let s = Secret::new("oauth:super-secret-token");
        assert!(!format!("{s:?}").contains("super-secret"));
        assert!(!format!("{:?}", Some(s.clone())).contains("super-secret"));
    }
}
