/**
 * JWT token payload interface
 */
interface JWTPayload {
  exp: number;
  iat: number;
  sub: string;
  [key: string]: any;
}

import { authManager } from './authManager';
import type { IdentityUserModel } from '../../models/identity-user-model';
import { LOG_CONFIG, LOG_LEVELS } from '../../platform/logging';

/**
 * Register a callback to be called when logout is triggered
 */
export const registerLogoutCallback = (callback: () => void) => {
  authManager.registerLogoutCallback(callback);
};

/**
 * Unregister a logout callback
 */
export const unregisterLogoutCallback = (callback: () => void) => {
  authManager.unregisterLogoutCallback(callback);
};

/**
 * Decode JWT token without verification (client-side only)
 * @param token JWT token string
 * @returns Decoded payload or null if invalid
 */
export const decodeJWT = (token: string): JWTPayload | null => {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;

    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));
    return payload;
  } catch {
    return null;
  }
};

/**
 * Check if JWT token is expired or will expire soon
 * @param token JWT token string
 * @param bufferMinutes Minutes before expiry to consider token expired (default: 5)
 * @returns true if token is expired or will expire within buffer time
 */
export const isTokenExpired = (token: string, bufferMinutes = 5): boolean => {
  const payload = decodeJWT(token);
  if (!payload?.exp) return true;

  const expiryTime = payload.exp * 1000; // Convert to milliseconds
  const bufferTime = bufferMinutes * 60 * 1000;

  return Date.now() >= (expiryTime - bufferTime);
};

/**
 * Get token expiry time as Date object
 * @param token JWT token string
 * @returns Date object of expiry time or null if invalid
 */
export const getTokenExpiry = (token: string): Date | null => {
  const payload = decodeJWT(token);
  if (!payload?.exp) return null;

  return new Date(payload.exp * 1000);
};

/**
 * Get time until token expires in milliseconds
 * @param token JWT token string
 * @returns Milliseconds until expiry, negative if already expired
 */
export const getTimeUntilExpiry = (token: string): number => {
  const payload = decodeJWT(token);
  if (!payload?.exp) return -1;

  const expiryTime = payload.exp * 1000;
  return expiryTime - Date.now();
};

/**
 * Global 401 error handler
 * This function can be called from anywhere in the application
 * to handle authentication failures consistently
 */
export const handleGlobal401Error = (): void => {
  if (LOG_CONFIG.AUTH >= LOG_LEVELS.WARN) console.warn('🔐 [AUTH] Global 401 error detected - triggering logout');
  authManager.triggerLogout();
};

/**
 * Check if current token is valid and handle expiry
 * @param token Current JWT token
 * @param bufferMinutes Minutes before expiry to consider token expired
 * @returns true if token is valid, false if expired (and logout triggered)
 */
export const validateAndHandleTokenExpiry = (token: string, bufferMinutes = 5): boolean => {
  if (!token) {
    // TEMPORARILY DISABLED FOR TESTING CLIENT-SIDE JWT VALIDATION
    // handleGlobal401Error();
    if (LOG_CONFIG.AUTH >= LOG_LEVELS.WARN) console.warn('🔐 [AUTH] No token found - would trigger logout');
    return false;
  }

  if (isTokenExpired(token, bufferMinutes)) {
    if (LOG_CONFIG.AUTH >= LOG_LEVELS.WARN) console.warn('🔐 [AUTH] Token expired or expiring soon - would trigger logout');
    // TEMPORARILY DISABLED FOR TESTING CLIENT-SIDE JWT VALIDATION
    // handleGlobal401Error();
    return false;
  }

  return true;
};

/**
 * Get current token from session storage
 * @returns Current JWT token or null
 */
export const getCurrentToken = (): string | null => {
  return sessionStorage.getItem('authAccessToken');
};

/**
 * Gets the logged-in user from session storage
 * @returns The user model or null if not found
 */
export const getLoggedInUser = (): IdentityUserModel<string> | null => {
  const user = sessionStorage.getItem("authUserModel");
  return (user ? JSON.parse(user) : null) as IdentityUserModel<string>;
};

/**
 * Gets the absolute expiry time (ms since epoch) from session storage
 * @returns Expiry time in milliseconds or null if not found
 */
export const getStoredAuthExpiry = (): number | null => {
  const expiry = sessionStorage.getItem('authExpiry');
  // return expiry ? parseInt(expiry, 10) : null;
  return expiry ? new Date(expiry).getTime() : null;
};

/**
 * Check if user is authenticated (has valid token, user, and not expired)
 * @returns true if user is authenticated, false otherwise
 */
export const isUserAuthenticated = (): boolean => {
  const user = getLoggedInUser();
  const expiry = getStoredAuthExpiry();

  let token = '' as string | null;
  let isValidSession = false;
  const isValidExpiry = expiry ? Date.now() < expiry : false;
  if (import.meta.env.VITE_AUTH_TYPE === 'bearer') {
    token = getCurrentToken();
    isValidSession = !!(token && user && isValidExpiry);
  } else {
    isValidSession = !!(user && isValidExpiry);
  }

  if (!isValidSession) {
    return false;
  }

  return isValidExpiry;
};

/**
 * Logout session (clears tokens)
 */
export const logoutSession = (): void => {
  if (import.meta.env.VITE_AUTH_TYPE === 'bearer') {
    sessionStorage.removeItem("authAccessToken");
    sessionStorage.removeItem("authRefreshToken");
  }

  sessionStorage.removeItem("authExpiry");
};

/**
 * Logout user (clears user data)
 */
export const logoutUser = (): void => {
  sessionStorage.removeItem("authUserModel");
};

/**
 * Complete logout (clears all auth data)
 */
export const logout = (): void => {
  logoutSession();
  logoutUser();
};

/**
 * Validate current token and handle expiry
 * @param bufferMinutes Minutes before expiry to consider token expired
 * @returns true if token is valid, false if expired (and logout triggered)
 */
export const validateCurrentToken = (bufferMinutes = 5): boolean => {
  const token = getCurrentToken();
  return validateAndHandleTokenExpiry(token || '', bufferMinutes);
};
