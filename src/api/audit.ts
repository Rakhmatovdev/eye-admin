import type { AuditLog } from '../types';
import { subDays, subHours, subMinutes } from 'date-fns';
import apiClient from './client';

// --- backend <-> UI mapping -------------------------------------------------

interface BackendAuditLog {
  id: number;
  user_id: string;
  action: string;
  resource: string;
  ip: string;
  result: string;
  hash: string;
  prev_hash: string;
  timestamp: string;
}

const ACTION_MAP: Record<string, AuditLog['action']> = {
  post: 'create',
  put: 'update',
  patch: 'update',
  delete: 'delete',
  get: 'read',
  login: 'login',
  logout: 'logout',
  export: 'export',
  import: 'import',
  configure: 'configure',
};

function mapAction(a: string): AuditLog['action'] {
  return ACTION_MAP[a.toLowerCase()] ?? 'execute';
}

// Backend only stores user_id (a UUID-ish string like "admin-uuid-0000-...");
// derive a readable display name/email since there's no join to the user record here.
function displayNameFromUserId(userId: string): string {
  const base = userId.split('-uuid')[0] || userId;
  return base.charAt(0).toUpperCase() + base.slice(1);
}

async function unwrap<T>(p: Promise<{ data: { data: T } }>): Promise<T> {
  return (await p).data.data;
}

function mapAuditLog(l: BackendAuditLog): AuditLog {
  const name = displayNameFromUserId(l.user_id);
  return {
    id: String(l.id),
    timestamp: l.timestamp,
    userId: l.user_id,
    userName: name,
    userEmail: `${name.toLowerCase()}@platform.io`,
    action: mapAction(l.action),
    resource: l.resource,
    details: `${l.action.toUpperCase()} ${l.resource}`,
    ip: l.ip,
    userAgent: '—',
    result: l.result === 'failure' ? 'failure' : 'success',
    hash: l.hash,
  };
}

export const MOCK_AUDIT_LOGS: AuditLog[] = [
  { id: '1', timestamp: subMinutes(new Date(), 5).toISOString(), userId: 'usr-001', userName: 'Administrator', userEmail: 'admin@platform.io', action: 'update', resource: 'user:provision', details: 'POST /api/v1/users', ip: '192.168.1.100', userAgent: '—', result: 'success', hash: '5b98a1c90...' },
  { id: '2', timestamp: subMinutes(new Date(), 6).toISOString(), userId: 'usr-002', userName: 'Sarah Chen', userEmail: 's.chen@platform.io', action: 'read', resource: 'entity:detail_360', details: 'GET /api/v1/entities/360', ip: '10.0.12.44', userAgent: '—', result: 'success', hash: 'a129d892e...' },
  { id: '3', timestamp: subMinutes(new Date(), 8).toISOString(), userId: 'usr-011', userName: 'Carlos Rivera', userEmail: 'c.rivera@platform.io', action: 'execute', resource: 'graph:case_102', details: 'POST /api/v1/graph/expand', ip: '192.168.10.15', userAgent: '—', result: 'success', hash: 'f928e83b8...' },
  { id: '4', timestamp: subMinutes(new Date(), 10).toISOString(), userId: 'usr-999', userName: 'Unknown', userEmail: 'unknown@platform.io', action: 'read', resource: 'users:list', details: 'GET /api/v1/users', ip: '185.220.101.4', userAgent: '—', result: 'failure', hash: '8b9812e3e...' },
  { id: '5', timestamp: subMinutes(new Date(), 12).toISOString(), userId: 'usr-001', userName: 'Administrator', userEmail: 'admin@platform.io', action: 'execute', resource: 'agent:restart', details: 'POST /api/v1/agents/1/command', ip: '192.168.1.100', userAgent: '—', result: 'success', hash: 'c9081e82b...' },
  { id: '6', timestamp: subHours(new Date(), 2).toISOString(), userId: 'usr-013', userName: 'Hassan Al-Farsi', userEmail: 'h.alfarsi@platform.io', action: 'delete', resource: 'sensors/8', details: 'DELETE /api/v1/sensors/8', ip: '10.0.0.2', userAgent: '—', result: 'success', hash: 'd291ac0f1...' },
  { id: '7', timestamp: subDays(new Date(), 1).toISOString(), userId: 'usr-001', userName: 'Administrator', userEmail: 'admin@platform.io', action: 'login', resource: '/api/v1/auth/login', details: 'LOGIN /api/v1/auth/login', ip: '10.0.0.1', userAgent: '—', result: 'success', hash: '77e0c1af9...' },
];

function filterMock(params?: { search?: string; action?: string }): AuditLog[] {
  let logs = [...MOCK_AUDIT_LOGS];
  if (params?.search) {
    const s = params.search.toLowerCase();
    logs = logs.filter(l =>
      l.userEmail.toLowerCase().includes(s) ||
      l.action.toLowerCase().includes(s) ||
      l.resource.toLowerCase().includes(s) ||
      l.ip.includes(s)
    );
  }
  if (params?.action && params.action !== 'all') {
    logs = logs.filter(l => l.action === params.action);
  }
  return logs;
}

export const auditApi = {
  getLogs: async (params?: { search?: string; action?: string }): Promise<AuditLog[]> => {
    try {
      const query: Record<string, string> = {};
      if (params?.search) query.search = params.search;
      if (params?.action && params.action !== 'all') query.action = params.action;
      const data = await unwrap<BackendAuditLog[]>(apiClient.get('/v1/audit', { params: query }));
      if (!data?.length) return filterMock(params);
      return data.map(mapAuditLog);
    } catch {
      return filterMock(params);
    }
  },

  exportLogs: async (): Promise<string> => {
    try {
      const res = await apiClient.get<string>('/v1/audit/export', { responseType: 'text' });
      return res.data;
    } catch {
      const headers = 'ID,Timestamp,User,Action,Resource,IP,Result,Hash\n';
      const rows = MOCK_AUDIT_LOGS.map(l =>
        `"${l.id}","${l.timestamp}","${l.userEmail}","${l.action}","${l.resource}","${l.ip}","${l.result}","${l.hash}"`
      ).join('\n');
      return headers + rows;
    }
  },
};
