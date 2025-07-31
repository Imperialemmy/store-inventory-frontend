import { jwtDecode } from 'jwt-decode';

interface JwtPayload {
  user_id: number;
  username: string;
  role: 'admin' | 'user';
  exp: number;
}

export function getUserRole(): 'admin' | 'user' {
  const token = localStorage.getItem('access_token');
  if (!token) {
    console.warn("[getUserRole] No token found");
    return 'user';
  }

  try {
    const decoded = jwtDecode<JwtPayload>(token);
    // console.log('[getUserRole] Decoded token:', decoded); // 👈 Check this in the browser console
    return decoded.role;
  } catch (error) {
    console.error('[getUserRole] Failed to decode token:', error);
    return 'user';
  }
}
