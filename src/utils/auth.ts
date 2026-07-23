import { jwtDecode } from "jwt-decode";
import { queryClient } from "../query/queryClient";

interface TokenPayload {
  exp?: number;
}

export const isTokenValid = (token: string | null) => {
  if (!token) return false;

  try {
    const { exp } = jwtDecode<TokenPayload>(token);
    return typeof exp === "number" && exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

export const clearSession = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  queryClient.clear();
  window.dispatchEvent(new CustomEvent("akinfolu-auth-change"));
};
