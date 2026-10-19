import { listen } from '@tauri-apps/api/event';
import { useEffect, useState } from 'react';
import { api, errorMessage } from '../shared/api';
import type { UpdateInfo } from '../shared/types';
import { useStore } from './store';

type Phase = { kind: 'idle' } | { kind: 'checking' } | { kind: 'latest' } | { kind: 'installing'; pct: number | null } | { kind: 'error'; message: string };

function useUpdate() {
  const { boot } = useStore();
  const [update, setUpdate] = useState<UpdateInfo | null>(boot.update);
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' });

  useEffect(() => {
    const un = [
      listen<UpdateInfo>('update://available', (e) => setUpdate(e.payload)),
      listen<{ downloaded: number; total: number | null }>('update://progress', (e) =>
        setPhase({ kind: 'installing', pct: e.payload.total ? Math.round((e.payload.downloaded / e.payload.total) * 100) : null }),
      ),
    ];
    return () => un.forEach((p) => void p.then((f) => f()));
  }, []);

  const check = async () => {
    setPhase({ kind: 'checking' });
    try {
      const u = await api.checkForUpdate();
      setUpdate(u);
      setPhase(u ? { kind: 'idle' } : { kind: 'latest' });
    } catch (e) {
      setPhase({ kind: 'error', message: errorMessage(e) });
    }
  };
  const install = async () => {
    setPhase({ kind: 'installing', pct: null });
    try {
      await api.installUpdate();
    } catch (e) {
      setPhase({ kind: 'error', message: errorMessage(e) });
    }
  };
  return { update, phase, check, install };
}

/** Thin banner at the top of Settings when a new version is out. */
export function UpdateBanner() {
  const { update, phase, install } = useUpdate();
  if (!update) return null;
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', background: 'color-mix(in srgb, var(--good) 22%, var(--panel))' }}>
      <span style={{ fontSize: 22 }}>🎁</span>
      <div style={{ flex: 1 }}>
        <b>PixelBuddy {update.version} is out!</b>
        <div className="muted" style={{ fontSize: 12.5 }}>You have {update.current}. Your pets and settings are kept.</div>
      </div>
      {phase.kind === 'installing' ? (
        <span className="muted">Updating{phase.pct !== null ? ` ${phase.pct}%` : '...'}</span>
      ) : (
        <button className="btn" onClick={install}>Update now</button>
      )}
      {phase.kind === 'error' && <span className="error" style={{ margin: 0 }}>{phase.message}</span>}
    </div>
  );
}

/** "Check for updates" row for the About screen. */
export function UpdateCheck() {
  const { update, phase, check, install } = useUpdate();
  useEffect(() => {
    const un = listen('update://check-requested', () => void check());
    return () => void un.then((f) => f());
  }, []);
  return (
    <div className="stack">
      <div className="actions" style={{ alignItems: 'center' }}>
        {update ? (
          <button className="btn" disabled={phase.kind === 'installing'} onClick={install}>
            Update to {update.version}
          </button>
        ) : (
          <button className="btn small secondary" disabled={phase.kind === 'checking'} onClick={check}>
            {phase.kind === 'checking' ? 'Checking...' : 'Check for updates'}
          </button>
        )}
        {phase.kind === 'latest' && <span className="status-ok">You have the latest version.</span>}
        {phase.kind === 'installing' && <span className="muted">Downloading{phase.pct !== null ? ` ${phase.pct}%` : '...'} PixelBuddy restarts when it's done.</span>}
      </div>
      {phase.kind === 'error' && <span className="error" style={{ margin: 0 }}>{phase.message}</span>}
      <span className="muted" style={{ fontSize: 12.5 }}>PixelBuddy also checks automatically every few hours. Updates come from github.com/vallentes/pixelbuddy and are verified before installing.</span>
    </div>
  );
}
