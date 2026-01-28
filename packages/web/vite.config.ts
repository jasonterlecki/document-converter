import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2022'
  },
  server: {
    fs: {
      allow: [resolve(__dirname, '..')]
    }
  }
});
