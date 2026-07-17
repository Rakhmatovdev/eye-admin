import apiClient from './client';
import type { AuthUser, UserRole, ClearanceLevel } from '../types';

interface LoginCredentials {
  email: string;
  password: string;
  otp?: string;
}

interface BackendUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  clearance_level: number;
  status: string;
}

// Mirrors backend internal/auth.LoginResponse. When `mfa_required` is true the
// account has MFA enabled and no (or an unverified) `otp` was supplied — the
// token fields and `user` are then omitted and the caller must resubmit the
// login request with `otp` set.
interface LoginData {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  mfa_required?: boolean;
  user?: BackendUser;
}

const VALID_ROLES: UserRole[] = ['admin', 'analyst', 'viewer', 'operator', 'auditor'];

function mapRole(role: string): UserRole {
  return VALID_ROLES.includes(role as UserRole) ? (role as UserRole) : 'viewer';
}

function mapClearance(level: number): ClearanceLevel {
  if (level >= 5) return 'TOP_SECRET';
  if (level >= 3) return 'SECRET';
  if (level >= 2) return 'CONFIDENTIAL';
  return 'UNCLASSIFIED';
}

function mapUser(u: BackendUser): AuthUser {
  return {
    id: u.id,
    name: `${u.first_name} ${u.last_name}`.trim() || u.email,
    email: u.email,
    role: mapRole(u.role),
    clearance: mapClearance(u.clearance_level),
  };
}

export const authApi = {
  // POST /auth/login {email, password, otp?}. When the account has MFA
  // enabled and no `otp` was supplied, the backend returns 200 with only
  // `mfa_required: true` (no tokens) — the caller resubmits with `otp`.
  login: async (
    credentials: LoginCredentials
  ): Promise<{ mfaRequired: boolean; user?: AuthUser; token?: string }> => {
    const res = await apiClient.post<{ data: LoginData }>('/v1/auth/login', credentials);
    const data = res.data.data;
    if (data.mfa_required) {
      return { mfaRequired: true };
    }
    if (!data.user || !data.access_token) {
      throw new Error('Malformed login response from server');
    }
    return { mfaRequired: false, user: mapUser(data.user), token: data.access_token };
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/v1/auth/logout');
    } catch {
      /* best-effort */
    }
  },

  getProfile: async (): Promise<AuthUser> => {
    const res = await apiClient.get<{ data: BackendUser }>('/v1/auth/me');
    return mapUser(res.data.data);
  },
};
