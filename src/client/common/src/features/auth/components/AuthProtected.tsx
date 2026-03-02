import { useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { setAccessToken } from "../../../api";
import { useAuthentication } from "../../../hooks/AuthHooks";
import { getCurrentToken } from "../../../services/auth/authService";

const AuthProtected = () => {
  const { isAuthenticated, loading } = useAuthentication();

  useEffect(() => {
    if (import.meta.env.VITE_AUTH_TYPE === 'bearer') {
      const token = getCurrentToken();
      if (isAuthenticated && token) {
        setAccessToken(token);
      }
    }
  }, [isAuthenticated]);

  if (import.meta.env.VITE_SKIP_AUTH === 'true') {
    return <Outlet />;
  }

  if (loading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to={{ pathname: "/signin" }} />;
  }

  return <Outlet />;
};

export default AuthProtected;
