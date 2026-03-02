import type { ConfigurationProvider } from './ConfigurationProvider';

export class WebProvider implements ConfigurationProvider {
  private localStoragePrefix: string;
  private sessionStoragePrefix: string;

  constructor(localStoragePrefix = 'product_name_', sessionStoragePrefix = 'product_name_session_') {
    this.localStoragePrefix = localStoragePrefix;
    this.sessionStoragePrefix = sessionStoragePrefix;
  }

  async load(): Promise<Record<string, any>> {
    const config: Record<string, any> = {};

    // Load from localStorage (persistent)
    if (typeof window !== 'undefined' && window.localStorage) {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.localStoragePrefix)) {
          const configKey = key.substring(this.localStoragePrefix.length);
          try {
            config[configKey] = JSON.parse(localStorage.getItem(key) || 'null');
          } catch (error) {
            console.warn(`Failed to parse localStorage config for key: ${key}`);
          }
        }
      }
    }

    // Load from sessionStorage (temporary)
    if (typeof window !== 'undefined' && window.sessionStorage) {
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key?.startsWith(this.sessionStoragePrefix)) {
          const configKey = key.substring(this.sessionStoragePrefix.length);
          try {
            config[configKey] = JSON.parse(sessionStorage.getItem(key) || 'null');
          } catch (error) {
            console.warn(`Failed to parse sessionStorage config for key: ${key}`);
          }
        }
      }
    }

    return config;
  }

  async save(config: Record<string, any>): Promise<void> {
    if (typeof window === 'undefined' || !window.localStorage) {
      throw new Error('localStorage is not available');
    }

    // Save to localStorage
    for (const [key, value] of Object.entries(config)) {
      const storageKey = `${this.localStoragePrefix}${key}`;
      try {
        localStorage.setItem(storageKey, JSON.stringify(value));
      } catch (error) {
        console.warn(`Failed to save config to localStorage for key: ${key}`, error);
      }
    }
  }

  canSave(): boolean {
    return typeof window !== 'undefined' && window.localStorage !== undefined;
  }

  getPriority(): number {
    return 50; // Medium priority
  }

  // Helper method to save to sessionStorage
  async saveToSession(config: Record<string, any>): Promise<void> {
    if (typeof window === 'undefined' || !window.sessionStorage) {
      throw new Error('sessionStorage is not available');
    }

    for (const [key, value] of Object.entries(config)) {
      const storageKey = `${this.sessionStoragePrefix}${key}`;
      try {
        sessionStorage.setItem(storageKey, JSON.stringify(value));
      } catch (error) {
        console.warn(`Failed to save config to sessionStorage for key: ${key}`, error);
      }
    }
  }
}
