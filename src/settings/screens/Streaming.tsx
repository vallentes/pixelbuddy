import { useEffect, useState } from 'react';
import { api, errorMessage } from '../../shared/api';
import { ACTIONS, type Reward, type Settings } from '../../shared/types';
import { useStore } from '../store';
import { Card, Row, Toggle } from '../ui';

function ActionSelect({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  return (
    <select value={value} aria-label={label} onChange={(e) => onChange(e.target.value)}>
      {ACTIONS.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
    </select>
  );
}

function Overlay() {
  const { boot, updateSettings } = useStore();
  const s = boot.settings;
  const o = boot.overlay;
  const [port, setPort] = useState(String(s.overlayPort));
  const [copied, setCopied] = useState(false);
  const url = o.url;
  return (
    <Card title="OBS overlay">
      <p className="muted" style={{ marginTop: 0 }}>
        Add a <b>Browser Source</b> in OBS with this URL. Width 1920 and height 300 work well. The background is transparent, and it
        works with or without Twitch.
      </p>
      <Row label="Overlay server" hint={o.running ? <span className="status-ok">Running</span> : o.error ? <span className="status-bad">{o.error}</span> : 'Stopped'}>
        <Toggle label="Overlay server" on={s.overlayEnabled} onChange={(v) => updateSettings({ overlayEnabled: v })} />
      </Row>
      <div className="copyline" style={{ margin: '10px 0' }}>
        <input type="text" readOnly value={url} aria-label="Overlay URL" className="mono" />
        <button
          className="btn small"
          onClick={() => navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); })}
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <Row label="Port" hint="Change if another app already uses it.">
        <input
          type="number"
          min={1024}
          max={65535}
          value={port}
          aria-label="Port"
          style={{ width: 100 }}
          onChange={(e) => setPort(e.target.value)}
          onBlur={() => {
            const n = Number(port);
            if (n >= 1024 && n <= 65535 && n !== s.overlayPort) void updateSettings({ overlayPort: n });
            else setPort(String(s.overlayPort));
          }}
        />
      </Row>
      <Row label="Overlay pet size">
        <select value={s.overlayScale} aria-label="Overlay pet size" onChange={(e) => updateSettings({ overlayScale: Number(e.target.value) })}>
          {[2, 3, 4, 5, 6, 8].map((v) => <option key={v} value={v}>{v}x</option>)}
        </select>
      </Row>
      <Row label="Send a test reaction" hint="Plays on your desktop pets and in the overlay.">
        <div className="actions">
          {['happy', 'dance', 'evolve', 'confetti'].map((a) => (
            <button key={a} className="btn small secondary" onClick={() => api.sendTestReaction(a)}>{a}</button>
          ))}
        </div>
      </Row>
    </Card>
  );
}

