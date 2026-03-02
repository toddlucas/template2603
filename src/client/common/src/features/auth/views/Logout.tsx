import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";

const Logout = () => {
  const { user: { userModel }, logout } = useAuthStore();

  useEffect(() => {
    logout();
  }, [logout]);

  if (!userModel) {
    return <Navigate to="/" />;
  }

  return <></>;
};

export default Logout;
