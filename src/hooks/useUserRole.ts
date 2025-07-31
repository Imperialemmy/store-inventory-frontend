import { getUserRole } from "../utils/getUserRole";

export const useUserRole = () => {
  const role = getUserRole();
  return {
    isAdmin: role === "admin",
    role,
  };
};
