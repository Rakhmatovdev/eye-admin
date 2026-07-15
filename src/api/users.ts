import type { User, ClearanceLevel } from '../types';
import { subDays, subHours, subMinutes } from 'date-fns';
import apiClient from './client';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// --- backend <-> UI mapping -------------------------------------------------

interface BackendUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  clearance_level: number;
  status: string;
  department: string;
  last_login?: string | null;
  created_at: string;
}

const VALID_ROLES = ['admin', 'analyst', 'viewer', 'operator', 'auditor'];

function levelToClearance(level: number): ClearanceLevel {
  if (level >= 5) return 'TOP_SECRET';
  if (level >= 3) return 'SECRET';
  if (level >= 2) return 'CONFIDENTIAL';
  return 'UNCLASSIFIED';
}
function clearanceToLevel(c?: ClearanceLevel): number {
  switch (c) {
    case 'TOP_SECRET': return 5;
    case 'SECRET': return 3;
    case 'CONFIDENTIAL': return 2;
    default: return 1;
  }
}

function mapUser(u: BackendUser): User {
  return {
    id: u.id,
    name: `${u.first_name} ${u.last_name}`.trim() || u.email,
    email: u.email,
    role: (VALID_ROLES.includes(u.role) ? u.role : 'viewer') as User['role'],
    status: (u.status as User['status']) ?? 'active',
    clearance: levelToClearance(u.clearance_level),
    lastLogin: u.last_login ?? u.created_at,
    lastIp: '—',
    createdAt: u.created_at,
    department: u.department || 'General',
    mfaEnabled: false,
    sessionCount: 0,
  };
}

function splitName(name?: string): { first: string; last: string } {
  const parts = (name ?? '').trim().split(/\s+/);
  return { first: parts[0] ?? '', last: parts.slice(1).join(' ') };
}

async function unwrap<T>(p: Promise<{ data: { data: T } }>): Promise<T> {
  return (await p).data.data;
}

