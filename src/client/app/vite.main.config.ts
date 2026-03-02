import { defineConfig, loadEnv } from 'vite';
import path from 'path';

// https://vitejs.dev/config
export default defineConfig(({ mode }) => {
  // Load VITE_* vars from the app's .env files so they are available in the
  // main process bundle (which doesn't use import.meta.env at runtime).
  const env = loadEnv(mode, path.resolve(__dirname), 'VITE_');

  return {
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "$": path.resolve(__dirname, "../common/src"),
      },
    },
    define: {
      __MICROSOFT_CLIENT_ID__: JSON.stringify(env.VITE_MICROSOFT_CLIENT_ID ?? ''),
      __MICROSOFT_TENANT_ID__: JSON.stringify(env.VITE_MICROSOFT_TENANT_ID ?? 'common'),
    },
  };
});
