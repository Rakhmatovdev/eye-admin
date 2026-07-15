import type { User } from '../types';
import { subDays, subHours, subMinutes } from 'date-fns';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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

export const usersApi = {
  getUsers: async (params?: { search?: string; status?: string; role?: string }): Promise<User[]> => {
    await delay(400);
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
  },

  getUser: async (id: string): Promise<User> => {
    await delay(300);
    const user = MOCK_USERS.find(u => u.id === id);
    if (!user) throw new Error('User not found');
    return user;
  },

  createUser: async (data: Partial<User>): Promise<User> => {
    await delay(600);
    return {
      ...data,
      id: 'usr-' + Date.now(),
      status: 'pending',
      lastLogin: new Date().toISOString(),
      lastIp: '0.0.0.0',
      createdAt: new Date().toISOString(),
      mfaEnabled: false,
      sessionCount: 0,
    } as User;
  },

  updateUser: async (id: string, data: Partial<User>): Promise<User> => {
    await delay(500);
    const user = MOCK_USERS.find(u => u.id === id)!;
    return { ...user, ...data };
  },

  deleteUser: async (_id: string): Promise<void> => {
    await delay(400);
  },

  suspendUser: async (id: string): Promise<User> => {
    await delay(300);
    const user = MOCK_USERS.find(u => u.id === id)!;
    return { ...user, status: 'suspended' };
  },

  activateUser: async (id: string): Promise<User> => {
    await delay(300);
    const user = MOCK_USERS.find(u => u.id === id)!;
    return { ...user, status: 'active' };
  },

  forceLogout: async (_id: string): Promise<void> => {
    await delay(300);
  },
};
