import { api } from './api';
import type { AuthResponse, LoginCredentials } from '../types/auth';

export async function loginRequest(credentials: LoginCredentials) {
  const response = await api.post<AuthResponse>('/auth/login', credentials);
  return response.data;
}

export async function refreshRequest(refreshToken: string) {
  const response = await api.post<AuthResponse>('/auth/refresh', {
    refreshToken,
  });
  return response.data;
}

export async function logoutRequest(refreshToken: string) {
  const response = await api.post('/auth/logout', { refreshToken });
  return response.data;
}
