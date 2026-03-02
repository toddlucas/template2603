import { describe, it, expect } from 'vitest';
import {
  ConfigSchema,
  ApiConfigSchema,
  FeaturesConfigSchema,
  UiConfigSchema,
  WebConfigSchema,
  validateConfig,
  validateConfigWithDetails,
} from './schemas';

describe('Configuration Schemas', () => {
  describe('ApiConfigSchema', () => {
    it('should validate valid API configuration', () => {
      const validConfig = {
        baseUrl: 'https://api.example.com',
        timeout: 5000,
        retryAttempts: 3,
      };

      const result = ApiConfigSchema.safeParse(validConfig);
      expect(result.success).toBe(true);
    });

    it('should reject invalid URL', () => {
      const invalidConfig = {
        baseUrl: 'not-a-url',
      };

      const result = ApiConfigSchema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });

    it('should reject negative timeout', () => {
      const invalidConfig = {
        timeout: -1000,
      };

      const result = ApiConfigSchema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });

    it('should reject retry attempts outside range', () => {
      const invalidConfig = {
        retryAttempts: 15,
      };

      const result = ApiConfigSchema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });
  });

  describe('FeaturesConfigSchema', () => {
    it('should validate valid feature flags', () => {
      const validConfig = {
        enableDebugMode: true,
        enableNewUI: false,
        enableAdvancedFeatures: true,
      };

      const result = FeaturesConfigSchema.safeParse(validConfig);
      expect(result.success).toBe(true);
    });

    it('should accept partial configuration', () => {
      const partialConfig = {
        enableDebugMode: true,
      };

      const result = FeaturesConfigSchema.safeParse(partialConfig);
      expect(result.success).toBe(true);
    });
  });

  describe('UiConfigSchema', () => {
    it('should validate valid UI configuration', () => {
      const validConfig = {
        theme: 'dark',
        language: 'en-US',
        animations: true,
      };

      const result = UiConfigSchema.safeParse(validConfig);
      expect(result.success).toBe(true);
    });

    it('should accept all valid theme values', () => {
      const themes = ['light', 'dark', 'auto', 'system'];

      for (const theme of themes) {
        const config = { theme };
        const result = UiConfigSchema.safeParse(config);
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid theme', () => {
      const invalidConfig = {
        theme: 'invalid-theme',
      };

      const result = UiConfigSchema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });
  });

  describe('WebConfigSchema', () => {
    it('should validate valid web configuration', () => {
      const validConfig = {
        storage: {
          localStoragePrefix: 'app_',
          sessionStoragePrefix: 'session_',
        },
        browser: {
          enableNotifications: true,
          enableServiceWorker: false,
        },
        development: {
          enableHotReload: true,
          enableSourceMaps: false,
        },
      };

      const result = WebConfigSchema.safeParse(validConfig);
      expect(result.success).toBe(true);
    });

    it('should accept partial web configuration', () => {
      const partialConfig = {
        storage: {
          localStoragePrefix: 'app_',
        },
      };

      const result = WebConfigSchema.safeParse(partialConfig);
      expect(result.success).toBe(true);
    });
  });

  describe('ConfigSchema', () => {
    it('should validate complete configuration', () => {
      const validConfig = {
        api: {
          baseUrl: 'https://api.example.com',
          timeout: 5000,
        },
        features: {
          enableDebugMode: true,
          enableNewUI: false,
        },
        ui: {
          theme: 'dark',
          language: 'en-US',
        },
        web: {
          storage: {
            localStoragePrefix: 'app_',
          },
        },
      };

      const result = ConfigSchema.safeParse(validConfig);
      expect(result.success).toBe(true);
    });

    it('should accept empty configuration', () => {
      const emptyConfig = {};

      const result = ConfigSchema.safeParse(emptyConfig);
      expect(result.success).toBe(true);
    });

    it('should reject configuration with invalid nested objects', () => {
      const invalidConfig = {
        api: {
          baseUrl: 'not-a-url',
        },
        ui: {
          theme: 'invalid-theme',
        },
      };

      const result = ConfigSchema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });
  });

  describe('validateConfig', () => {
    it('should return success for valid configuration', () => {
      const validConfig = {
        api: {
          baseUrl: 'https://api.example.com',
        },
        features: {
          enableDebugMode: true,
        },
      };

      const result = validateConfig(validConfig);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.api?.baseUrl).toBe('https://api.example.com');
        expect(result.data.features?.enableDebugMode).toBe(true);
      }
    });

    it('should return errors for invalid configuration', () => {
      const invalidConfig = {
        api: {
          baseUrl: 'not-a-url',
        },
        ui: {
          theme: 'invalid-theme',
        },
      };

      const result = validateConfig(invalidConfig);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors.some(error => error.includes('baseUrl'))).toBe(true);
        expect(result.errors.some(error => error.includes('theme'))).toBe(true);
      }
    });

    it('should handle non-object inputs', () => {
      // Test with a non-object to trigger ZodError
      const invalidInput = 'not-an-object';

      const result = validateConfig(invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors.some(error => error.includes('Invalid input'))).toBe(true);
      }
    });
  });

  describe('validateConfigWithDetails', () => {
    it('should provide detailed error messages', () => {
      const invalidConfig = {
        api: {
          baseUrl: 'not-a-url',
          timeout: -1000,
        },
        ui: {
          theme: 'invalid-theme',
        },
      };

      const result = validateConfigWithDetails(invalidConfig);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.length).toBeGreaterThan(0);
        // Check that errors include the field paths
        expect(result.errors.some(error => error.startsWith('api.baseUrl'))).toBe(true);
        expect(result.errors.some(error => error.startsWith('api.timeout'))).toBe(true);
        expect(result.errors.some(error => error.startsWith('ui.theme'))).toBe(true);
      }
    });
  });
});
