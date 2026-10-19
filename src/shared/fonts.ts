// Fredoka (SIL Open Font License 1.1), bundled with the app; never loaded from the web.
import '@fontsource/fredoka/500.css';
import '@fontsource/fredoka/600.css';

export const BUBBLE_FONT = 'Fredoka, system-ui, -apple-system, "Segoe UI", sans-serif';

/** Resolves once the bubble font is ready for canvas text. */
export const fontsReady: Promise<void> = Promise.all([
  document.fonts.load(`600 16px Fredoka`),
  document.fonts.load(`500 16px Fredoka`),
])
  .then(() => undefined)
  .catch(() => undefined);
