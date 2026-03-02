import { useEffect, useRef } from 'react';
import { validateCurrentToken, getCurrentToken, getTimeUntilExpiry } from '../services/auth/authService';

interface UseTokenValidationOptions {
  /** Check token on mount */
  checkOnMount?: boolean;
  /** Interval in milliseconds to check token (default: 60000 = 1 minute) */
  checkInterval?: number;
  /** Minutes before expiry to consider token expired (default: 5) */
  bufferMinutes?: number;
  /** Whether to enable automatic background checking */
  enableBackgroundCheck?: boolean;
}

/**
 * Hook for proactive token validation
 * Can be used in components to ensure tokens are valid before making API calls
 */
export const useTokenValidation = (options: UseTokenValidationOptions = {}) => {
  const {
    checkOnMount = true,
    checkInterval = 60000, // 1 minute
    bufferMinutes = 5,
    enableBackgroundCheck = true
  } = options;

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Function to validate current token
  const validateToken = () => {
    return validateCurrentToken(bufferMinutes);
  };

  // Function to get time until token expires
  const getExpiryTime = () => {
    const token = getCurrentToken();
    if (!token) return -1;
    return getTimeUntilExpiry(token);
  };

  // Check token on mount
  useEffect(() => {
    if (checkOnMount) {
      validateToken();
    }
  }, [checkOnMount]);

  // Set up background checking
  useEffect(() => {
    if (!enableBackgroundCheck) return;

    intervalRef.current = setInterval(() => {
      validateToken();
    }, checkInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enableBackgroundCheck, checkInterval]);

  return {
    validateToken,
    getExpiryTime,
    isTokenValid: () => validateCurrentToken(bufferMinutes)
  };
};