function Rewards() {
  const { boot } = useStore();
  const [rewards, setRewards] = useState<Reward[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = () => {
    setError(null);
    api.twitchListRewards().then(setRewards).catch((e) => setError(errorMessage(e)));
  };
  useEffect(load, []);
  const set = async (r: Reward, action: string, petId: number | null) => {
    await api.twitchSetRewardAction(r.id, r.title, action, petId).catch((e) => setError(errorMessage(e)));
    setRewards((rs) => rs?.map((x) => (x.id === r.id ? { ...x, action: action === 'none' ? null : action, petId } : x)) ?? null);
  };
  return (
    <Card title="Channel point rewards">
      <p className="muted" style={{ marginTop: 0 }}>Pick what happens when a viewer redeems one of your existing rewards. Create rewards in your Twitch creator dashboard.</p>
      {error && <p className="error">{error}</p>}
      {rewards?.length === 0 && <p className="muted">No custom rewards on your channel yet.</p>}
      {rewards?.map((r) => (
        <Row key={r.id} label={r.title} hint={`${r.cost} points`}>
          <ActionSelect label={`Action for ${r.title}`} value={r.action ?? 'none'} onChange={(v) => set(r, v, r.petId)} />
          <select value={r.petId ?? ''} aria-label={`Pet for ${r.title}`} onChange={(e) => set(r, r.action ?? 'none', e.target.value ? Number(e.target.value) : null)} disabled={!r.action}>
            <option value="">All pets</option>
            {boot.pets.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </Row>
      ))}
      <button className="btn small secondary" onClick={load}>Refresh list</button>
    </Card>
  );
}

function Twitch() {
  const { boot, updateSettings } = useStore();
  const t = boot.twitch;
  const s = boot.settings;
  const [clientId, setClientId] = useState(s.twitchClientId);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const event = (label: string, key: keyof Settings) => (
    <Row label={label}>
      <ActionSelect label={label} value={s[key] as string} onChange={(v) => updateSettings({ [key]: v })} />
    </Row>
  );
  const login = async () => {
    setBusy(true);
    setError(null);
    try {
      await api.twitchBeginLogin();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Card title="Twitch">
        {!t.account && (
          <>
            <p className="muted" style={{ marginTop: 0 }}>
              Optional. PixelBuddy signs in with Twitch's official device login. Your tokens stay in your system keychain and never
              leave this computer except to talk to Twitch.
            </p>
            <Row label="Twitch Client ID" hint="From your app at dev.twitch.tv (Client Type: Public). Builds can ship one by default.">
              <input
                type="text"
                className="mono"
                value={clientId}
                aria-label="Twitch Client ID"
                style={{ width: 260 }}
                onChange={(e) => setClientId(e.target.value)}
                onBlur={() => clientId !== s.twitchClientId && void updateSettings({ twitchClientId: clientId })}
              />
            </Row>
            {t.pending ? (
              <div className="stack center" style={{ padding: '12px 0' }}>
                <span>Enter this code on Twitch:</span>
                <span className="code">{t.pending.userCode}</span>
                <span className="muted">We opened {new URL(t.pending.verificationUri).host} in your browser. Waiting for approval...</span>
                <div className="actions" style={{ justifyContent: 'center' }}>
                  <button className="btn small secondary" onClick={() => api.twitchCancelLogin()}>Cancel</button>
                </div>
              </div>
            ) : (
              <button className="btn" disabled={busy || !s.twitchClientId} onClick={login}>Connect Twitch</button>
            )}
          </>
        )}
        {t.account && (
          <>
            <Row label={<>Connected as <b>{t.account.displayName}</b></>} hint={`Live events: ${t.eventsub === 'connected' ? 'listening' : t.eventsub}`}>
              <button className="btn small secondary" onClick={() => api.twitchReconnect()}>Reconnect</button>
              <button className="btn small danger" onClick={() => api.twitchDisconnect()}>Disconnect</button>
            </Row>
            {t.subscriptions.map((sub) => (
              <Row key={sub.kind} label={sub.label} hint={sub.message ?? undefined}>
                <span className={sub.ok ? 'status-ok' : 'status-bad'}>{sub.ok ? 'Active' : 'Unavailable'}</span>
              </Row>
            ))}
          </>
        )}
        {(error || t.error) && <p className="error">{error ?? t.error}</p>}
      </Card>
      {t.account && (
        <>
          <Card title="Reactions">
            {event('New follower', 'twitchFollowAction')}
            {event('New subscriber', 'twitchSubAction')}
            {event('Gifted subs', 'twitchGiftAction')}
            {event('Cheer (bits)', 'twitchCheerAction')}
            {event('Incoming raid', 'twitchRaidAction')}
          </Card>
          <Rewards />
        </>
      )}
    </>
  );
}

export function StreamingScreen() {
  return (
    <>
      <h1>Streaming</h1>
      <p className="lead">Put your pets on stream and let your chat interact with them.</p>
      <Overlay />
      <Twitch />
    </>
  );
}
