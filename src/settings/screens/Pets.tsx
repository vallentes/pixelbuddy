import { useEffect, useState } from 'react';
import { api, errorMessage } from '../../shared/api';
import { decodeBuddy, encodeBuddy, markVisitor, type Buddy } from '../../shared/buddyCode';
import type { MonitorInfo, Pet } from '../../shared/types';
import { ACCESSORY_LIST } from '../../sprites/bitmaps';
import { VARIANTS, variantPalette } from '../../sprites/palette';
import { SPECIES_LIST, getSpecies } from '../../sprites/species';
import type { Accessory, ColorVariant, PetState } from '../../sprites/types';
import { useStore } from '../store';
import { Bar, PetPreview } from '../ui';

export function SpeciesPicker({ value, onChange }: { value: string; onChange: (s: string) => void }) {
  return (
    <div className="species-grid" role="radiogroup" aria-label="Species">
      {SPECIES_LIST.map((s) => (
        <button
          key={s.id}
          type="button"
          role="radio"
          aria-checked={value === s.id}
          className={`species ${value === s.id ? 'active' : ''}`}
          onClick={() => onChange(s.id)}
        >
          <PetPreview species={s.id} scale={2} state={value === s.id ? 'happy' : 'idle'} label={s.name} />
          <b>{s.name}</b>
          <small>{s.blurb}</small>
        </button>
      ))}
    </div>
  );
}

function AdoptModal({ onClose }: { onClose: () => void }) {
  const [species, setSpecies] = useState('mochi');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const adopt = async () => {
    setBusy(true);
    setError(null);
    try {
      await api.createPet(species, name.trim() || getSpecies(species).name);
      onClose();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Adopt a pet" onClick={onClose}>
      <div className="card modal" onClick={(e) => e.stopPropagation()}>
        <h2>Adopt a new buddy</h2>
        <SpeciesPicker value={species} onChange={setSpecies} />
        <div className="row">
          <div className="label">Name</div>
          <div className="control">
            <input type="text" maxLength={16} value={name} placeholder={getSpecies(species).name} onChange={(e) => setName(e.target.value)} />
          </div>
        </div>
        {error && <p className="error">{error}</p>}
        <div className="actions" style={{ justifyContent: 'flex-end', marginTop: 12 }}>
          <button className="btn secondary" onClick={onClose}>Cancel</button>
          <button className="btn" disabled={busy} onClick={adopt}>Adopt</button>
        </div>
      </div>
    </div>
  );
}

function ShareCode({ pet }: { pet: Pet }) {
  const { boot } = useStore();
  const [copied, setCopied] = useState(false);
  const code = encodeBuddy({ species: pet.species, color: pet.color, accessory: pet.accessory, name: pet.name, from: boot.settings.userName });
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // the code is selectable, so it can still be copied by hand
    }
  };
  return (
    <div className="share-code">
      <code title="Send this to a friend. They paste it under Import a buddy.">{code}</code>
      <button className="btn small secondary" onClick={copy}>{copied ? 'Copied!' : 'Copy'}</button>
    </div>
  );
}

