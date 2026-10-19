import { listen } from '@tauri-apps/api/event';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { api } from '../shared/api';
import type { Settings } from '../shared/types';
import { App } from './App';
import { StoreProvider } from './store';
import { fill, linesFor } from '../engine/chatter';
import { loadVoices, prewarm, setVolume, startVoiceService } from './voiceService';
import './styles.css';
import '../shared/fonts';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoreProvider>
      <App />
    </StoreProvider>
  </StrictMode>,
);

// The main window stays loaded while hidden, so it hosts the natural voice service for all pets.
api
  .bootstrap()
  .then(async (b) => {
    await startVoiceService({ mode: b.settings.voiceMode, volume: b.settings.voiceVolume });
    // Once the voice is ready, quietly pre-generate the lines pets say most often.
    void listen<{ state: string }>('voice://status', (e) => {
      if (e.payload.state !== 'ready') return;
      const lines = b.pets
        .filter((p) => p.visible)
        .flatMap((p) =>
          (['greet', 'pat', 'feed', 'boop', 'belly', 'hug', 'drag', 'drop'] as const).flatMap((t) =>
            linesFor(t, p.species)
              .slice(0, 3)
              .map((l) => ({ text: fill(l, p.name, b.settings.userName), species: p.species })),
          ),
        );
      void prewarm(lines);
    });
  })
  .catch(() => {});
void listen<Settings>('settings://changed', (e) => {
  setVolume(e.payload.voiceVolume);
  if (e.payload.voiceMode === 'natural') loadVoices().catch(() => {});
});
