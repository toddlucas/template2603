import { useEffect, useState } from "react";
import { LOG_CONFIG, LOG_LEVELS } from "../platform/logging";
import { setAccessToken } from "../api";
import { getLoggedInUser, getCurrentToken, getStoredAuthExpiry } from "../services/auth/authService";
import type { IdentityUserModel } from "../models/identity-user-model";
import { useAuthStore } from '../features/auth/stores/authStore';

/**
 * Simple hook for getting authentication status with expiry detection
 * Returns just the authentication state without user details
 *
 * Use this when you only need to know if the user is authenticated
 * and don't need user details or sign-out functionality
 *
 * @returns { isAuthenticated: boolean, loading: boolean, expiringSoon: boolean }
 *
 * @example
 * ```tsx
 * const { isAuthenticated, loading, expiringSoon } = useAuthStatus();
 *
 * if (loading) return <div>Checking...</div>;
 * return isAuthenticated ? <ProtectedContent /> : <LoginPrompt />;
 * ```
 */
export const useAuthStatus = (bufferMinutes = 5) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expiringSoon, setExpiringSoon] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const user = getLoggedInUser();
      let expiry = null;
      if (import.meta.env.VITE_AUTH_TYPE === 'bearer') {
        const token = getCurrentToken();
        const expiry = getStoredAuthExpiry();
        if (!user || !token || !expiry) {
          setIsAuthenticated(false);
          setExpiringSoon(false);
          setAccessToken('');
          setLoading(false);
          return;
        }

        if (LOG_CONFIG.AUTH >= LOG_LEVELS.DEBUG) console.log('🔐 [AUTH] setting access token', token);
        setAccessToken(token);
      } else {
        const expiry = getStoredAuthExpiry();
        if (!user || !expiry) {
          setIsAuthenticated(false);
          setExpiringSoon(false);
          setAccessToken('');
          setLoading(false);
          return;
        }

        if (LOG_CONFIG.AUTH >= LOG_LEVELS.DEBUG) console.log('🔐 [AUTH] validated access cookie');
        setAccessToken('');
      }

      if (expiry) {
        const msUntilExpiry = expiry - Date.now();
        setIsAuthenticated(msUntilExpiry > 0);
        setExpiringSoon(msUntilExpiry > 0 && msUntilExpiry <= bufferMinutes * 60 * 1000);
        setLoading(false);
      }
    };

    checkAuth();
    const interval = setInterval(checkAuth, 30000);
    return () => clearInterval(interval);
  }, [bufferMinutes]);

  return { isAuthenticated, loading, expiringSoon };
};

/**
 * Enhanced authentication hook that combines user presence with expiry detection
 * Provides real-time authentication status with automatic updates
 *
 * Use this when you need user details, sign-out functionality, or want to
 * react to authentication state changes
 *
 * Features:
 * - Automatic expiry check every 30 seconds
 * - Real-time updates when auth state changes
 * - User details when authenticated
 * - Sign-out functionality
 * - Loading state management
 *
 * @returns {
 *   isAuthenticated: boolean,
 *   user: IdentityUserModel | null,
 *   loading: boolean,
 *   expiringSoon: boolean,
 *   signOut: () => void
 * }
 *
 * @example
 * ```tsx
 * const { isAuthenticated, user, loading, expiringSoon, signOut } = useAuthentication();
 *
 * if (loading) return <div>Checking authentication...</div>;
 *
 * return (
 *   <div>
 *     {isAuthenticated ? (
 *       <div>
 *         Welcome, {user?.email}!
 *         <button onClick={signOut}>Sign Out</button>
 *       </div>
 *     ) : (
 *       <Link to="/signin">Sign In</Link>
 *     )}
 *   </div>
 * );
 * ```
 */
export const useAuthenticationLegacy = (bufferMinutes = 5) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<IdentityUserModel<string> | null>(null);
  const [loading, setLoading] = useState(true);
  const [expiringSoon, setExpiringSoon] = useState(false);

  useEffect(() => {
    const checkAuthentication = () => {
      // NOTE: We don't need to check the expiry for cookies for legacy.
      if (import.meta.env.VITE_AUTH_TYPE === 'bearer') {
        const currentUser = getLoggedInUser();
        const token = getCurrentToken();
        const expiry = getStoredAuthExpiry();
        if (!currentUser || !token || !expiry) {
          setIsAuthenticated(false);
          setUser(null);
          setAccessToken('');
          setExpiringSoon(false);
          setLoading(false);
          return;
        }

        const msUntilExpiry = expiry - Date.now();
        setIsAuthenticated(msUntilExpiry > 0);
        setUser(msUntilExpiry > 0 ? currentUser : null);
        setAccessToken(token);
        setExpiringSoon(msUntilExpiry > 0 && msUntilExpiry <= bufferMinutes * 60 * 1000);
        setLoading(false);
      };
    }

    checkAuthentication();
    const interval = setInterval(checkAuthentication, 30000);
    const handleStorageChange = () => { checkAuthentication(); };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [bufferMinutes]);

  const signOut = () => {
    if (import.meta.env.VITE_AUTH_TYPE === 'bearer') {
      sessionStorage.removeItem("authAccessToken");
      sessionStorage.removeItem("authRefreshToken");
    } else {
    }

    sessionStorage.removeItem("authUserModel");
    sessionStorage.removeItem("authExpiry");

    setIsAuthenticated(false);
    setUser(null);
    setExpiringSoon(false);
  };

  return {
    isAuthenticated,
    user,
    loading,
    expiringSoon,
    signOut
  };
};

/**
 * Simple authentication hook using the auth store
 * Use this for basic authentication checks
 */
export function useAuthentication() {
  const { user: { userModel }, user: { status } } = useAuthStore();
  const isAuthenticated = !!userModel;
  const loading = status === 'loading';

  return { isAuthenticated, loading };
}

/**
 * Enhanced authentication hook that handles project initialization
 * Use this when you need project context to be initialized after authentication
 *
 * NOTE: Project initialization is now handled by ProjectManager via events
 * This hook is kept for backward compatibility but no longer manages initialization
 */
export function useAuthenticationWithProjectInit() {
  const { user: { userModel }, user: { status } } = useAuthStore();

  const isAuthenticated = !!userModel;
  const loading = status === 'loading';

  return {
    isAuthenticated,
    loading
  };
}

/**
 * Hook for accessing user profile information
 * @deprecated Use useAuthentication() instead for better expiry detection
 */
export const useProfile = () => {
  const userModel = getLoggedInUser();
  const expiry = getStoredAuthExpiry();

  let loadingInit = false;
  let token = '' as string | null;
  if (import.meta.env.VITE_AUTH_TYPE === 'bearer') {
    token = getCurrentToken();
    loadingInit = !userModel || !token || !expiry;
  } else {
    loadingInit = !userModel || !expiry;
  }

  const [loading, setLoading] = useState(loadingInit);
  const [userProfile, setUserProfile] = useState(userModel);

  useEffect(() => {
    const userModel = getLoggedInUser();
    const expiry = getStoredAuthExpiry();
    let token = '' as string | null;
    if (import.meta.env.VITE_AUTH_TYPE === 'bearer') {
      token = getCurrentToken();
    }
    setUserProfile(userModel);
    setLoading(!token || !expiry);
  }, []);

  return { userProfile, loading, token, expiry };
};
