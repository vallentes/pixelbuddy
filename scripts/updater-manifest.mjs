// Builds latest.json for the in-app updater from the signature files attached to a release.
// Usage: node scripts/updater-manifest.mjs <tag> <dir-with-.sig-files> <owner/repo>
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [tag, dir, repo] = process.argv.slice(2);
const version = tag.replace(/^v/, '');
const url = (name) => `https://github.com/${repo}/releases/download/${tag}/${encodeURIComponent(name)}`;
const files = readdirSync(dir).filter((f) => f.endsWith('.sig'));
const platforms = {};

for (const sig of files) {
  const asset = sig.slice(0, -4);
  const signature = readFileSync(join(dir, sig), 'utf8').trim();
  if (asset.endsWith('-setup.exe')) {
    platforms['windows-x86_64'] = { signature, url: url(asset) };
  } else if (asset.endsWith('.app.tar.gz')) {
    // Universal macOS build serves both Apple Silicon and Intel.
    platforms['darwin-aarch64'] = { signature, url: url(asset) };
    platforms['darwin-x86_64'] = { signature, url: url(asset) };
  }
}

if (!Object.keys(platforms).length) {
  console.error('No updater signatures found; latest.json not written.');
  process.exit(1);
}

const manifest = {
  version,
  notes: `PixelBuddy ${version}. See https://github.com/${repo}/releases/tag/${tag}`,
  pub_date: new Date().toISOString(),
  platforms,
};
writeFileSync('latest.json', JSON.stringify(manifest, null, 2));
console.log(`latest.json for ${version}: ${Object.keys(platforms).join(', ')}`);
