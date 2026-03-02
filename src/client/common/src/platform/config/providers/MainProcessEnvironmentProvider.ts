import type { ConfigurationProvider } from './ConfigurationProvider';
import { LOG_CONFIG, LOG_LEVELS } from '../../logging';

export class MainProcessEnvironmentProvider implements ConfigurationProvider {
  async load(): Promise<Record<string, any>> {
    if (LOG_CONFIG.CONFIG >= LOG_LEVELS.VERBOSE) {
      console.log('📦 [CONFIG] Loading main process environment variables...');
    }

    const config: Record<string, any> = {};

    // Parse BASALT_ environment variables (main process only)
    const env = process.env || {};

    // Electron-specific configuration
    if (env.BASALT_ELECTRON_WINDOW_WIDTH) {
      if (LOG_CONFIG.CONFIG >= LOG_LEVELS.DEBUG) {
        console.log('📦 [CONFIG] Found BASALT_ELECTRON_WINDOW_WIDTH:', env.BASALT_ELECTRON_WINDOW_WIDTH);
      }
      if (!config.electron) config.electron = {};
      if (!config.electron.window) config.electron.window = {};
      config.electron.window.width = parseInt(env.BASALT_ELECTRON_WINDOW_WIDTH, 10);
    }

    if (env.BASALT_ELECTRON_WINDOW_HEIGHT) {
      if (!config.electron) config.electron = {};
      if (!config.electron.window) config.electron.window = {};
      config.electron.window.height = parseInt(env.BASALT_ELECTRON_WINDOW_HEIGHT, 10);
    }

    if (env.BASALT_ELECTRON_WINDOW_MIN_WIDTH) {
      if (!config.electron) config.electron = {};
      if (!config.electron.window) config.electron.window = {};
      config.electron.window.minWidth = parseInt(env.BASALT_ELECTRON_WINDOW_MIN_WIDTH, 10);
    }

    if (env.BASALT_ELECTRON_WINDOW_MIN_HEIGHT) {
      if (!config.electron) config.electron = {};
      if (!config.electron.window) config.electron.window = {};
      config.electron.window.minHeight = parseInt(env.BASALT_ELECTRON_WINDOW_MIN_HEIGHT, 10);
    }

    if (env.BASALT_ELECTRON_WINDOW_CENTER !== undefined) {
      if (!config.electron) config.electron = {};
      if (!config.electron.window) config.electron.window = {};
      config.electron.window.center = env.BASALT_ELECTRON_WINDOW_CENTER === 'true';
    }

    if (env.BASALT_ELECTRON_WINDOW_RESIZABLE !== undefined) {
      if (!config.electron) config.electron = {};
      if (!config.electron.window) config.electron.window = {};
      config.electron.window.resizable = env.BASALT_ELECTRON_WINDOW_RESIZABLE === 'true';
    }

    if (env.BASALT_ELECTRON_WINDOW_MAXIMIZABLE !== undefined) {
      if (!config.electron) config.electron = {};
      if (!config.electron.window) config.electron.window = {};
      config.electron.window.maximizable = env.BASALT_ELECTRON_WINDOW_MAXIMIZABLE === 'true';
    }

    if (env.BASALT_ELECTRON_DEV_TOOLS !== undefined) {
      if (!config.electron) config.electron = {};
      if (!config.electron.development) config.electron.development = {};
      config.electron.development.devTools = env.BASALT_ELECTRON_DEV_TOOLS === 'true';
    }

    if (env.BASALT_ELECTRON_RELOAD_ON_CHANGE !== undefined) {
      if (!config.electron) config.electron = {};
      if (!config.electron.development) config.electron.development = {};
      config.electron.development.reloadOnChange = env.BASALT_ELECTRON_RELOAD_ON_CHANGE === 'true';
    }

    // API configuration (can be overridden in main process)
    if (env.BASALT_API_BASE_URL) {
      if (!config.api) config.api = {};
      config.api.baseUrl = env.BASALT_API_BASE_URL;
    }

    if (env.BASALT_API_TIMEOUT) {
      if (!config.api) config.api = {};
      config.api.timeout = parseInt(env.BASALT_API_TIMEOUT, 10);
    }

    if (env.BASALT_API_RETRY_ATTEMPTS) {
      if (!config.api) config.api = {};
      config.api.retryAttempts = parseInt(env.BASALT_API_RETRY_ATTEMPTS, 10);
    }

    // Feature flags (can be overridden in main process)
    if (env.BASALT_FEATURE_NEW_UI !== undefined) {
      if (!config.features) config.features = {};
      config.features.enableNewUI = env.BASALT_FEATURE_NEW_UI === 'true';
    }

    if (env.BASALT_FEATURE_ADVANCED !== undefined) {
      if (!config.features) config.features = {};
      config.features.enableAdvancedFeatures = env.BASALT_FEATURE_ADVANCED === 'true';
    }

    if (env.BASALT_DEBUG_MODE !== undefined) {
      if (!config.features) config.features = {};
      config.features.enableDebugMode = env.BASALT_DEBUG_MODE === 'true';
    }

    // UI configuration (can be overridden in main process)
    if (env.BASALT_THEME) {
      if (!config.ui) config.ui = {};
      config.ui.theme = env.BASALT_THEME;
    }

    if (env.BASALT_LANGUAGE) {
      if (!config.ui) config.ui = {};
      config.ui.language = env.BASALT_LANGUAGE;
    }

    if (env.BASALT_ANIMATIONS !== undefined) {
      if (!config.ui) config.ui = {};
      config.ui.animations = env.BASALT_ANIMATIONS === 'true';
    }

    if (LOG_CONFIG.CONFIG >= LOG_LEVELS.INFO) {
      console.log('📦 [CONFIG] Main process environment provider loaded successfully');
    }

    return config;
  }

  async save(): Promise<void> {
    // Environment variables are read-only
    throw new Error('Environment variables cannot be saved');
  }

  canSave(): boolean {
    return false; // Environment variables are read-only
  }

  getPriority(): number {
    return 200; // Highest priority - overrides everything
  }
}
