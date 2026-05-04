import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { AuthResponse } from '../types/auth';
import {
  clearStoredAuth,
  getStoredRefreshToken,
  getStoredToken,
  storeAuth,
} from '../utils/session';

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let refreshPromise: Promise<AuthResponse | null> | null = null;

async function refreshSession() {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) {
    return null;
  }

  refreshPromise ??= axios
    .post<AuthResponse>(
      `${baseURL}/auth/refresh`,
      { refreshToken },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )
    .then((response) => {
      const result = response.data;
      storeAuth(result.accessToken, result.refreshToken, result.user);
      return result;
    })
    .catch(() => {
      clearStoredAuth();
      return null;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

api.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;
    const requestUrl = originalRequest?.url ?? '';
    const isAuthEndpoint = requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/refresh') ||
      requestUrl.includes('/auth/logout');

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
      originalRequest._retry = true;
      const refreshed = await refreshSession();

      if (refreshed) {
        originalRequest.headers.Authorization = `Bearer ${refreshed.accessToken}`;
        return api(originalRequest);
      }
    }

    if (error.response) {
      if (error.response.status === 401) {
        clearStoredAuth();
      }

      const responseData = error.response.data as { message?: string } | undefined;
      const message = responseData?.message || 'An error occurred';
      console.error(`API Error: ${message}`, responseData);
    } else if (error.request) {
      console.error('Network Error: No response received', error.request);
    } else {
      console.error('API Error: Request setup failed', error.message);
    }

    return Promise.reject(error);
  }
);

