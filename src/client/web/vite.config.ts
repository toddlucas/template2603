import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path';
import tailwindcss from "@tailwindcss/vite";
import json5Plugin from 'vite-plugin-json5'

// Auto-generate app aliases
const apps = ['mail', 'workspace', 'onboarding'];
const appAliases = Object.fromEntries(
  apps.map(app => [`#${app}`, path.resolve(__dirname, `../common/src/apps/${app}`)])
);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), json5Plugin()],
  // Base path for assets when served behind a proxy (e.g., /app/).
  // Set VITE_BASE_PATH=/app/ when running behind the ASP.NET proxy.
  // For the main web app at root, this can stay as '/'.
  base: process.env.VITE_BASE_PATH || '/',
  cacheDir: '.vite',
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),      // Web root
      "$": path.resolve(__dirname, "../common/src"), // Shared common
      ...appAliases,  // Auto-generated: #main, #mail
    },
  },
  server: {
    port: 8383,
    // Proxy API requests to the ASP.NET backend.
    // This enables same-origin cookie auth during development.
    proxy: {
      '/api': {
        target: 'http://localhost:8181',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
