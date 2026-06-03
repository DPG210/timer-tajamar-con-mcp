/**
 * Auth store — Zustand.
 * Resolves M-01 (token now accessible from axios interceptor),
 * M-auth (localStorage.removeItem instead of .clear()).
 *
 * The store hydrates from localStorage on first import so a page
 * refresh restores the session without a new login.
 */

import { create } from 'zustand';

const TOKEN_KEY = 'token';

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  setToken: (token: string) => void;
  clearToken: () => void;
}

function readStoredToken(): string | null {
  const stored = localStorage.getItem(TOKEN_KEY);
  if (!stored || stored === 'undefined' || stored === 'null') return null;
  return stored;
}

// Validates basic JWT structure: 3 Base64 parts separated by dots.
// Catches obviously malformed tokens before the first API call returns 401.
function isValidToken(token: string | null): boolean {
  if (!token) return false;
  return token.split('.').length === 3;
}

export const useAuthStore = create<AuthState>()((set) => ({
  token: readStoredToken(),
  isAuthenticated: isValidToken(readStoredToken()),

  setToken: (token: string) => {
    localStorage.setItem(TOKEN_KEY, token);
    set({ token, isAuthenticated: isValidToken(token) });
  },

  clearToken: () => {
    localStorage.removeItem(TOKEN_KEY);
    set({ token: null, isAuthenticated: false });
  },
}));