export const MOCK_USERS: User[] = [
  { id: 'usr-001', name: 'Administrator', email: 'admin@platform.io', role: 'admin', status: 'active', clearance: 'TOP_SECRET', lastLogin: subMinutes(new Date(), 5).toISOString(), lastIp: '10.0.0.1', createdAt: subDays(new Date(), 365).toISOString(), department: 'IT Security', mfaEnabled: true, sessionCount: 3 },
  { id: 'usr-002', name: 'Sarah Chen', email: 's.chen@platform.io', role: 'analyst', status: 'active', clearance: 'SECRET', lastLogin: subMinutes(new Date(), 30).toISOString(), lastIp: '10.0.1.42', createdAt: subDays(new Date(), 180).toISOString(), department: 'Intelligence', mfaEnabled: true, sessionCount: 1 },
  { id: 'usr-003', name: 'Marcus Williams', email: 'm.williams@platform.io', role: 'analyst', status: 'active', clearance: 'TOP_SECRET', lastLogin: subHours(new Date(), 2).toISOString(), lastIp: '10.0.1.55', createdAt: subDays(new Date(), 220).toISOString(), department: 'Cyber Operations', mfaEnabled: true, sessionCount: 2 },
  { id: 'usr-004', name: 'Elena Vasquez', email: 'e.vasquez@platform.io', role: 'operator', status: 'active', clearance: 'CONFIDENTIAL', lastLogin: subHours(new Date(), 1).toISOString(), lastIp: '192.168.10.23', createdAt: subDays(new Date(), 90).toISOString(), department: 'Operations', mfaEnabled: true, sessionCount: 1 },
  { id: 'usr-005', name: 'James O\'Brien', email: 'j.obrien@platform.io', role: 'auditor', status: 'active', clearance: 'SECRET', lastLogin: subHours(new Date(), 5).toISOString(), lastIp: '10.0.2.11', createdAt: subDays(new Date(), 300).toISOString(), department: 'Compliance', mfaEnabled: true, sessionCount: 1 },
  { id: 'usr-006', name: 'Yuki Tanaka', email: 'y.tanaka@platform.io', role: 'analyst', status: 'active', clearance: 'SECRET', lastLogin: subHours(new Date(), 3).toISOString(), lastIp: '10.0.1.67', createdAt: subDays(new Date(), 150).toISOString(), department: 'Intelligence', mfaEnabled: false, sessionCount: 1 },
  { id: 'usr-007', name: 'Derek Stone', email: 'd.stone@platform.io', role: 'viewer', status: 'suspended', clearance: 'UNCLASSIFIED', lastLogin: subDays(new Date(), 7).toISOString(), lastIp: '10.0.3.89', createdAt: subDays(new Date(), 60).toISOString(), department: 'Legal', mfaEnabled: false, sessionCount: 0 },
  { id: 'usr-008', name: 'Fatima Al-Rashid', email: 'f.alrashid@platform.io', role: 'analyst', status: 'active', clearance: 'TOP_SECRET', lastLogin: subMinutes(new Date(), 45).toISOString(), lastIp: '10.0.1.92', createdAt: subDays(new Date(), 200).toISOString(), department: 'HUMINT', mfaEnabled: true, sessionCount: 2 },
  { id: 'usr-009', name: 'Nikolai Petrov', email: 'n.petrov@platform.io', role: 'operator', status: 'active', clearance: 'SECRET', lastLogin: subHours(new Date(), 4).toISOString(), lastIp: '172.16.0.44', createdAt: subDays(new Date(), 120).toISOString(), department: 'Operations', mfaEnabled: true, sessionCount: 1 },
  { id: 'usr-010', name: 'Amelia Brooks', email: 'a.brooks@platform.io', role: 'analyst', status: 'inactive', clearance: 'CONFIDENTIAL', lastLogin: subDays(new Date(), 30).toISOString(), lastIp: '10.0.1.100', createdAt: subDays(new Date(), 400).toISOString(), department: 'OSINT', mfaEnabled: true, sessionCount: 0 },
  { id: 'usr-011', name: 'Carlos Rivera', email: 'c.rivera@platform.io', role: 'viewer', status: 'active', clearance: 'UNCLASSIFIED', lastLogin: subDays(new Date(), 2).toISOString(), lastIp: '10.0.4.15', createdAt: subDays(new Date(), 45).toISOString(), department: 'External', mfaEnabled: false, sessionCount: 1 },
  { id: 'usr-012', name: 'Ingrid Larsson', email: 'i.larsson@platform.io', role: 'analyst', status: 'active', clearance: 'SECRET', lastLogin: subHours(new Date(), 6).toISOString(), lastIp: '10.0.1.78', createdAt: subDays(new Date(), 170).toISOString(), department: 'Intelligence', mfaEnabled: true, sessionCount: 1 },
  { id: 'usr-013', name: 'Hassan Al-Farsi', email: 'h.alfarsi@platform.io', role: 'admin', status: 'active', clearance: 'TOP_SECRET', lastLogin: subHours(new Date(), 1).toISOString(), lastIp: '10.0.0.2', createdAt: subDays(new Date(), 500).toISOString(), department: 'IT Security', mfaEnabled: true, sessionCount: 2 },
  { id: 'usr-014', name: 'Sophie Dubois', email: 's.dubois@platform.io', role: 'auditor', status: 'active', clearance: 'SECRET', lastLogin: subHours(new Date(), 8).toISOString(), lastIp: '10.0.2.33', createdAt: subDays(new Date(), 280).toISOString(), department: 'Compliance', mfaEnabled: true, sessionCount: 1 },
  { id: 'usr-015', name: 'Raj Patel', email: 'r.patel@platform.io', role: 'analyst', status: 'active', clearance: 'SECRET', lastLogin: subMinutes(new Date(), 20).toISOString(), lastIp: '10.0.1.55', createdAt: subDays(new Date(), 130).toISOString(), department: 'Cyber', mfaEnabled: true, sessionCount: 1 },
  { id: 'usr-016', name: 'Olivia Kim', email: 'o.kim@platform.io', role: 'operator', status: 'pending', clearance: 'CONFIDENTIAL', lastLogin: subDays(new Date(), 1).toISOString(), lastIp: '10.0.3.11', createdAt: subDays(new Date(), 5).toISOString(), department: 'Operations', mfaEnabled: false, sessionCount: 0 },
  { id: 'usr-017', name: 'Victor Mensah', email: 'v.mensah@platform.io', role: 'viewer', status: 'active', clearance: 'UNCLASSIFIED', lastLogin: subDays(new Date(), 3).toISOString(), lastIp: '10.0.4.22', createdAt: subDays(new Date(), 75).toISOString(), department: 'Legal', mfaEnabled: false, sessionCount: 1 },
  { id: 'usr-018', name: 'Natasha Ivanova', email: 'n.ivanova@platform.io', role: 'analyst', status: 'suspended', clearance: 'SECRET', lastLogin: subDays(new Date(), 14).toISOString(), lastIp: '10.0.1.99', createdAt: subDays(new Date(), 240).toISOString(), department: 'Intelligence', mfaEnabled: true, sessionCount: 0 },
  { id: 'usr-019', name: 'David Chang', email: 'd.chang@platform.io', role: 'admin', status: 'active', clearance: 'TOP_SECRET', lastLogin: subHours(new Date(), 2).toISOString(), lastIp: '10.0.0.3', createdAt: subDays(new Date(), 450).toISOString(), department: 'IT Security', mfaEnabled: true, sessionCount: 1 },
  { id: 'usr-020', name: 'Layla Hassan', email: 'l.hassan@platform.io', role: 'analyst', status: 'active', clearance: 'TOP_SECRET', lastLogin: subMinutes(new Date(), 10).toISOString(), lastIp: '10.0.1.44', createdAt: subDays(new Date(), 110).toISOString(), department: 'Counter-Intel', mfaEnabled: true, sessionCount: 3 },
];

