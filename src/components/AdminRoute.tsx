import { Navigate, Outlet } from "react-router-dom";
import { useUserRole } from "../hooks/useUserRole";

const AdminRoute = () => {
  const { isAdmin } = useUserRole();
  return isAdmin ? <Outlet /> : <Navigate to="/home" replace />;
};

export default AdminRoute;
