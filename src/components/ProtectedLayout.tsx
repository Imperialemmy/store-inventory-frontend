import { Outlet, Navigate } from "react-router-dom";
import { clearSession, isTokenValid } from "../utils/auth";

const ProtectedLayout = () => {
  const token = localStorage.getItem("access_token");
  const refreshToken = localStorage.getItem("refresh_token");
  // An expired access token must not lock the seller out of locally cached
  // products or queued sales. The API client refreshes it once connected.
  if (!isTokenValid(token) && !(token && refreshToken)) {
    clearSession();
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedLayout;
