/**
 * Auth mutation hook.
 * Resolves M-08: Swal is NOT in the service layer — Login component handles UI feedback.
 * Resolves M-02: errors propagate as rejected promises via TanStack Query.
 */

import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { LoginResponseSchema } from '../types/models';
import { useAuthStore } from '../stores/authStore';

interface LoginCredentials {
  userName: string;
  password: string;
}

export function useLogin() {
  const { setToken } = useAuthStore();

  return useMutation({
    mutationFn: async ({ userName, password }: LoginCredentials) => {
      // Resolves M-02: axios error propagates, TanStack Query puts mutation in error state
      const { data } = await apiClient.post<unknown>('Auth/Login', { userName, password });
      const parsed = LoginResponseSchema.parse(data);
      return parsed.response;
    },
    onSuccess: (token: string) => {
      setToken(token);
    },
    // onError is handled in the Login component (SweetAlert2 — resolves M-08)
  });
}
