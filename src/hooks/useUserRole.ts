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
    isAdmin: role === "admin",
    role,
    username: getUsername(),
  };
};
