// PLATFORM Log Configuration Test
// This file tests the PLATFORM log configuration and logging

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LOG_CONFIG, getLogConfig } from './config';
import { LOG_LEVELS } from './constants';

describe('PLATFORM Log Configuration', () => {
  let consoleSpy: any;

  beforeEach(() => {
    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      info: vi.spyOn(console, 'info').mockImplementation(() => {})
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should have PLATFORM log configuration', () => {
    expect(LOG_CONFIG).toHaveProperty('PLATFORM');
    expect(typeof LOG_CONFIG.PLATFORM).toBe('number');
  });

  it('should load PLATFORM log config from environment variables', () => {
    const mockEnv = {
      VITE_LOG_PLATFORM: '4'
    };

    const config = getLogConfig(mockEnv);
    expect(config.PLATFORM).toBe(4);
  });

  it('should default PLATFORM to NONE when not set', () => {
    const mockEnv = {};

    const config = getLogConfig(mockEnv);
    expect(config.PLATFORM).toBe(LOG_LEVELS.NONE);
  });

  it('should respect PLATFORM log levels', () => {
    // Test that log logging respects the configured level
    const testMessage = 'Test PLATFORM log message';

    // Mock LOG_CONFIG.PLATFORM to different levels
    const originalAIService = LOG_CONFIG.PLATFORM;

    // Test with NONE level
    Object.defineProperty(LOG_CONFIG, 'PLATFORM', { value: LOG_LEVELS.NONE });
    if (LOG_CONFIG.PLATFORM >= LOG_LEVELS.DEBUG) console.log(testMessage);
    expect(consoleSpy.log).not.toHaveBeenCalled();

    // Test with DEBUG level
    Object.defineProperty(LOG_CONFIG, 'PLATFORM', { value: LOG_LEVELS.DEBUG });
    if (LOG_CONFIG.PLATFORM >= LOG_LEVELS.DEBUG) console.log('🚀 [PLATFORM] ' + testMessage);
    expect(consoleSpy.log).toHaveBeenCalledWith('🚀 [PLATFORM] ' + testMessage);

    // Test with VERBOSE level
    Object.defineProperty(LOG_CONFIG, 'PLATFORM', { value: LOG_LEVELS.VERBOSE });
    if (LOG_CONFIG.PLATFORM >= LOG_LEVELS.VERBOSE) console.log('📝 [PLATFORM] ' + testMessage);
    expect(consoleSpy.log).toHaveBeenCalledWith('📝 [PLATFORM] ' + testMessage);

    // Restore original value
    Object.defineProperty(LOG_CONFIG, 'PLATFORM', { value: originalAIService });
  });

  it('should support different PLATFORM log prefixes', () => {
    const originalAIService = LOG_CONFIG.PLATFORM;
    Object.defineProperty(LOG_CONFIG, 'PLATFORM', { value: LOG_LEVELS.DEBUG });

    // Test different log prefixes
    if (LOG_CONFIG.PLATFORM >= LOG_LEVELS.DEBUG) {
      console.log('🚀 [PLATFORM] Service initialized');
      console.log('📨 [PLATFORM] Processing message');
      console.log('🔨 [PLATFORM] Building projection');
      console.log('✅ [PLATFORM] Operation completed');
      console.log('❌ [PLATFORM] Operation failed');
      console.log('⚠️ [PLATFORM] Warning message');
    }

    expect(consoleSpy.log).toHaveBeenCalledWith('🚀 [PLATFORM] Service initialized');
    expect(consoleSpy.log).toHaveBeenCalledWith('📨 [PLATFORM] Processing message');
    expect(consoleSpy.log).toHaveBeenCalledWith('🔨 [PLATFORM] Building projection');
    expect(consoleSpy.log).toHaveBeenCalledWith('✅ [PLATFORM] Operation completed');
    expect(consoleSpy.log).toHaveBeenCalledWith('❌ [PLATFORM] Operation failed');
    expect(consoleSpy.log).toHaveBeenCalledWith('⚠️ [PLATFORM] Warning message');

    // Restore original value
    Object.defineProperty(LOG_CONFIG, 'PLATFORM', { value: originalAIService });
  });
});
