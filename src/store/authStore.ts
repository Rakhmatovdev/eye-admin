import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser } from '../types';

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  mfaRequired: boolean;
  mfaToken: string | null;
  login: (user: AuthUser, token: string, refreshToken?: string | null) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  setMfaRequired: (required: boolean, mfaToken?: string) => void;
  updateUser: (updates: Partial<AuthUser>) => void;
  /** Swap in a freshly-minted access token after a silent refresh, without
   * touching the rest of the session (used by the client.ts 401 interceptor). */
  setAccessToken: (token: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      mfaRequired: false,
      mfaToken: null,

      login: (user, token, refreshToken) =>
        set({
          user,
          token,
          refreshToken: refreshToken ?? null,
          isAuthenticated: true,
          isLoading: false,
          mfaRequired: false,
          mfaToken: null,
        }),

      logout: () =>
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
          mfaRequired: false,
          mfaToken: null,
        }),

      setLoading: (loading) => set({ isLoading: loading }),

      setMfaRequired: (required, mfaToken) =>
        set({ mfaRequired: required, mfaToken: mfaToken || null }),

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),

      setAccessToken: (token) => set({ token }),
    }),
    {
      name: 'nexus-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
