import type { ConfigurationProvider } from './ConfigurationProvider';
import { LOG_CONFIG, LOG_LEVELS } from '../../logging';

/**
 * Parse environment variables into configuration object
 * This function allows for better testing by accepting environment values
 */
function parseEnvironmentConfig(env: Record<string, any> = (import.meta as any).env || {}) {
  if (LOG_CONFIG.CONFIG >= LOG_LEVELS.VERBOSE) {
    console.log('📦 [CONFIG] Loading environment variables...');
  }

  const config: Record<string, any> = {};

  // API configuration
  if (env.VITE_API_BASE_URL) {
    if (LOG_CONFIG.CONFIG >= LOG_LEVELS.DEBUG) {
      console.log('📦 [CONFIG] Found VITE_API_BASE_URL:', env.VITE_API_BASE_URL);
    }
    config.api = {
      baseUrl: env.VITE_API_BASE_URL,
    };
  }

  if (env.VITE_API_TIMEOUT) {
    if (!config.api) config.api = {};
    config.api.timeout = parseInt(env.VITE_API_TIMEOUT, 10);
  }

  if (env.VITE_API_RETRY_ATTEMPTS) {
    if (!config.api) config.api = {};
    config.api.retryAttempts = parseInt(env.VITE_API_RETRY_ATTEMPTS, 10);
  }

  // Feature flags
  if (env.VITE_FEATURE_ADVANCED !== undefined) {
    if (!config.features) config.features = {};
    config.features.enableAdvancedFeatures = env.VITE_FEATURE_ADVANCED === 'true';
  }

  if (env.VITE_LOG_MODE !== undefined) {
    if (LOG_CONFIG.CONFIG >= LOG_LEVELS.DEBUG) {
      console.log('📦 [CONFIG] Found VITE_LOG_MODE:', env.VITE_LOG_MODE);
    }
    if (!config.features) config.features = {};
    config.features.enableDebugMode = env.VITE_LOG_MODE === 'true';
  }

  // UI configuration
  if (env.VITE_THEME) {
    if (LOG_CONFIG.CONFIG >= LOG_LEVELS.DEBUG) {
      console.log('📦 [CONFIG] Found VITE_THEME:', env.VITE_THEME);
    }
    if (!config.ui) config.ui = {};
    config.ui.theme = env.VITE_THEME;
  }

  if (env.VITE_LANGUAGE) {
    if (!config.ui) config.ui = {};
    config.ui.language = env.VITE_LANGUAGE;
  }

  if (env.VITE_ANIMATIONS !== undefined) {
    if (!config.ui) config.ui = {};
    config.ui.animations = env.VITE_ANIMATIONS === 'true';
  }

  // Web-specific configuration
  if (env.VITE_WEB_STORAGE_PREFIX) {
    if (!config.web) config.web = {};
    if (!config.web.storage) config.web.storage = {};
    config.web.storage.localStoragePrefix = env.VITE_WEB_STORAGE_PREFIX;
  }

  if (env.VITE_WEB_SESSION_STORAGE_PREFIX) {
    if (!config.web) config.web = {};
    if (!config.web.storage) config.web.storage = {};
    config.web.storage.sessionStoragePrefix = env.VITE_WEB_SESSION_STORAGE_PREFIX;
  }

  if (env.VITE_WEB_NOTIFICATIONS !== undefined) {
    if (!config.web) config.web = {};
    if (!config.web.browser) config.web.browser = {};
    config.web.browser.enableNotifications = env.VITE_WEB_NOTIFICATIONS === 'true';
  }

  if (env.VITE_WEB_SERVICE_WORKER !== undefined) {
    if (!config.web) config.web = {};
    if (!config.web.browser) config.web.browser = {};
    config.web.browser.enableServiceWorker = env.VITE_WEB_SERVICE_WORKER === 'true';
  }

  if (env.VITE_WEB_HOT_RELOAD !== undefined) {
    if (!config.web) config.web = {};
    if (!config.web.development) config.web.development = {};
    config.web.development.enableHotReload = env.VITE_WEB_HOT_RELOAD === 'true';
  }

  if (env.VITE_WEB_SOURCE_MAPS !== undefined) {
    if (!config.web) config.web = {};
    if (!config.web.development) config.web.development = {};
    config.web.development.enableSourceMaps = env.VITE_WEB_SOURCE_MAPS === 'true';
  }

  if (LOG_CONFIG.CONFIG >= LOG_LEVELS.INFO) {
    console.log('📦 [CONFIG] Environment provider loaded successfully');
  }

  return config;
}

export class EnvironmentProvider implements ConfigurationProvider {
  async load(): Promise<Record<string, any>> {
    return parseEnvironmentConfig();
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

// Export the function for testing
export { parseEnvironmentConfig };
