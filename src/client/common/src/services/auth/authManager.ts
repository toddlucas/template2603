import { setAccessToken } from '../../api';
import { LOG_CONFIG, LOG_LEVELS } from '../../platform/logging';

/**
 * Auth manager that coordinates between auth service and auth store
 * This avoids circular dependencies and dynamic imports
 */
class AuthManager {
  private logoutCallbacks: (() => void)[] = [];

  /**
   * Register a logout callback
   */
  registerLogoutCallback(callback: () => void) {
    this.logoutCallbacks.push(callback);
  }

  /**
   * Unregister a logout callback
   */
  unregisterLogoutCallback(callback: () => void) {
    this.logoutCallbacks = this.logoutCallbacks.filter(cb => cb !== callback);
  }

  /**
   * Trigger logout for all registered callbacks
   */
  triggerLogout() {
    if (LOG_CONFIG.AUTH >= LOG_LEVELS.WARN) console.warn('🔐 [AUTH] AuthManager: Triggering logout for all registered callbacks');

    // Clear the access token first
    setAccessToken('');

    // Notify all registered callbacks
    this.logoutCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        if (LOG_CONFIG.AUTH >= LOG_LEVELS.ERROR) console.error('🔐 [AUTH] Error in logout callback:', error);
      }
    });
  }
}

// Export singleton instance
export const authManager = new AuthManager();
