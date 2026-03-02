import type { CoreConfig } from './core';

export interface WebConfig {
  storage: {
    localStoragePrefix: string;
    sessionStoragePrefix: string;
  };
  browser: {
    enableNotifications: boolean;
    enableServiceWorker: boolean;
  };
  development: {
    enableHotReload: boolean;
    enableSourceMaps: boolean;
  };
}

export interface WebAppConfig extends CoreConfig {
  web: WebConfig;
}
