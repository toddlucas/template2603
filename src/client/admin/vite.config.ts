import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path';
import tailwindcss from "@tailwindcss/vite";
import json5Plugin from 'vite-plugin-json5'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), json5Plugin()],
  // Base path for assets when served behind a proxy (e.g., /admin/).
  // Set VITE_BASE_PATH=/admin/ when running behind the ASP.NET proxy.
  // For the admin app, this can be configured to '/admin/'.
  base: process.env.VITE_BASE_PATH || '/',
  cacheDir: '.vite',
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "$": path.resolve(__dirname, "../common/src"),
    },
  },
  server: {
    port: 8484,
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
