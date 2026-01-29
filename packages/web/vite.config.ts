import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@docmorph/core': resolve(__dirname, '../core/src/index.ts'),
      '@docmorph/core/markdown': resolve(__dirname, '../core/src/markdown/index.ts'),
      '@docmorph/core/latex': resolve(__dirname, '../core/src/latex/index.ts'),
      '@docmorph/core/docx': resolve(__dirname, '../core/src/docx/index.ts'),
    },
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
