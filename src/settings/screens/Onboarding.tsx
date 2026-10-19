import { useState } from 'react';
import { api, errorMessage } from '../../shared/api';
import { getSpecies } from '../../sprites/species';
import { useStore } from '../store';
import { Wordmark } from '../ui';
import { SpeciesPicker } from './Pets';

export function Onboarding() {
  const { boot, updateSettings } = useStore();
  const [species, setSpecies] = useState('mochi');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const start = async () => {
    setBusy(true);
    setError(null);
    try {
      if (boot.pets.length === 0) await api.createPet(species, name.trim() || getSpecies(species).name);
      await updateSettings({ onboarded: true });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="gate">
      <div className="card" style={{ maxWidth: 820 }}>
        <div className="center" style={{ marginBottom: 6 }}>
          <Wordmark px={4} />
        </div>
        <p className="center muted">Pick your first buddy. You can adopt more later.</p>
        <SpeciesPicker value={species} onChange={setSpecies} />
        <div className="copyline" style={{ marginTop: 18 }}>
          <input
            type="text"
            maxLength={16}
            aria-label="Name"
            value={name}
            placeholder={`Name your ${getSpecies(species).name}`}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void start()}
          />
          <button className="btn big" disabled={busy} onClick={start}>Let's go!</button>
        </div>
        <p className="muted center" style={{ fontSize: 12.5 }}>PixelBuddy is free. Have fun!</p>
        {error && <p className="error">{error}</p>}
      </div>
    </div>
  );
}
