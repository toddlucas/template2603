import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path';
import tailwindcss from "@tailwindcss/vite";

// Auto-generate app aliases
const apps = ['mail', 'workspace'];
const appAliases = Object.fromEntries(
  apps.map(app => [`#${app}`, path.resolve(__dirname, `../common/src/apps/${app}`)])
);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  cacheDir: '.vite',
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "$": path.resolve(__dirname, "./src"),
      ...appAliases,  // Auto-generated: #main, #mail
    },
  },
  build: {
    rollupOptions: {
      // Exclude development artifacts from production builds
      external: (id) => {
        return id.includes('/examples/') ||
               id.includes('/scratch/') ||
               id.includes('/.notes/') ||
               id.endsWith('.example.tsx') ||
               id.endsWith('.example.ts');
      }
    }
  },
  server: {
    port: 6170,
  },
})
