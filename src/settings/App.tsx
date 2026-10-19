import { api } from '../shared/api';
import { AboutScreen } from './screens/About';
import { SupportScreen } from './screens/Support';
import { Onboarding } from './screens/Onboarding';
import { PetsScreen } from './screens/Pets';
import { AppearanceScreen, BehaviorScreen, PerformanceScreen, PersonalityScreen } from './screens/Preferences';
import { StreamingScreen } from './screens/Streaming';
import { useStore, type Section } from './store';
import { PetPreview, Wordmark } from './ui';

const NAV: { id: Section; label: string; color: string }[] = [
  { id: 'pets', label: 'Pets', color: '#ff9f43' },
  { id: 'personality', label: 'Personality', color: '#ff7ad9' },
  { id: 'appearance', label: 'Appearance', color: '#ff5c8a' },
  { id: 'behavior', label: 'Behavior', color: '#3fbf7f' },
  { id: 'performance', label: 'Performance', color: '#6c8cff' },
  { id: 'streaming', label: 'Streaming', color: '#a86cff' },
  { id: 'support', label: 'Support', color: '#ffcf4a' },
  { id: 'about', label: 'About', color: '#a99fd0' },
];

export function App() {
  const { boot, section, setSection } = useStore();
  if (!boot.settings.onboarded) return <Onboarding />;

  return (
    <div className="app">
      <nav className="sidebar" aria-label="Settings sections">
        <div className="brand">
          <PetPreview species={boot.pets[0]?.species ?? 'mochi'} color={boot.pets[0]?.color} accessory={boot.pets[0]?.accessory} scale={1} label="" />
          <Wordmark px={2} />
        </div>
        <div className="nav">
          {NAV.map((n) => (
            <button key={n.id} className={section === n.id ? 'active' : ''} aria-current={section === n.id} onClick={() => setSection(n.id)}>
              <span className="dot" style={{ color: n.color }} />
              {n.label}
            </button>
          ))}
        </div>
        <div className="spacer" />
        <button className="btn small" onClick={() => api.openSupportLink()} title="buymeacoffee.com/vallentes">☕ Buy me a coffee</button>
      </nav>
      <main className="main">
        {section === 'pets' && <PetsScreen />}
        {section === 'personality' && <PersonalityScreen />}
        {section === 'appearance' && <AppearanceScreen />}
        {section === 'behavior' && <BehaviorScreen />}
        {section === 'performance' && <PerformanceScreen />}
        {section === 'streaming' && <StreamingScreen />}
        {section === 'support' && <SupportScreen />}
        {section === 'about' && <AboutScreen />}
      </main>
    </div>
  );
}