function ImportBuddy({ full }: { full: boolean }) {
  const [code, setCode] = useState('');
  const [preview, setPreview] = useState<Buddy | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const read = (v: string) => {
    setCode(v);
    setError(null);
    if (!v.trim()) return setPreview(null);
    try {
      setPreview(decodeBuddy(v));
    } catch (e) {
      setPreview(null);
      setError(errorMessage(e));
    }
  };
  const bring = async () => {
    if (!preview) return;
    setBusy(true);
    try {
      const p = await api.createPet(preview.species, preview.name);
      markVisitor(p.id, preview.from);
      await api.updatePet(p.id, { color: preview.color, accessory: preview.accessory });
      setCode('');
      setPreview(null);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="card import-buddy">
      <h2>Import a buddy</h2>
      <p className="muted">Got a buddy code from a friend? Paste it here and their pet comes to visit your desktop.</p>
      <div className="actions">
        <input type="text" aria-label="Buddy code" placeholder="PB1-..." value={code} onChange={(e) => read(e.target.value)} style={{ flex: 1 }} />
        <button className="btn" disabled={!preview || busy || full} onClick={bring}>Bring them over</button>
      </div>
      {preview && (
        <div className="pet-head" style={{ marginTop: 10 }}>
          <PetPreview species={preview.species} color={preview.color} accessory={preview.accessory} state="wave" scale={2} label={preview.name} />
          <span>
            <b>{preview.name}</b> the {getSpecies(preview.species).name}
            {preview.from ? <span className="muted"> · from {preview.from}</span> : null}
          </span>
        </div>
      )}
      {full && <p className="muted">You have the most pets PixelBuddy allows. Say goodbye to one first.</p>}
      {error && <p className="error">{error}</p>}
    </section>
  );
}

function PetCard({ pet, monitors }: { pet: Pet; monitors: MonitorInfo[] }) {
  const [name, setName] = useState(pet.name);
  const [sharing, setSharing] = useState(false);
  const [preview, setPreview] = useState<{ state: PetState; bubble: string | null }>({ state: 'idle', bubble: null });
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  useEffect(() => setName(pet.name), [pet.name]);

  const patch = async (p: Parameters<typeof api.updatePet>[1]) => {
    setError(null);
    try {
      await api.updatePet(pet.id, p);
    } catch (e) {
      setError(errorMessage(e));
      setName(pet.name);
    }
  };
  const act = async (action: string, state: PetState, bubble: string) => {
    setPreview({ state, bubble });
    window.setTimeout(() => setPreview({ state: 'idle', bubble: null }), 3000);
    await api.petAction(pet.id, action).catch((e) => setError(errorMessage(e)));
  };

  const sp = getSpecies(pet.species);
  return (
    <section className="card pet-card">
      <div className="pet-head">
        <PetPreview species={pet.species} color={pet.color} accessory={pet.accessory} state={preview.state} bubble={preview.bubble} scale={3} label={pet.name} />
        <div className="stack" style={{ flex: 1 }}>
          <input
            type="text"
            aria-label="Pet name"
            maxLength={16}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => name.trim() !== pet.name && void patch({ name })}
            onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
          />
          <span className="muted">{sp.name}</span>
        </div>
      </div>
      <div className="stat"><span>Fullness</span><Bar value={100 - pet.hunger} color="#ff9f43" /><span>{Math.round(100 - pet.hunger)}</span></div>
      <div className="stat"><span>Happiness</span><Bar value={pet.happiness} color="#ff5c8a" /><span>{Math.round(pet.happiness)}</span></div>
      <div className="stat"><span>Energy</span><Bar value={pet.energy} color="#3fbf7f" /><span>{Math.round(pet.energy)}</span></div>
      <div className="actions">
        <button className="btn small" onClick={() => act('feed', 'eat', 'Yum!')}>Feed</button>
        <button className="btn small" onClick={() => act('play', 'dance', 'Wheee!')}>Play</button>
        <button className="btn small secondary" onClick={() => act('dance', 'dance', '♥')}>Dance</button>
        <button className="btn small secondary" onClick={() => act('sleep', 'sleep', 'Zzz')}>Nap</button>
      </div>
      <div>
        <div className="label" style={{ fontWeight: 600, marginBottom: 6 }}>Color</div>
        <div className="swatches" role="radiogroup" aria-label="Color">
          {VARIANTS.map((v) => (
            <button
              key={v.id}
              type="button"
              role="radio"
              aria-checked={pet.color === v.id}
              title={v.label}
              aria-label={v.label}
              className={`swatch ${pet.color === v.id ? 'active' : ''}`}
              style={{ background: variantPalette(sp.palette, v.id as ColorVariant).body }}
              onClick={() => patch({ color: v.id as ColorVariant })}
            />
          ))}
        </div>
      </div>
      <div className="row">
        <div className="label">Accessory</div>
        <div className="control">
          <select value={pet.accessory} aria-label="Accessory" onChange={(e) => patch({ accessory: e.target.value as Accessory })}>
            {ACCESSORY_LIST.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
          </select>
        </div>
      </div>
      {monitors.length > 1 && (
        <div className="row">
          <div className="label">Display</div>
          <div className="control">
            <select value={pet.monitor ?? ''} aria-label="Display" onChange={(e) => patch({ monitor: e.target.value })}>
              <option value="" disabled>Choose a display</option>
              {monitors.map((m, i) => (
                <option key={m.name + i} value={m.name}>{`Display ${i + 1}${m.primary ? ' (main)' : ''} · ${m.width}x${m.height}`}</option>
              ))}
            </select>
          </div>
        </div>
      )}
      <div className="row">
        <div className="label">Show on desktop</div>
        <div className="control">
          <button className={`toggle ${pet.visible ? 'on' : ''}`} role="switch" aria-checked={pet.visible} aria-label="Show on desktop" onClick={() => patch({ visible: !pet.visible })} />
        </div>
      </div>
      {sharing ? <ShareCode pet={pet} /> : null}
      {confirm ? (
        <div className="actions">
          <span className="muted">Say goodbye to {pet.name}?</span>
          <button className="btn small danger" onClick={() => api.deletePet(pet.id).catch((e) => setError(errorMessage(e)))}>Remove</button>
          <button className="btn small secondary" onClick={() => setConfirm(false)}>Keep</button>
        </div>
      ) : (
        <div className="actions">
          <button className="btn small secondary" onClick={() => setSharing((s) => !s)}>{sharing ? 'Hide code' : 'Share buddy code'}</button>
          <button className="btn small secondary" onClick={() => setConfirm(true)}>Remove pet</button>
        </div>
      )}
      {error && <p className="error">{error}</p>}
    </section>
  );
}

export function PetsScreen() {
  const { boot } = useStore();
  const [adopting, setAdopting] = useState(false);
  const [monitors, setMonitors] = useState<MonitorInfo[]>([]);
  useEffect(() => {
    api.monitors().then(setMonitors).catch(() => {});
  }, []);
  return (
    <>
      <h1>Your pets</h1>
      <p className="lead">Feed, play, rename and dress up your buddies. Right-click a pet on your desktop for quick actions.</p>
      <div className="grid">
        {boot.pets.map((p) => <PetCard key={p.id} pet={p} monitors={monitors} />)}
        {boot.pets.length < boot.maxPets && (
          <button className="card adopt" onClick={() => setAdopting(true)}>
            <PetPreview species="nimbus" scale={2} state="happy" />
            Adopt another pet
          </button>
        )}
      </div>
      <ImportBuddy full={boot.pets.length >= boot.maxPets} />
      {adopting && <AdoptModal onClose={() => setAdopting(false)} />}
    </>
  );
}
