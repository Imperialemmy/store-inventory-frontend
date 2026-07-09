import { jwtDecode } from 'jwt-decode';
import { isTokenValid } from './auth';

export type Role = 'admin' | 'seller' | 'user';

const ROLES: Role[] = ['admin', 'seller', 'user'];

interface JwtPayload {
  user_id: number;
  username: string;
  role: string;
  exp: number;
}

export function getUserRole(): Role {
  const token = localStorage.getItem('access_token');
  if (!token || !isTokenValid(token)) {
    return 'user';
  }

  try {
    const decoded = jwtDecode<JwtPayload>(token);
    return (ROLES as string[]).includes(decoded.role) ? (decoded.role as Role) : 'user';
  } catch (error) {
    console.error('[getUserRole] Failed to decode token:', error);
    return 'user';
  }
}
