/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: 'localhost',
    // Cross-origin isolation enables multi-threaded WebAssembly for the voice engine.
    headers: { 'Cross-Origin-Opener-Policy': 'same-origin', 'Cross-Origin-Embedder-Policy': 'require-corp' },
  },
  build: {
    target: ['es2021', 'chrome105', 'safari15'],
    sourcemap: false,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        pet: resolve(__dirname, 'pet.html'),
        overlay: resolve(__dirname, 'overlay.html'),
        // Dev-only art/voice gallery, built only when DEV_GALLERY=1.
        ...(process.env.DEV_GALLERY ? { gallery: resolve(__dirname, 'gallery.html') } : {}),
      },
    },
  },
  preview: {
    port: 1421,
    headers: { 'Cross-Origin-Opener-Policy': 'same-origin', 'Cross-Origin-Embedder-Policy': 'require-corp' },
  },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
});
