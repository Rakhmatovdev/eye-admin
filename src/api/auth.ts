import apiClient from './client';
import type { AuthUser, UserRole, ClearanceLevel } from '../types';

interface LoginCredentials {
  email: string;
  password: string;
}

interface AuthResponse {
  user: AuthUser;
  token: string;
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

interface LoginData {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: BackendUser;
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
  // The MVP backend authenticates in a single step (no MFA). We keep the
  // `requiresMfa` shape for compatibility but always resolve it to false.
  login: async (
    credentials: LoginCredentials
  ): Promise<{ requiresMfa: boolean; mfaToken?: string; user?: AuthUser; token?: string }> => {
    const res = await apiClient.post<{ data: LoginData }>('/v1/auth/login', credentials);
    const data = res.data.data;
    return { requiresMfa: false, user: mapUser(data.user), token: data.access_token };
  },

  // Retained for interface compatibility; not used now that MFA is disabled.
  verifyMfa: async (): Promise<AuthResponse> => {
    throw new Error('MFA is not enabled on this deployment');
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
