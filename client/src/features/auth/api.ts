import { api } from '../../lib/api';
import type { AuthResponse, LoginCredentials, LoginResponse } from './types';

export async function loginRequest(credentials: LoginCredentials) {
  const response = await api.post<LoginResponse>('/auth/login', credentials);
  return response.data;
}

export async function refreshRequest(refreshToken: string) {
  const response = await api.post<AuthResponse>('/auth/refresh', { refreshToken });
  return response.data;
}

export async function logoutRequest(refreshToken: string) {
  await api.post('/auth/logout', { refreshToken });
}
