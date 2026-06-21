import { jwtDecode } from 'jwt-decode';
import { isTokenValid } from './auth';

interface JwtPayload {
  user_id: number;
  username: string;
  role: 'admin' | 'user';
  exp: number;
}

export function getUserRole(): 'admin' | 'user' {
  const token = localStorage.getItem('access_token');
  if (!token || !isTokenValid(token)) {
    return 'user';
  }

  try {
    const decoded = jwtDecode<JwtPayload>(token);
    // console.log('[getUserRole] Decoded token:', decoded); // 👈 Check this in the browser console
    return decoded.role === 'admin' ? 'admin' : 'user';
  } catch (error) {
    console.error('[getUserRole] Failed to decode token:', error);
    return 'user';
  }
}
