import type { CoreConfig, WebAppConfig } from './types';

export const defaultCoreConfig: CoreConfig = {
  api: {
    // Empty baseUrl uses same-origin requests (works with Vite proxy).
    // For direct API access, set VITE_API_BASE_URL=http://localhost:8181
    baseUrl: '',
    timeout: 30000,
    retryAttempts: 3,
  },
  features: {
    enableAdvancedFeatures: false,
    enableDebugMode: false,
  },
  ui: {
    theme: 'system',
    language: 'en',
    animations: true,
  },
};

export const defaultWebConfig: WebAppConfig = {
  ...defaultCoreConfig,
  web: {
    storage: {
      localStoragePrefix: 'product_name_',
      sessionStoragePrefix: 'product_name_session_',
    },
    browser: {
      enableNotifications: true,
      enableServiceWorker: false,
    },
    development: {
      enableHotReload: true,
      enableSourceMaps: true,
    },
  },
};
