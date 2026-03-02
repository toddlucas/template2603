import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authManager } from './authManager';

describe('AuthManager', () => {
  beforeEach(() => {
    // Clear all callbacks before each test
    // Note: This is a bit of a hack since we don't expose a clear method
    // In a real implementation, we might want to add a reset method for testing
    vi.clearAllMocks();
  });

  describe('registerLogoutCallback', () => {
    it('should register a callback', () => {
      const callback = vi.fn();
      authManager.registerLogoutCallback(callback);

      // Trigger logout
      authManager.triggerLogout();

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should register multiple callbacks', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      authManager.registerLogoutCallback(callback1);
      authManager.registerLogoutCallback(callback2);

      // Trigger logout
      authManager.triggerLogout();

      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
    });
  });

  describe('unregisterLogoutCallback', () => {
    it('should unregister a callback', () => {
      const callback = vi.fn();

      authManager.registerLogoutCallback(callback);
      authManager.unregisterLogoutCallback(callback);

      // Trigger logout
      authManager.triggerLogout();

      expect(callback).not.toHaveBeenCalled();
    });

    it('should only unregister the specified callback', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      authManager.registerLogoutCallback(callback1);
      authManager.registerLogoutCallback(callback2);
      authManager.unregisterLogoutCallback(callback1);

      // Trigger logout
      authManager.triggerLogout();

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalledTimes(1);
    });
  });

  describe('triggerLogout', () => {
    it('should call all registered callbacks', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const callback3 = vi.fn();

      authManager.registerLogoutCallback(callback1);
      authManager.registerLogoutCallback(callback2);
      authManager.registerLogoutCallback(callback3);

      // Trigger logout
      authManager.triggerLogout();

      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
      expect(callback3).toHaveBeenCalledTimes(1);
    });

    it('should handle callback errors gracefully', () => {
      const errorCallback = vi.fn().mockImplementation(() => {
        throw new Error('Callback error');
      });
      const normalCallback = vi.fn();

      authManager.registerLogoutCallback(errorCallback);
      authManager.registerLogoutCallback(normalCallback);

      // Trigger logout - should not throw
      expect(() => authManager.triggerLogout()).not.toThrow();

      expect(errorCallback).toHaveBeenCalledTimes(1);
      expect(normalCallback).toHaveBeenCalledTimes(1);
    });

    it('should work with no registered callbacks', () => {
      // Trigger logout with no callbacks - should not throw
      expect(() => authManager.triggerLogout()).not.toThrow();
    });
  });
});
