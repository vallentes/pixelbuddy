// Copies the ONNX Runtime WebAssembly files used by the Kokoro voice into public/ort so they are
// bundled with the app (no scripts are ever loaded from a CDN).
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const src = join('node_modules', '@huggingface', 'transformers', 'dist');
const dst = join('public', 'ort');
mkdirSync(dst, { recursive: true });
for (const f of ['ort-wasm-simd-threaded.jsep.mjs', 'ort-wasm-simd-threaded.jsep.wasm']) {
  if (!existsSync(join(src, f))) {
    console.warn(`copy-ort: ${f} not found in ${src}`);
    continue;
  }
  copyFileSync(join(src, f), join(dst, f));
}
console.log('copy-ort: ONNX Runtime files ready in public/ort');
