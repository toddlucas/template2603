import { describe, it, expect, beforeEach } from 'vitest';
import { EnvironmentProvider, parseEnvironmentConfig } from './providers/EnvironmentProvider';

describe('EnvironmentProvider', () => {
  let provider: EnvironmentProvider;

  beforeEach(() => {
    provider = new EnvironmentProvider();
  });

  it('should load configuration from VITE_ environment variables', async () => {
    const mockEnv = {
      VITE_API_BASE_URL: 'https://test-api.example.com',
      VITE_LOG_MODE: 'true',
      VITE_THEME: 'dark',
      VITE_FEATURE_ADVANCED: 'true',
      VITE_WEB_STORAGE_PREFIX: 'test_',
    };

    const config = parseEnvironmentConfig(mockEnv);

    expect(config.api?.baseUrl).toBe('https://test-api.example.com');
    expect(config.features?.enableDebugMode).toBe(true);
    expect(config.ui?.theme).toBe('dark');
    expect(config.features?.enableAdvancedFeatures).toBe(true);
    expect(config.web?.storage?.localStoragePrefix).toBe('test_');
  });

  it('should handle boolean environment variables correctly', async () => {
    const mockEnv = {
      VITE_LOG_MODE: 'true',
      VITE_FEATURE_ADVANCED: 'true',
    };

    const config = parseEnvironmentConfig(mockEnv);

    expect(config.features?.enableDebugMode).toBe(true);
    expect(config.features?.enableAdvancedFeatures).toBe(true);
  });

  it('should not save configuration (read-only)', async () => {
    expect(provider.canSave()).toBe(false);

    await expect(provider.save()).rejects.toThrow('Environment variables cannot be saved');
  });

  it('should have highest priority', () => {
    expect(provider.getPriority()).toBe(200);
  });

  it('should handle missing environment variables gracefully', async () => {
    const config = parseEnvironmentConfig({});

    expect(config).toEqual({});
  });
});
