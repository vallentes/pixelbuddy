# PixelBuddy privacy policy

Last updated: 19 October 2026 · Applies to PixelBuddy 1.4 and later

PixelBuddy is made by Valentin Vina (Vallentes). This page explains, in plain words, what the app does with information on your computer. Short version: **nothing about you ever leaves your computer, and there are no accounts, ads, analytics or tracking.**

## What is stored, and where

| What | Where | Why |
| --- | --- | --- |
| Your pets (name, species, color, hunger and so on) and your settings | A SQLite database in the app's data folder on your computer | So your pets are still there tomorrow |
| Twitch login token (only if you connect Twitch) | Your operating system's keychain | To show Twitch events on your pets |
| Natural voice model (only if you turn on natural voices) | The app's data folder | To speak offline |
| Clips you record | Your Videos folder | You asked for them |

You can see the data folder from Settings → About → Data folder, and delete it any time. Uninstalling the app and deleting that folder removes everything.

## When the app goes online

* **GitHub**, to check for and download updates. GitHub sees a normal download request (your IP address and the app version). See GitHub's privacy statement.
* **Hugging Face**, once, if you turn on natural voices, to download the voice model.
* **Twitch**, only if you connect your Twitch account, to receive your channel's events.

Nothing else. No usage statistics, crash reports or personal data are sent to me or to anyone else.

## "React to what I'm doing" (optional, off by default)

If you turn this on (Settings → Personality, after reading an explanation and confirming), PixelBuddy looks at:

* the **name of the app** that is in front (for example "Discord" or "Spotify"), and
* on Windows, that window's **title** (for example "Inbox - Outlook").

A few times a second this is compared, **in memory, on your computer**, with a built-in list of patterns to decide on a category such as "watching a video", "in a meeting" or "writing email". Then it is discarded. The window title is never shown to the pets, written to disk, logged, or sent over the network. The pets only receive the category, a friendly app name from our own list ("YouTube"), and, if you allow it, the "Artist - Song" text from Spotify's window so a pet can mention the song.

It **never**:

* takes screenshots or reads what is on your screen,
* reads your messages, emails, documents or web pages,
* records which keys you press (to notice fast typing it only checks *whether* there was keyboard or mouse input, not what it was),
* reacts to private or incognito browser windows, password managers or banking pages (these are skipped automatically),
* reacts to apps you put on the "Never react to" list.

You can pause it for an hour from the tray menu ("Don't peek for an hour") or turn it off at any time. On macOS only the app name is used; PixelBuddy does not ask for the Screen Recording permission.

"Climb on windows" (Windows, optional, off by default) uses only the position and size of the active window so pets can stand on it.

## Children

PixelBuddy collects no personal data from anyone, including children.

## Your rights

Because no personal data is collected or sent to me, there is nothing for me to access, correct or delete on my side. Everything stays on your device and is under your control. If you are in the EU/EEA or UK: PixelBuddy processes the information described above only locally on your device, for the feature you switched on, and it is not transferred to me or any third party.

## Contact

Questions about privacy: open an issue at https://github.com/vallentes/pixelbuddy/issues.

## Changes

If this policy changes, the new version will be published in this file and mentioned in the release notes.