// Local filtering used by the demo fallback.
function filterMock(params?: { search?: string; status?: string; role?: string }): User[] {
  let users = [...MOCK_USERS];
  if (params?.search) {
    const s = params.search.toLowerCase();
    users = users.filter(u => u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s));
  }
  if (params?.status && params.status !== 'all') {
    users = users.filter(u => u.status === params.status);
  }
  if (params?.role && params.role !== 'all') {
    users = users.filter(u => u.role === params.role);
  }
  return users;
}

export const usersApi = {
  getUsers: async (params?: { search?: string; status?: string; role?: string }): Promise<User[]> => {
    try {
      const query: Record<string, string> = {};
      if (params?.search) query.search = params.search;
      if (params?.status && params.status !== 'all') query.status = params.status;
      if (params?.role && params.role !== 'all') query.role = params.role;
      const data = await unwrap<BackendUser[]>(apiClient.get('/v1/users', { params: query }));
      if (!data?.length) return filterMock(params);
      return data.map(mapUser);
    } catch {
      return filterMock(params);
    }
  },

  getUser: async (id: string): Promise<User> => {
    try {
      return mapUser(await unwrap<BackendUser>(apiClient.get(`/v1/users/${id}`)));
    } catch {
      const user = MOCK_USERS.find(u => u.id === id);
      if (!user) throw new Error('User not found');
      return user;
    }
  },

  createUser: async (data: Partial<User>): Promise<User> => {
    const { first, last } = splitName(data.name);
    try {
      const payload = {
        email: data.email,
        password: (data as { password?: string }).password || 'ChangeMe123!',
        first_name: first,
        last_name: last,
        role: data.role,
        clearance_level: clearanceToLevel(data.clearance),
        department: data.department || 'General',
      };
      return mapUser(await unwrap<BackendUser>(apiClient.post('/v1/users', payload)));
    } catch {
      await delay(300);
      return {
        ...data,
        id: 'usr-' + Date.now(),
        status: 'pending',
        lastLogin: new Date().toISOString(),
        lastIp: '—',
        createdAt: new Date().toISOString(),
        mfaEnabled: false,
        sessionCount: 0,
      } as User;
    }
  },

  updateUser: async (id: string, data: Partial<User>): Promise<User> => {
    try {
      const payload: Record<string, unknown> = {};
      if (data.name !== undefined) {
        const { first, last } = splitName(data.name);
        payload.first_name = first;
        payload.last_name = last;
      }
      if (data.role !== undefined) payload.role = data.role;
      if (data.clearance !== undefined) payload.clearance_level = clearanceToLevel(data.clearance);
      if (data.department !== undefined) payload.department = data.department;
      return mapUser(await unwrap<BackendUser>(apiClient.patch(`/v1/users/${id}`, payload)));
    } catch {
      const user = MOCK_USERS.find(u => u.id === id)!;
      return { ...user, ...data };
    }
  },

  deleteUser: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/v1/users/${id}`);
    } catch { /* best-effort */ }
  },

  suspendUser: async (id: string): Promise<User> => {
    try {
      await apiClient.post(`/v1/users/${id}/suspend`);
      return usersApi.getUser(id);
    } catch {
      const user = MOCK_USERS.find(u => u.id === id)!;
      return { ...user, status: 'suspended' };
    }
  },

  activateUser: async (id: string): Promise<User> => {
    try {
      await apiClient.post(`/v1/users/${id}/activate`);
      return usersApi.getUser(id);
    } catch {
      const user = MOCK_USERS.find(u => u.id === id)!;
      return { ...user, status: 'active' };
    }
  },

  forceLogout: async (_id: string): Promise<void> => {
    await delay(150);
  },
};
