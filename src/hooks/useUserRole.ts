import { jwtDecode } from "jwt-decode";
import { getUserRole } from "../utils/getUserRole";
import { isTokenValid } from "../utils/auth";

interface JwtPayload {
  username?: string;
  role?: string;
}

export const getUsername = (): string => {
  const token = localStorage.getItem("access_token");
  if (!token || !isTokenValid(token)) return "";
  try {
    return jwtDecode<JwtPayload>(token).username ?? "";
  } catch {
    return "";
  }
};

export const useUserRole = () => {
  const role = getUserRole();
  return {
    role,
    username: getUsername(),
    isAdmin: role === "admin",
    /** Catalog/config/expense management: admins and managers. */
    canManage: role === "admin" || role === "manager",
    /** Stock operations (batches): admins, managers and warehouse staff. */
    canStock: role === "admin" || role === "manager" || role === "warehouse",
    /** Customer/sales creation: admins, managers and sales staff. */
    canSell: role === "admin" || role === "manager" || role === "sales",
  };
};
