import { listen } from '@tauri-apps/api/event';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from '../shared/api';
import type { Bootstrap, OverlayStatus, Pet, Settings, TwitchStatus } from '../shared/types';

export type Section = 'pets' | 'personality' | 'appearance' | 'behavior' | 'performance' | 'streaming' | 'support' | 'about';

interface Store {
  boot: Bootstrap;
  section: Section;
  setSection: (s: Section) => void;
  updateSettings: (patch: Partial<Settings>) => Promise<void>;
  reload: () => Promise<void>;
}

const Ctx = createContext<Store | null>(null);

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('store missing');
  return s;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [boot, setBoot] = useState<Bootstrap | null>(null);
  const [section, setSection] = useState<Section>('pets');
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setBoot(await api.bootstrap());
    } catch (e) {
      setError(String(e));
    }
  }, []);

  useEffect(() => {
    void reload();
    const un = [
      listen<Pet[]>('pets://changed', (e) => setBoot((b) => (b ? { ...b, pets: e.payload } : b))),
      listen<Settings>('settings://changed', (e) => setBoot((b) => (b ? { ...b, settings: e.payload } : b))),
      listen<TwitchStatus>('twitch://status', (e) => setBoot((b) => (b ? { ...b, twitch: e.payload } : b))),
      listen<OverlayStatus>('overlay://status', (e) => setBoot((b) => (b ? { ...b, overlay: e.payload } : b))),
      listen<string>('ui://navigate', (e) => setSection(e.payload as Section)),
    ];
    return () => un.forEach((p) => void p.then((f) => f()));
  }, [reload]);

  const updateSettings = useCallback(async (patch: Partial<Settings>) => {
    const s = await api.updateSettings(patch);
    setBoot((b) => (b ? { ...b, settings: s } : b));
  }, []);

  useEffect(() => {
    if (!boot) return;
    const apply = () => {
      const pref = boot.settings.theme;
      const dark = pref === 'dark' || (pref === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    };
    apply();
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [boot?.settings.theme]);

  if (error) return <div className="gate"><div className="card"><h2>PixelBuddy could not start</h2><p className="error">{error}</p></div></div>;
  if (!boot) return null;
  return <Ctx.Provider value={{ boot, section, setSection, updateSettings, reload }}>{children}</Ctx.Provider>;
}
