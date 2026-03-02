import type { CoreConfig } from './core';

export interface WindowConfig {
  width: number;
  height: number;
  minWidth: number;
  minHeight: number;
  center: boolean;
  resizable: boolean;
  maximizable: boolean;
}

export interface ElectronConfig {
  window: WindowConfig;
  appData: {
    path: string;
    configFileName: string;
  };
  development: {
    devTools: boolean;
    reloadOnChange: boolean;
  };
}

export interface ElectronMainConfig extends CoreConfig {
  electron: ElectronConfig;
}

export interface ElectronRendererConfig extends CoreConfig {
  electron: ElectronConfig;
}
