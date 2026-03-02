// MVP Log Categories Configuration Test
// This file tests the MVP feature log categories

import { describe, it, expect } from 'vitest';
import { LOG_CONFIG, getLogConfig } from './config';
import { LOG_LEVELS } from './constants';

describe('MVP Log Categories', () => {
  describe('Platform & Infrastructure Categories', () => {
    it('should have all platform log categories', () => {
      expect(LOG_CONFIG).toHaveProperty('CONFIG');
      expect(LOG_CONFIG).toHaveProperty('DI');
      expect(LOG_CONFIG).toHaveProperty('EVENT');
      expect(LOG_CONFIG).toHaveProperty('PLATFORM');
      expect(LOG_CONFIG).toHaveProperty('AUTH');

      expect(typeof LOG_CONFIG.CONFIG).toBe('number');
      expect(typeof LOG_CONFIG.DI).toBe('number');
      expect(typeof LOG_CONFIG.EVENT).toBe('number');
      expect(typeof LOG_CONFIG.PLATFORM).toBe('number');
      expect(typeof LOG_CONFIG.AUTH).toBe('number');
    });
  });

  describe('MVP Feature Categories', () => {
    it('should have all MVP feature log categories', () => {
      expect(LOG_CONFIG).toHaveProperty('CONTACTS');
      expect(LOG_CONFIG).toHaveProperty('SEQUENCES');
      expect(LOG_CONFIG).toHaveProperty('AI');
      expect(LOG_CONFIG).toHaveProperty('EMAIL');
      expect(LOG_CONFIG).toHaveProperty('INBOX');
      expect(LOG_CONFIG).toHaveProperty('ANALYTICS');

      expect(typeof LOG_CONFIG.CONTACTS).toBe('number');
      expect(typeof LOG_CONFIG.SEQUENCES).toBe('number');
      expect(typeof LOG_CONFIG.AI).toBe('number');
      expect(typeof LOG_CONFIG.EMAIL).toBe('number');
      expect(typeof LOG_CONFIG.INBOX).toBe('number');
      expect(typeof LOG_CONFIG.ANALYTICS).toBe('number');
    });
  });

  describe('Environment Variable Loading', () => {
    it('should load CONTACTS log config from environment', () => {
      const mockEnv = { VITE_LOG_CONTACTS: '4' };
      const config = getLogConfig(mockEnv);
      expect(config.CONTACTS).toBe(4);
    });

    it('should load SEQUENCES log config from environment', () => {
      const mockEnv = { VITE_LOG_SEQUENCES: '5' };
      const config = getLogConfig(mockEnv);
      expect(config.SEQUENCES).toBe(5);
    });

    it('should load AI log config from environment', () => {
      const mockEnv = { VITE_LOG_AI: '4' };
      const config = getLogConfig(mockEnv);
      expect(config.AI).toBe(4);
    });

    it('should load EMAIL log config from environment', () => {
      const mockEnv = { VITE_LOG_EMAIL: '3' };
      const config = getLogConfig(mockEnv);
      expect(config.EMAIL).toBe(3);
    });

    it('should load INBOX log config from environment', () => {
      const mockEnv = { VITE_LOG_INBOX: '4' };
      const config = getLogConfig(mockEnv);
      expect(config.INBOX).toBe(4);
    });

    it('should load ANALYTICS log config from environment', () => {
      const mockEnv = { VITE_LOG_ANALYTICS: '3' };
      const config = getLogConfig(mockEnv);
      expect(config.ANALYTICS).toBe(3);
    });
  });

  describe('Default Values', () => {
    it('should default all MVP categories to NONE when not set', () => {
      const mockEnv = {};
      const config = getLogConfig(mockEnv);

      expect(config.CONTACTS).toBe(LOG_LEVELS.NONE);
      expect(config.SEQUENCES).toBe(LOG_LEVELS.NONE);
      expect(config.AI).toBe(LOG_LEVELS.NONE);
      expect(config.EMAIL).toBe(LOG_LEVELS.NONE);
      expect(config.INBOX).toBe(LOG_LEVELS.NONE);
      expect(config.ANALYTICS).toBe(LOG_LEVELS.NONE);
    });
  });

  describe('Multiple Categories Configuration', () => {
    it('should support configuring multiple categories simultaneously', () => {
      const mockEnv = {
        VITE_LOG_CONTACTS: '4',
        VITE_LOG_SEQUENCES: '5',
        VITE_LOG_AI: '4',
        VITE_LOG_EMAIL: '3',
        VITE_LOG_INBOX: '4',
        VITE_LOG_ANALYTICS: '3',
      };

      const config = getLogConfig(mockEnv);

      expect(config.CONTACTS).toBe(4);
      expect(config.SEQUENCES).toBe(5);
      expect(config.AI).toBe(4);
      expect(config.EMAIL).toBe(3);
      expect(config.INBOX).toBe(4);
      expect(config.ANALYTICS).toBe(3);
    });
  });

  describe('Invalid Values', () => {
    it('should handle invalid numeric values gracefully', () => {
      const mockEnv = {
        VITE_LOG_CONTACTS: 'invalid',
        VITE_LOG_AI: 'NaN',
      };

      const config = getLogConfig(mockEnv);

      // parseInt of invalid strings returns NaN, which should be coerced to NONE
      expect(config.CONTACTS).toBe(LOG_LEVELS.NONE);
      expect(config.AI).toBe(LOG_LEVELS.NONE);
    });
  });

  describe('Usage Patterns', () => {
    it('should support typical development configuration', () => {
      const devEnv = {
        VITE_LOG_CONFIG: '3',
        VITE_LOG_DI: '3',
        VITE_LOG_EVENT: '4',
        VITE_LOG_PLATFORM: '3',
        VITE_LOG_AUTH: '4',
        VITE_LOG_CONTACTS: '4',
        VITE_LOG_SEQUENCES: '4',
        VITE_LOG_AI: '4',
        VITE_LOG_EMAIL: '4',
        VITE_LOG_INBOX: '4',
        VITE_LOG_ANALYTICS: '3',
      };

      const config = getLogConfig(devEnv);

      // Verify typical development settings
      expect(config.CONTACTS).toBe(LOG_LEVELS.DEBUG);
      expect(config.AI).toBe(LOG_LEVELS.DEBUG);
      expect(config.ANALYTICS).toBe(LOG_LEVELS.INFO);
    });

    it('should support production configuration (all disabled)', () => {
      const prodEnv = {
        VITE_LOG_CONFIG: '0',
        VITE_LOG_DI: '0',
        VITE_LOG_EVENT: '0',
        VITE_LOG_PLATFORM: '0',
        VITE_LOG_AUTH: '0',
        VITE_LOG_CONTACTS: '0',
        VITE_LOG_SEQUENCES: '0',
        VITE_LOG_AI: '0',
        VITE_LOG_EMAIL: '0',
        VITE_LOG_INBOX: '0',
        VITE_LOG_ANALYTICS: '0',
      };

      const config = getLogConfig(prodEnv);

      // Verify all are disabled for production tree-shaking
      expect(config.CONTACTS).toBe(LOG_LEVELS.NONE);
      expect(config.SEQUENCES).toBe(LOG_LEVELS.NONE);
      expect(config.AI).toBe(LOG_LEVELS.NONE);
      expect(config.EMAIL).toBe(LOG_LEVELS.NONE);
      expect(config.INBOX).toBe(LOG_LEVELS.NONE);
      expect(config.ANALYTICS).toBe(LOG_LEVELS.NONE);
    });
  });
});

