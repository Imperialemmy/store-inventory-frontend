import { Outlet, Navigate } from "react-router-dom";
import { clearSession, isTokenValid } from "../utils/auth";

const ProtectedLayout = () => {
  const token = localStorage.getItem("access_token");
  if (!isTokenValid(token)) {
    clearSession();
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedLayout;
