import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import json5Plugin from 'vite-plugin-json5';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const apps = ['mail', 'workspace', 'onboarding'];
const appAliases = Object.fromEntries(
  apps.map(app => [`#${app}`, path.resolve(__dirname, `../common/src/apps/${app}`)])
);

// Force the full React runtime to resolve to app/node_modules exclusively.
// This prevents "two copies of React" errors caused by packages in the
// workspace root node_modules resolving a different React instance.
const r = (pkg: string) => path.resolve(__dirname, `node_modules/${pkg}`);

// https://vitejs.dev/config
export default defineConfig({
  plugins: [react(), tailwindcss(), json5Plugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "$": path.resolve(__dirname, "../common/src"),
      ...appAliases,
      "react": r("react"),
      "react-dom": r("react-dom"),
      "react/jsx-runtime": r("react/jsx-runtime"),
      "react/jsx-dev-runtime": r("react/jsx-dev-runtime"),
      "scheduler": r("scheduler"),
    },
  },
  server: {
    port: 8585,
  },
});
