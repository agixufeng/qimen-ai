import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/lunar-javascript')) return 'calendar';
          if (id.includes('node_modules/react') || id.includes('node_modules/scheduler'))
            return 'react';
        },
      },
    },
  },
  resolve: {
    alias: {
      '@qimen/cases': fileURLToPath(new URL('../../packages/cases/src/index.ts', import.meta.url)),
      '@qimen/core': fileURLToPath(new URL('../../packages/core/src/index.ts', import.meta.url)),
      '@qimen/knowledge': fileURLToPath(
        new URL('../../packages/knowledge/src/index.ts', import.meta.url),
      ),
    },
  },
});
