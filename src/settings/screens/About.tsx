import { api } from '../../shared/api';
import { useStore } from '../store';
import { Card, Row, Wordmark } from '../ui';
import { UpdateCheck } from '../Update';

export function AboutScreen() {
  const { boot } = useStore();
  return (
    <>
      <h1>About</h1>
      <Card>
        <Wordmark px={4} />
        <p className="muted">Version {boot.version}</p>
        <p>Fifteen original pets that live on your desktop. Made by Vallentes. Free, no ads, no tracking.</p>
        <button className="btn small" onClick={() => api.openSupportLink()}>☕ Buy me a coffee</button>
      </Card>
      <Card title="Updates">
        <UpdateCheck />
      </Card>
      <Card title="Privacy">
        <p className="muted" style={{ marginTop: 0 }}>
          Your pets and settings are stored only on this computer. PixelBuddy does not collect any data. It only goes online to
          check GitHub for new versions, download the free voice model (once, if you turn on natural voices) and to talk to Twitch
          if you connect it. If you turn on "React to what I'm doing", the name of the app in front is checked on this computer
          and immediately forgotten; it is never saved or sent anywhere. Full details: PRIVACY.md on GitHub.
        </p>
        <Row label="Data folder" hint="SQLite database with your pets and settings.">
          <button className="btn small secondary" onClick={() => api.openDataFolder()}>Open</button>
        </Row>
      </Card>
      <Card title="Credits">
        <p className="muted" style={{ marginTop: 0 }}>
          Voices: Kokoro-82M (Apache-2.0). Font: Fredoka (SIL Open Font License). All pets, art and sounds are original.
        </p>
        <Row label="Quit PixelBuddy" hint="Closing this window keeps your pets running in the tray.">
          <button className="btn small danger" onClick={() => api.quit()}>Quit</button>
        </Row>
      </Card>
    </>
  );
}
