import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './authStore';
import type { AuthUser } from '../types';

const user: AuthUser = {
  id: 'u1',
  name: 'Ada Lovelace',
  email: 'ada@platform.io',
  role: 'admin',
  clearance: 'SECRET',
};

const INITIAL_STATE = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  mfaRequired: false,
  mfaToken: null,
};

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState(INITIAL_STATE);
  });

  it('login() establishes an authenticated session', () => {
    useAuthStore.getState().login(user, 'access-tok', 'refresh-tok');

    const state = useAuthStore.getState();
    expect(state.user).toEqual(user);
    expect(state.token).toBe('access-tok');
    expect(state.refreshToken).toBe('refresh-tok');
    expect(state.isAuthenticated).toBe(true);
    expect(state.mfaRequired).toBe(false);
  });

  it('login() defaults refreshToken to null when omitted', () => {
    useAuthStore.getState().login(user, 'access-tok');
    expect(useAuthStore.getState().refreshToken).toBeNull();
  });

  it('logout() clears the session back to its initial state', () => {
    useAuthStore.getState().login(user, 'access-tok', 'refresh-tok');
    useAuthStore.getState().logout();

    expect(useAuthStore.getState()).toMatchObject(INITIAL_STATE);
  });

  it('setMfaRequired() stores the mfa flag and token, and clears the token when disabled', () => {
    useAuthStore.getState().setMfaRequired(true, 'mfa-session-tok');
    expect(useAuthStore.getState()).toMatchObject({ mfaRequired: true, mfaToken: 'mfa-session-tok' });

    useAuthStore.getState().setMfaRequired(false);
    expect(useAuthStore.getState()).toMatchObject({ mfaRequired: false, mfaToken: null });
  });

  it('updateUser() merges partial updates into the existing user, and no-ops when logged out', () => {
    useAuthStore.getState().login(user, 'access-tok');
    useAuthStore.getState().updateUser({ mfaEnabled: true });
    expect(useAuthStore.getState().user).toEqual({ ...user, mfaEnabled: true });

    useAuthStore.getState().logout();
    useAuthStore.getState().updateUser({ mfaEnabled: true });
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('setAccessToken() persists the rotated refresh token when client.ts passes one', () => {
    useAuthStore.getState().login(user, 'access-tok', 'refresh-tok');

    // The backend rotates the refresh token on every /auth/refresh — the
    // 401 interceptor in client.ts passes the new one along so it replaces
    // the (now revoked) old one in the store.
    useAuthStore.getState().setAccessToken('new-access-tok', 'new-refresh-tok');

    const state = useAuthStore.getState();
    expect(state.token).toBe('new-access-tok');
    expect(state.refreshToken).toBe('new-refresh-tok');
  });

  it('setAccessToken() leaves refreshToken untouched when called without one', () => {
    useAuthStore.getState().login(user, 'access-tok', 'refresh-tok');

    useAuthStore.getState().setAccessToken('new-access-tok');

    const state = useAuthStore.getState();
    expect(state.token).toBe('new-access-tok');
    expect(state.refreshToken).toBe('refresh-tok');
  });
});
