import axios from 'axios';
import type { AxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const apiClient = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach token
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

type RetriableConfig = AxiosRequestConfig & { _retry?: boolean };

// Endpoints that must never trigger (or be retried through) a silent refresh —
// a 401 on these means the credentials/refresh token themselves are invalid.
export function isAuthEndpoint(url?: string): boolean {
  if (!url) return false;
  return (
    url.includes('/v1/auth/refresh') ||
    url.includes('/v1/auth/login') ||
    url.includes('/v1/auth/forgot-password') ||
    url.includes('/v1/auth/reset-password')
  );
}

// Single-flight refresh: concurrent 401s share one in-flight `/auth/refresh`
// call instead of each firing their own.
let refreshPromise: Promise<string | null> | null = null;

async function performRefresh(): Promise<string | null> {
  const refreshToken = useAuthStore.getState().refreshToken;
  if (!refreshToken) return null;
  try {
    // Plain axios (not apiClient) — avoids re-entering the response
    // interceptor and doesn't need the (possibly expired) access token.
    const res = await axios.post(`${API_URL}/api/v1/auth/refresh`, {
      refresh_token: refreshToken,
    });
    const accessToken = res.data?.data?.access_token as string | undefined;
    if (!accessToken) return null;
    // The backend rotates the refresh token on every refresh — persist the
    // new one or the next silent refresh would fail against the revoked one.
    const newRefreshToken = res.data?.data?.refresh_token as string | undefined;
    useAuthStore.getState().setAccessToken(accessToken, newRefreshToken ?? null);
    return accessToken;
  } catch {
    return null;
  }
}

function getRefreshedToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = performRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

function redirectToLogin() {
  useAuthStore.getState().logout();
  if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
}

// Response interceptor — silent refresh on 401, single-retry, then logout.
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as RetriableConfig | undefined;
    const status = error.response?.status;

    if (status !== 401) {
      return Promise.reject(error);
    }

    // Not retriable (no config), already retried once, or the failing call
    // *was* the login/refresh call itself — nothing left to do but log out.
    if (!originalRequest || originalRequest._retry || isAuthEndpoint(originalRequest.url)) {
      redirectToLogin();
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    const newToken = await getRefreshedToken();

    if (newToken) {
      originalRequest.headers = {
        ...(originalRequest.headers || {}),
        Authorization: `Bearer ${newToken}`,
      };
      return apiClient(originalRequest);
    }

    redirectToLogin();
    return Promise.reject(error);
  }
);

export default apiClient;
