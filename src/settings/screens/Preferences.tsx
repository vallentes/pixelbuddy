import { listen } from '@tauri-apps/api/event';
import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { api } from '../../shared/api';
import { Bar, Card, PetPreview, Row, Slider, Toggle } from '../ui';
import { loadVoices, voiceStatus, type VoiceStatus } from '../voiceService';

function NaturalVoiceStatus() {
  const [vs, setVs] = useState<VoiceStatus>(voiceStatus());
  useEffect(() => {
    const un = listen<VoiceStatus>('voice://status', (e) => setVs(e.payload));
    return () => void un.then((f) => f());
  }, []);
  if (vs.state === 'ready') return <span className="status-ok">Natural voices ready</span>;
  if (vs.state === 'downloading')
    return (
      <div style={{ width: 220 }}>
        <Bar value={vs.progress * 100} color="#6c8cff" />
        <span className="muted" style={{ fontSize: 12 }}>Downloading voices... {Math.round(vs.progress * 100)}%</span>
      </div>
    );
  if (vs.state === 'error')
    return (
      <span className="error" style={{ margin: 0 }}>
        Could not load voices: {vs.message}{' '}
        <button className="btn small secondary" onClick={() => loadVoices().catch(() => {})}>Retry</button>
      </span>
    );
  return <span className="muted">One-time download: about 330 MB with a graphics card (fast), 90 MB without.</span>;
}

export function AppearanceScreen() {
  const { boot, updateSettings } = useStore();
  const s = boot.settings;
  return (
    <>
      <h1>Appearance</h1>
      <p className="lead">How your pets and this window look.</p>
      <Card title="Theme">
        <Row label="Color theme" hint="System follows your OS light or dark mode.">
          <select value={s.theme} aria-label="Color theme" onChange={(e) => updateSettings({ theme: e.target.value as typeof s.theme })}>
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </Row>
      </Card>
      <Card title="Art style">
        <div className="actions" role="radiogroup" aria-label="Art style">
          {(['hd', 'pixel'] as const).map((st) => (
            <button
              key={st}
              type="button"
              role="radio"
              aria-checked={s.artStyle === st}
              className={`species ${s.artStyle === st ? 'active' : ''}`}
              style={{ width: 200 }}
              onClick={() => updateSettings({ artStyle: st })}
            >
              <PetPreview species={boot.pets[0]?.species ?? 'mochi'} color={boot.pets[0]?.color} accessory={boot.pets[0]?.accessory} style={st} state="wave" scale={3} />
              <b>{st === 'hd' ? 'HD' : 'Pixel art'}</b>
              <small>{st === 'hd' ? 'Smooth, shaded characters with expressive eyes.' : 'Crisp retro sprites. Lightest on CPU.'}</small>
            </button>
          ))}
        </div>
      </Card>
      <Card title="Pets">
        <Row label="Size" hint="Pixel scale. Larger pets are easier to grab.">
          <Slider label="Size" value={s.scale} min={1} max={8} step={1} format={(v) => `${v}x`} onChange={(v) => updateSettings({ scale: v })} />
        </Row>
        <Row label="Opacity">
          <Slider label="Opacity" value={s.opacity} min={0.2} max={1} step={0.05} format={(v) => `${Math.round(v * 100)}%`} onChange={(v) => updateSettings({ opacity: v })} />
        </Row>
        <Row label="Animation speed">
          <Slider label="Animation speed" value={s.animationSpeed} min={0.25} max={3} step={0.25} format={(v) => `${v}x`} onChange={(v) => updateSettings({ animationSpeed: v })} />
        </Row>
        <Row label="Walking speed">
          <Slider label="Walking speed" value={s.walkSpeed} min={0.25} max={3} step={0.25} format={(v) => `${v}x`} onChange={(v) => updateSettings({ walkSpeed: v })} />
        </Row>
      </Card>
    </>
  );
}

export function BehaviorScreen() {
  const { boot, updateSettings } = useStore();
  const s = boot.settings;
  return (
    <>
      <h1>Behavior</h1>
      <p className="lead">What your pets do on their own.</p>
      <Card title="Movement">
        <Row label="Walk around" hint="Pets stroll along the bottom of the screen.">
          <Toggle label="Walk around" on={s.walking} onChange={(v) => updateSettings({ walking: v })} />
        </Row>
        <Row label="Gravity" hint="Dropped pets fall back to the taskbar. Off: they stay where you put them.">
          <Toggle label="Gravity" on={s.gravity} onChange={(v) => updateSettings({ gravity: v })} />
        </Row>
        <Row label="Follow the mouse" hint="Pets look at and sometimes walk toward your cursor.">
          <Toggle label="Follow the mouse" on={s.mouseInteraction} onChange={(v) => updateSettings({ mouseInteraction: v })} />
        </Row>
        <Row label="Click-through" hint="Clicks on empty space around a pet reach the window underneath.">
          <Toggle label="Click-through" on={s.clickThrough} onChange={(v) => updateSettings({ clickThrough: v })} />
        </Row>
      </Card>
      <Card title="When you step away">
        <Row label="Sleep when idle" hint="Pets nap while you are away from the keyboard.">
          <Toggle label="Sleep when idle" on={s.sleepWhenIdle} onChange={(v) => updateSettings({ sleepWhenIdle: v })} />
        </Row>
        <Row label="Idle after">
          <Slider label="Idle after" value={s.idleMinutes} min={1} max={60} step={1} format={(v) => `${v} min`} onChange={(v) => updateSettings({ idleMinutes: v })} />
        </Row>
      </Card>
      <Card title="System">
        <Row label="Notifications" hint="A reminder when a pet is hungry or lonely. Never more than once per need.">
          <Toggle label="Notifications" on={s.notifications} onChange={(v) => updateSettings({ notifications: v })} />
        </Row>
        <Row label="Launch at startup" hint="Start PixelBuddy quietly in the tray when you log in.">
          <Toggle label="Launch at startup" on={s.launchAtStartup} onChange={(v) => updateSettings({ launchAtStartup: v })} />
        </Row>
        <Row label="Show pets">
          <Toggle label="Show pets" on={!s.petsHidden} onChange={(v) => updateSettings({ petsHidden: !v })} />
        </Row>
      </Card>
    </>
  );
}

