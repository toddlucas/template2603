import { defineConfig } from 'vitest/config';
import path from 'path';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "$": path.resolve(__dirname, "../common/src"),
    },
  },
  test: {
    setupFiles: ['./src/test/setup.ts'],
    environment: 'jsdom',
    globals: true,
  },
});

