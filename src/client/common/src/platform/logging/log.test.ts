import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LOG_LEVELS } from './constants';
import { getLogConfig } from './config';

// Mock console methods
const mockConsole = {
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
};

describe('Logging System', () => {
  beforeEach(() => {
    // Replace console methods
    global.console = mockConsole as any;
    vi.clearAllMocks();
  });

  it('should have correct log levels', () => {
    expect(LOG_LEVELS.NONE).toBe(0);
    expect(LOG_LEVELS.ERROR).toBe(1);
    expect(LOG_LEVELS.WARN).toBe(2);
    expect(LOG_LEVELS.INFO).toBe(3);
    expect(LOG_LEVELS.DEBUG).toBe(4);
    expect(LOG_LEVELS.VERBOSE).toBe(5);
  });

  it('should load log config from environment variables', () => {
    const mockEnv = {
      VITE_LOG_CONFIG: '5',
      VITE_LOG_PROVIDERS: '4',
      VITE_LOG_IPC: '3',
      VITE_LOG_PLATFORM: '2',
    };

    const config = getLogConfig(mockEnv);

    expect(config.PLATFORM).toBe(2); // VITE_LOG_PLATFORM=2
  });

  it('should enable log logging when level is sufficient', () => {
    const mockEnv = {
      VITE_LOG_PLATFORM: '5',
    };

    const config = getLogConfig(mockEnv);

    // Test that log statements work
    if (config.PLATFORM >= LOG_LEVELS.VERBOSE) {
      console.log('🔧 [PLATFORM] Test verbose message');
    }

    if (config.PLATFORM >= LOG_LEVELS.INFO) {
      console.log('🔧 [PLATFORM] Test info message');
    }

    expect(mockConsole.log).toHaveBeenCalledWith('🔧 [PLATFORM] Test verbose message');
    expect(mockConsole.log).toHaveBeenCalledWith('🔧 [PLATFORM] Test info message');
  });

  it('should not log when log level is too low', () => {
    const mockEnv = {
      VITE_LOG_PLATFORM: '1', // Only ERROR level
    };

    const config = getLogConfig(mockEnv);

    // Test that log statements are skipped when level is too low
    if (config.PLATFORM >= LOG_LEVELS.VERBOSE) {
      console.log('🖥️ [PLATFORM] This should not be logged');
    }

    expect(mockConsole.log).not.toHaveBeenCalledWith('🖥️ [PLATFORM] This should not be logged');
  });

  it('should handle missing environment variables gracefully', () => {
    const config = getLogConfig({});

    expect(config.PLATFORM).toBe(0); // Should default to NONE
  });
});