export function PerformanceScreen() {
  const { boot, updateSettings } = useStore();
  const s = boot.settings;
  const effective = s.performanceMode ? Math.min(12, s.fps) : s.fps;
  return (
    <>
      <h1>Performance</h1>
      <p className="lead">Keep PixelBuddy light. Pets only redraw at the frame rate below and stop entirely when paused.</p>
      <Card title="Frame rate">
        <Row label="Frames per second" hint={`Running at ${effective} FPS per pet.`}>
          <Slider label="Frames per second" value={s.fps} min={5} max={60} step={1} onChange={(v) => updateSettings({ fps: v })} />
        </Row>
        <Row label="Performance mode" hint="Caps animation at 12 FPS and polls the mouse less often. Good for laptops on battery.">
          <Toggle label="Performance mode" on={s.performanceMode} onChange={(v) => updateSettings({ performanceMode: v })} />
        </Row>
      </Card>
      <Card title="Automatic pausing">
        <Row
          label="Hide during fullscreen apps"
          hint={boot.platform === 'macos' ? 'macOS keeps pets off fullscreen Spaces automatically.' : 'Pets hide and stop animating while a game, video or presentation is fullscreen.'}
        >
          <Toggle label="Hide during fullscreen apps" on={s.pauseWhenFullscreen} onChange={(v) => updateSettings({ pauseWhenFullscreen: v })} />
        </Row>
        <Row label="Slow down while idle" hint="Sleeping pets drop to 4 FPS when you are away.">
          <Toggle label="Sleep when idle" on={s.sleepWhenIdle} onChange={(v) => updateSettings({ sleepWhenIdle: v })} />
        </Row>
        <Row label="Pause all animations" hint="Freezes pets in place without hiding them.">
          <Toggle label="Pause all animations" on={s.animationsPaused} onChange={(v) => updateSettings({ animationsPaused: v })} />
        </Row>
      </Card>
    </>
  );
}

export function PersonalityScreen() {
  const { boot, updateSettings } = useStore();
  const s = boot.settings;
  return (
    <>
      <h1>Personality and voice</h1>
      <p className="lead">Your pets chat, crack jokes, notice the time of day and react to what you do.</p>
      <Card title="Talking">
        <Row label="How chatty" hint="How often pets say something on their own.">
          <select value={s.chattiness} aria-label="How chatty" onChange={(e) => updateSettings({ chattiness: e.target.value as typeof s.chattiness })}>
            <option value="off">Quiet (only when you interact)</option>
            <option value="rare">Now and then</option>
            <option value="normal">Normal</option>
            <option value="chatty">Chatterbox</option>
          </select>
        </Row>
        <Row label="Your name" hint="Pets will greet you by name.">
          <input
            type="text"
            maxLength={24}
            defaultValue={s.userName}
            aria-label="Your name"
            placeholder="friend"
            onBlur={(e) => e.target.value !== s.userName && void updateSettings({ userName: e.target.value })}
          />
        </Row>
      </Card>
      <Card title="Voice and sounds">
        <Row
          label="Voice"
          hint="Natural uses free Kokoro neural voices that run on your computer, each pet with its own voice. Babble is a cute made-up pet language."
        >
          <select value={s.voiceMode} aria-label="Voice" onChange={(e) => updateSettings({ voiceMode: e.target.value as typeof s.voiceMode })}>
            <option value="natural">Natural voices</option>
            <option value="babble">Pet babble</option>
            <option value="speech">System voice</option>
            <option value="off">Silent</option>
          </select>
        </Row>
        {s.voiceMode === 'natural' && (
          <Row label="Natural voices" hint="Runs offline after the first download. Model: Kokoro-82M (Apache-2.0).">
            <NaturalVoiceStatus />
          </Row>
        )}
        <Row label="Volume">
          <Slider label="Volume" value={s.voiceVolume} min={0} max={1} step={0.05} format={(v) => `${Math.round(v * 100)}%`} onChange={(v) => updateSettings({ voiceVolume: v })} />
        </Row>
        <Row label="Sound effects" hint="Chomps, boings, sneezes and thuds.">
          <Toggle label="Sound effects" on={s.soundEffects} onChange={(v) => updateSettings({ soundEffects: v })} />
        </Row>
        <Row label="Try it" hint="Your pets on the desktop will respond.">
          <div className="actions">
            <button className="btn small" onClick={() => api.petAction(null, 'wave')}>Say hi</button>
            <button className="btn small secondary" onClick={() => api.petAction(null, 'joke')}>Tell a joke</button>
            <button className="btn small secondary" onClick={() => api.petAction(null, 'sing')}>Sing</button>
            <button className="btn small secondary" onClick={() => api.petAction(null, 'trick')}>Do a trick</button>
          </div>
        </Row>
      </Card>
    </>
  );
}