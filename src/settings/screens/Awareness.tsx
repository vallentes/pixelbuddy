import { useEffect, useState } from 'react';
import { api } from '../../shared/api';
import { useStore } from '../store';
import { Card, Row, Toggle } from '../ui';

/** Exactly what "React to what I'm doing" reads, shown before it can be turned on. */
function Disclosure({ mac }: { mac: boolean }) {
  return (
    <ul className="disclosure">
      <li>
        <b>What it looks at:</b> the name of the app in front{mac ? '' : ' and its window title'}, a few times a second.
      </li>
      <li>
        <b>What happens to it:</b> it is matched on your computer against a built-in list (YouTube, Spotify, Outlook,
        Discord...) and then forgotten. Pets only learn the category, like "watching a video".
      </li>
      <li>
        <b>Never:</b> saved to disk, logged, sent over the internet, or shared with anyone. No screenshots, no reading of
        messages, emails or web pages, and no record of which keys you press (only how busy you are).
      </li>
      <li>
        <b>Always skipped:</b> private and incognito windows, password managers, banking pages and any app you add below.
      </li>
      <li>
        <b>Your control:</b> turn it off here any time, or use "Don't peek for an hour" in the tray menu.
      </li>
    </ul>
  );
}

export function AwarenessCards() {
  const { boot, updateSettings } = useStore();
  const s = boot.settings;
  const mac = boot.platform === 'macos';
  const [asking, setAsking] = useState(false);
  const [ignore, setIgnore] = useState(s.activityIgnore.join(', '));
  const [paused, setPaused] = useState(false);
  useEffect(() => setIgnore(s.activityIgnore.join(', ')), [s.activityIgnore]);
  useEffect(() => {
    api.activityPaused().then(setPaused).catch(() => {});
  }, []);

  const pause = async (minutes: number) => {
    await api.pauseActivity(minutes);
    setPaused(minutes > 0);
  };

  return (
    <>
      <Card title="React to what I'm doing">
        <Row
          label="Desktop awareness"
          hint="Pets notice what kind of thing you are doing: they watch videos with you, dance to music, stay quiet in meetings and comment on your 47 open emails. Off by default."
        >
          <Toggle
            label="React to what I'm doing"
            on={s.activityAwareness}
            onChange={(v) => (v ? setAsking(true) : void updateSettings({ activityAwareness: false }))}
          />
        </Row>
        {asking && !s.activityAwareness && (
          <div className="consent">
            <b>Before you turn this on</b>
            <Disclosure mac={mac} />
            <div className="actions" style={{ justifyContent: 'flex-end' }}>
              <button className="btn secondary small" onClick={() => setAsking(false)}>No thanks</button>
              <button
                className="btn small"
                onClick={() => {
                  setAsking(false);
                  void updateSettings({ activityAwareness: true });
                }}
              >
                I understand, turn it on
              </button>
            </div>
          </div>
        )}
        {s.activityAwareness && (
          <>
            <Row label="Quiet during calls" hint="In Zoom, Teams, Meet or Webex calls pets go silent and sit still.">
              <Toggle label="Quiet during calls" on={s.meetingMode} onChange={(v) => updateSettings({ meetingMode: v })} />
            </Row>
            {!mac && (
              <Row label="Mention the song" hint="When Spotify is playing, pets may say the artist and song (from Spotify's window title).">
                <Toggle label="Mention the song" on={s.activitySongNames} onChange={(v) => updateSettings({ activitySongNames: v })} />
              </Row>
            )}
            <Row label="Never react to" hint="App names, separated by commas. Example: slack, outlook">
              <input
                type="text"
                aria-label="Apps to ignore"
                value={ignore}
                placeholder="slack, outlook"
                onChange={(e) => setIgnore(e.target.value)}
                onBlur={() =>
                  void updateSettings({
                    activityIgnore: ignore
                      .split(',')
                      .map((a) => a.trim())
                      .filter(Boolean),
                  })
                }
              />
            </Row>
            <Row label="Take a break from peeking" hint={paused ? 'Paused. Pets are not looking.' : undefined}>
              {paused ? (
                <button className="btn small secondary" onClick={() => void pause(0)}>Resume</button>
              ) : (
                <button className="btn small secondary" onClick={() => void pause(60)}>Pause for an hour</button>
              )}
            </Row>
            <details className="hint" style={{ marginTop: 8 }}>
              <summary>What exactly is read?</summary>
              <Disclosure mac={mac} />
            </details>
          </>
        )}
        {!mac && (
          <Row
            label="Climb on windows"
            hint="Pets can jump onto the window you are using and ride along when you move it. Only the window's position is used."
          >
            <Toggle label="Climb on windows" on={s.perchWindows} onChange={(v) => updateSettings({ perchWindows: v })} />
          </Row>
        )}
      </Card>
      <Card title="Wellbeing">
        <Row label="Break reminders" hint="After an hour at the computer a pet stretches and asks you to do the same.">
          <Toggle label="Break reminders" on={s.breakReminders} onChange={(v) => updateSettings({ breakReminders: v })} />
        </Row>
        <Row label="Water reminders" hint="Every 90 minutes a pet reminds you to drink some water.">
          <Toggle label="Water reminders" on={s.waterReminders} onChange={(v) => updateSettings({ waterReminders: v })} />
        </Row>
        <Row label="Focus timer" hint="Right-click a pet or use the tray: pets go quiet for 25 or 50 minutes and cheer when you are done.">
          <span className="muted">In the pet menu</span>
        </Row>
      </Card>
    </>
  );
}
