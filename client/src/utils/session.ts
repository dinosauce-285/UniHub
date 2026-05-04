import type { AuthUser } from '../types/auth';

const TOKEN_KEY = 'unihub.accessToken';
const REFRESH_TOKEN_KEY = 'unihub.refreshToken';
const USER_KEY = 'unihub.user';

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  const value = localStorage.getItem(USER_KEY);
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as AuthUser;
  } catch {
    clearStoredAuth();
    return null;
  }
}

export function storeAuth(
  accessToken: string,
  refreshToken: string,
  user: AuthUser,
) {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function storeAccessToken(accessToken: string) {
  localStorage.setItem(TOKEN_KEY, accessToken);
}

export function clearStoredAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem('token');
  window.dispatchEvent(new Event('unihub:auth-cleared'));
}
