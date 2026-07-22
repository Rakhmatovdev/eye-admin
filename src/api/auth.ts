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
  mfa_enabled?: boolean;
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
    mfaEnabled: !!u.mfa_enabled,
  };
}

export const authApi = {
  // POST /auth/login {email, password, otp?}. When the account has MFA
  // enabled and no `otp` was supplied, the backend returns 200 with only
  // `mfa_required: true` (no tokens) — the caller resubmits with `otp`.
  login: async (
    credentials: LoginCredentials
  ): Promise<{ mfaRequired: boolean; user?: AuthUser; token?: string; refreshToken?: string }> => {
    const res = await apiClient.post<{ data: LoginData }>('/v1/auth/login', credentials);
    const data = res.data.data;
    if (data.mfa_required) {
      return { mfaRequired: true };
    }
    if (!data.user || !data.access_token) {
      throw new Error('Malformed login response from server');
    }
    return {
      mfaRequired: false,
      user: mapUser(data.user),
      token: data.access_token,
      refreshToken: data.refresh_token,
    };
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

  // POST /auth/change-password {current_password, new_password}. On success
  // the backend revokes all refresh tokens for the account — the caller must
  // force a re-login afterwards.
  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await apiClient.post('/v1/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
  },

  // POST /auth/forgot-password {email} → always a generic {message}, whether
  // or not the email is registered. resetToken/resetLink are only present
  // outside production (no email sender configured yet).
  forgotPassword: async (email: string): Promise<{ message: string; resetToken?: string; resetLink?: string }> => {
    const res = await apiClient.post<{ data: { message: string; reset_token?: string; reset_link?: string } }>(
      '/v1/auth/forgot-password',
      { email }
    );
    const data = res.data.data;
    return { message: data.message, resetToken: data.reset_token, resetLink: data.reset_link };
  },

  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    await apiClient.post('/v1/auth/reset-password', { token, new_password: newPassword });
  },
};

export interface MFAEnrollment {
  secret: string;
  otpauthUrl: string;
}

export const mfaApi = {
  // POST /auth/mfa/enroll → {secret, otpauth_url}. Does not enable MFA yet —
  // the caller must confirm with mfaApi.verify(otp).
  enroll: async (): Promise<MFAEnrollment> => {
    const res = await apiClient.post<{ data: { secret: string; otpauth_url: string } }>(
      '/v1/auth/mfa/enroll'
    );
    const data = res.data.data;
    return { secret: data.secret, otpauthUrl: data.otpauth_url };
  },

  verify: async (otp: string): Promise<void> => {
    await apiClient.post('/v1/auth/mfa/verify', { otp });
  },

  disable: async (otp: string): Promise<void> => {
    await apiClient.post('/v1/auth/mfa/disable', { otp });
  },
};
