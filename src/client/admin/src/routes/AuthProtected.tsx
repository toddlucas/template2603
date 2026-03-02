import { useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { setAccessToken } from "$/api";
import { useAuthentication } from "$/hooks/AuthHooks";
import { getCurrentToken } from "$/services/auth/authService";

const AuthProtected = () => {
  const { isAuthenticated, loading } = useAuthentication();

  useEffect(() => {
    if (import.meta.env.VITE_AUTH_TYPE === 'bearer') {
      // Ensure the access token is set for API calls after reload
      const token = getCurrentToken();
      if (isAuthenticated && token) {
        setAccessToken(token);
      }
    }
  }, [isAuthenticated]);

  if (loading) {
    // Optionally show a loading spinner or nothing while checking auth
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to={{ pathname: "/signin" }} />;
  }

  return <Outlet />;
};

export default AuthProtected;
