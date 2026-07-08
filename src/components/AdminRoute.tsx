import { Navigate, Outlet } from "react-router-dom";
import { useUserRole } from "../hooks/useUserRole";

/** Guards management screens: admins and managers only. */
const AdminRoute = () => {
  const { canManage } = useUserRole();
  return canManage ? <Outlet /> : <Navigate to="/sales" replace />;
};

export default AdminRoute;
