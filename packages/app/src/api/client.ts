/**
 * Centralized Axios instance with interceptors.
 * Resolves M-01 (Bearer token in every request),
 * M-02 (errors propagate as rejected promises),
 * M-09 (baseURL from env, not hardcoded).
 *
 * Do NOT import axios directly in any other file —
 * always import { apiClient } from '@/api/client'.
 */

import axios from 'axios';
import { ENV } from '../config/env';
import { useAuthStore } from '../stores/authStore';

export const apiClient = axios.create({
  baseURL: ENV.API_URL,
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ---------------------------------------------------------------------------
// Request interceptor — attach Bearer token (resolves M-01)
// ---------------------------------------------------------------------------
apiClient.interceptors.request.use(
  (config) => {
    // Read from Zustand store directly (works outside React components)
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: unknown) => Promise.reject(error)
);

// ---------------------------------------------------------------------------
// Response interceptor — propagate errors (resolves M-02)
// ---------------------------------------------------------------------------
apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const url = error.config?.url ?? '';
      // Skip redirect for the login endpoint itself — a 401 there means wrong
      // credentials, not an expired session. The Login component handles it via onError.
      if (!url.endsWith('Auth/Login')) {
        useAuthStore.getState().clearToken();
        const next = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.replace(`/login?next=${next}`);
      }
    }
    return Promise.reject(error);
  }
);
