import { defineConfig } from 'vite';
import path from 'path';

// https://vitejs.dev/config
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),      // Web root
      "$": path.resolve(__dirname, "../common/src"), // Shared common
    },
  },
});
