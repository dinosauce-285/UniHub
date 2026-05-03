import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { loginRequest, logoutRequest, refreshRequest } from './api';
import {
  clearStoredAuth,
  getStoredRefreshToken,
  getStoredToken,
  getStoredUser,
  storeAuth,
} from './session';
import type { AuthResponse, AuthUser, LoginCredentials } from './types';

type AuthState = {
  accessToken: string | null;
  user: AuthUser | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  refresh: () => Promise<AuthResponse | null>;
  logout: () => Promise<void>;
  clear: () => void;
};

function clearLocalState() {
  useAuthStore.setState({ accessToken: null, user: null });
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: getStoredToken(),
  user: getStoredUser(),
  async login(credentials) {
    const result = await loginRequest({
      email: credentials.email.trim().toLowerCase(),
      password: credentials.password,
    });

    storeAuth(result.accessToken, result.refreshToken, result.user);
    set({ accessToken: result.accessToken, user: result.user });
  },
  async refresh() {
    const refreshToken = getStoredRefreshToken();
    if (!refreshToken) {
      clearStoredAuth();
      set({ accessToken: null, user: null });
      return null;
    }

    try {
      const result = await refreshRequest(refreshToken);
      storeAuth(result.accessToken, result.refreshToken, result.user);
      set({ accessToken: result.accessToken, user: result.user });
      return result;
    } catch {
      clearStoredAuth();
      set({ accessToken: null, user: null });
      return null;
    }
  },
  async logout() {
    const refreshToken = getStoredRefreshToken();
    if (refreshToken) {
      try {
        await logoutRequest(refreshToken);
      } catch {
        // Local logout should still succeed if the server is unavailable.
      }
    }

    clearStoredAuth();
    set({ accessToken: null, user: null });
  },
  clear() {
    clearStoredAuth();
    set({ accessToken: null, user: null });
  },
}));

window.addEventListener('unihub:auth-cleared', clearLocalState);

export function useAuthClearedSubscription() {
  useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener('unihub:auth-cleared', onStoreChange);
      return () => window.removeEventListener('unihub:auth-cleared', onStoreChange);
    },
    () => getStoredToken(),
    () => null,
  );
}
