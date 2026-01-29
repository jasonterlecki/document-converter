import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: '@docmorph/core', replacement: resolve(__dirname, '../core/src/index.ts') },
      {
        find: /^@docmorph\\/core\\/(markdown|latex|docx)$/,
        replacement: resolve(__dirname, '../core/src/$1/index.ts'),
      },
    ],
  },
  build: {
    target: 'es2022'
  },
  server: {
    fs: {
      allow: [resolve(__dirname, '..')]
    }
  }
});
