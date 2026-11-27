import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const proxy = { '/api': { target: process.env.API_URL ?? 'http://localhost:8787', changeOrigin: true } };

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy },
  preview: { port: 4173, proxy },
  build: { target: 'es2023', chunkSizeWarningLimit: 900 },
  test: { environment: 'jsdom', setupFiles: ['./src/test-setup.ts'], globals: true, css: false },
});
