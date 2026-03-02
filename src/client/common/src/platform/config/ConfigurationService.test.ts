import { describe, it, expect, beforeEach } from 'vitest';
import { MainConfigurationService } from './services/MainConfigurationService';
import { MemoryProvider } from './providers/MemoryProvider';
import { defaultCoreConfig } from './defaults';

describe('ConfigurationService', () => {
  let configService: MainConfigurationService;
  let memoryProvider: MemoryProvider;

  beforeEach(() => {
    memoryProvider = new MemoryProvider();
    configService = new MainConfigurationService([memoryProvider]);
  });

  it('should load default configuration when no providers have data', async () => {
    await configService.load();

    const config = configService.getConfig();
    expect(config).toEqual(defaultCoreConfig);
  });

  it('should merge configuration from providers', async () => {
    // Set some test data in the memory provider
    memoryProvider.setConfig({
      api: {
        baseUrl: 'https://test-api.example.com',
        timeout: 60000,
      },
      features: {
        enableNewUI: false,
      },
    });

    await configService.load();

    const config = configService.getConfig();
    expect(config.api.baseUrl).toBe('https://test-api.example.com');
    expect(config.api.timeout).toBe(60000);
    expect(config.ui.theme).toBe('system'); // Should keep default
  });

  it('should throw error when accessing config before loading', () => {
    expect(() => configService.getConfig()).toThrow('Configuration not loaded');
    expect(() => configService.getSection('api')).toThrow('Configuration not loaded');
  });

  it('should allow updating sections', async () => {
    await configService.load();

    await configService.updateSection('api', {
      baseUrl: 'https://updated-api.example.com',
      timeout: 45000,
      retryAttempts: 5,
    });

    const apiConfig = configService.getSection('api');
    expect(apiConfig.baseUrl).toBe('https://updated-api.example.com');
    expect(apiConfig.timeout).toBe(45000);
    expect(apiConfig.retryAttempts).toBe(5);
  });

  it('should check if configuration is loaded', async () => {
    expect(configService.isLoaded()).toBe(false);

    await configService.load();

    expect(configService.isLoaded()).toBe(true);
  });

  describe('Validation', () => {
    it('should validate configuration during loading', async () => {
      // Set invalid configuration in memory provider
      memoryProvider.setConfig({
        api: {
          baseUrl: 'not-a-valid-url',
        },
        ui: {
          theme: 'invalid-theme',
        },
      });

      // Should not throw but skip invalid provider config
      await configService.load();

      // Should fall back to default config
      const config = configService.getConfig();
      expect(config).toEqual(defaultCoreConfig);
    });

    it('should validate configuration when updating sections', async () => {
      await configService.load();

      // Try to update with invalid API configuration
      await expect(
        configService.updateSection('api', {
          baseUrl: 'not-a-valid-url',
        } as any)
      ).rejects.toThrow('Invalid configuration for section \'api\'');

      // Configuration should remain unchanged
      const apiConfig = configService.getSection('api');
      expect(apiConfig.baseUrl).toBe(defaultCoreConfig.api.baseUrl);
    });

    it('should validate configuration before saving', async () => {
      await configService.load();

      // Manually set invalid configuration (bypassing updateSection)
      (configService as any).config = {
        ...defaultCoreConfig,
        api: {
          baseUrl: 'not-a-valid-url',
        },
      };

      // Should throw when trying to save invalid config
      await expect(configService.save()).rejects.toThrow('Cannot save invalid configuration');
    });

    it('should provide validation method', () => {
      const validConfig = {
        api: {
          baseUrl: 'https://api.example.com',
        },
        features: {
          enableDebugMode: true,
        },
      };

      const result = configService.validateConfig(validConfig);
      expect(result.success).toBe(true);

      const invalidConfig = {
        api: {
          baseUrl: 'not-a-valid-url',
        },
      };

      const invalidResult = configService.validateConfig(invalidConfig);
      expect(invalidResult.success).toBe(false);
      if (!invalidResult.success) {
        expect(invalidResult.errors.length).toBeGreaterThan(0);
      }
    });

    it('should handle validation errors gracefully', async () => {
      // Set configuration with multiple validation errors
      memoryProvider.setConfig({
        api: {
          baseUrl: 'not-a-valid-url',
          timeout: -1000, // Invalid negative timeout
        },
        ui: {
          theme: 'invalid-theme',
        },
      });

      // Should load successfully but skip invalid provider config
      await configService.load();

      // Should use default configuration
      const config = configService.getConfig();
      expect(config).toEqual(defaultCoreConfig);
    });
  });
});
