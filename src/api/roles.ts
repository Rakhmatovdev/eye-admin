import type { Role, Permission } from '../types';
import apiClient from './client';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface BackendPermission { id: string; resource: string; action: string; name: string }
interface BackendRole { id: string; name: string; description: string; permissions?: BackendPermission[]; created_at: string }

const ROLE_COLORS: Record<string, string> = {
  admin: '#EF4444', analyst: '#3B82F6', viewer: '#94A3B8', operator: '#10B981', auditor: '#F59E0B',
};

function mapBackendRole(r: BackendRole): Role {
  return {
    id: r.id,
    name: r.name,
    displayName: r.name.charAt(0).toUpperCase() + r.name.slice(1),
    description: r.description,
    permissions: (r.permissions ?? []).map(p => `${p.action}:${p.resource}`),
    userCount: 0,
    color: ROLE_COLORS[r.name] ?? '#64748B',
    createdAt: r.created_at,
  };
}
function mapBackendPermission(p: BackendPermission): Permission {
  return {
    id: p.id,
    key: `${p.action}:${p.resource}`,
    name: p.name,
    description: p.name,
    category: p.resource.charAt(0).toUpperCase() + p.resource.slice(1),
  };
}
async function unwrap<T>(p: Promise<{ data: { data: T } }>): Promise<T> {
  return (await p).data.data;
}

export const MOCK_PERMISSIONS: Permission[] = [
  { id: 'p-001', key: 'read:entities', name: 'Read Entities', description: 'View entity records', category: 'Entities' },
  { id: 'p-002', key: 'write:entities', name: 'Write Entities', description: 'Create and modify entities', category: 'Entities' },
  { id: 'p-003', key: 'delete:entities', name: 'Delete Entities', description: 'Remove entity records', category: 'Entities' },
  { id: 'p-004', key: 'read:cases', name: 'Read Cases', description: 'View intelligence cases', category: 'Cases' },
  { id: 'p-005', key: 'write:cases', name: 'Write Cases', description: 'Create and update cases', category: 'Cases' },
  { id: 'p-006', key: 'close:cases', name: 'Close Cases', description: 'Finalize and close cases', category: 'Cases' },
  { id: 'p-007', key: 'read:audit', name: 'Read Audit Logs', description: 'View system audit logs', category: 'Audit' },
  { id: 'p-008', key: 'export:audit', name: 'Export Audit', description: 'Export audit log data', category: 'Audit' },
  { id: 'p-009', key: 'admin:users', name: 'Manage Users', description: 'Create, edit, delete users', category: 'Admin' },
  { id: 'p-010', key: 'admin:roles', name: 'Manage Roles', description: 'Create and assign roles', category: 'Admin' },
  { id: 'p-011', key: 'read:datasources', name: 'View Data Sources', description: 'View connected data sources', category: 'Data' },
  { id: 'p-012', key: 'admin:datasources', name: 'Manage Data Sources', description: 'Add and configure data sources', category: 'Data' },
  { id: 'p-013', key: 'read:monitoring', name: 'View Monitoring', description: 'Access system metrics', category: 'System' },
  { id: 'p-014', key: 'admin:system', name: 'System Admin', description: 'Full system configuration', category: 'System' },
  { id: 'p-015', key: 'read:security', name: 'View Security', description: 'View security incidents', category: 'Security' },
  { id: 'p-016', key: 'manage:security', name: 'Manage Security', description: 'Respond to security incidents', category: 'Security' },
  { id: 'p-017', key: 'manage:agents', name: 'Manage Agents', description: 'Control remote agents', category: 'Agents' },
  { id: 'p-018', key: 'export:data', name: 'Export Data', description: 'Export intelligence data', category: 'Data' },
];

export const MOCK_ROLES: Role[] = [
  {
    id: 'role-001',
    name: 'admin',
    displayName: 'Administrator',
    description: 'Full system access with all administrative privileges',
    permissions: MOCK_PERMISSIONS.map(p => p.key),
    userCount: 3,
    color: '#EF4444',
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'role-002',
    name: 'analyst',
    displayName: 'Intelligence Analyst',
    description: 'Access to intelligence data, entities, and cases for analysis',
    permissions: ['read:entities', 'write:entities', 'read:cases', 'write:cases', 'read:monitoring', 'read:datasources', 'export:data'],
    userCount: 8,
    color: '#3B82F6',
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'role-003',
    name: 'viewer',
    displayName: 'Read-Only Viewer',
    description: 'View-only access to non-sensitive data',
    permissions: ['read:entities', 'read:cases', 'read:datasources'],
    userCount: 3,
    color: '#94A3B8',
    createdAt: '2024-01-15T00:00:00Z',
  },
  {
    id: 'role-004',
    name: 'operator',
    displayName: 'Operations Operator',
    description: 'Operational access including agent management',
    permissions: ['read:entities', 'write:entities', 'read:cases', 'read:monitoring', 'manage:agents', 'read:datasources'],
    userCount: 3,
    color: '#10B981',
    createdAt: '2024-02-01T00:00:00Z',
  },
  {
    id: 'role-005',
    name: 'auditor',
    displayName: 'Compliance Auditor',
    description: 'Access to audit logs and compliance reporting only',
    permissions: ['read:entities', 'read:cases', 'read:audit', 'export:audit', 'read:monitoring'],
    userCount: 2,
    color: '#F59E0B',
    createdAt: '2024-02-15T00:00:00Z',
  },
];

export const rolesApi = {
  getRoles: async (): Promise<Role[]> => {
    try {
      const data = await unwrap<BackendRole[]>(apiClient.get('/v1/roles'));
      if (!data?.length) return MOCK_ROLES;
      return data.map(mapBackendRole);
    } catch {
      return MOCK_ROLES;
    }
  },

  getRole: async (id: string): Promise<Role> => {
    await delay(200);
    const role = MOCK_ROLES.find(r => r.id === id);
    if (!role) throw new Error('Role not found');
    return role;
  },

  getPermissions: async (): Promise<Permission[]> => {
    try {
      const data = await unwrap<BackendPermission[]>(apiClient.get('/v1/permissions'));
      if (!data?.length) return MOCK_PERMISSIONS;
      return data.map(mapBackendPermission);
    } catch {
      return MOCK_PERMISSIONS;
    }
  },

  createRole: async (data: Partial<Role>): Promise<Role> => {
    try {
      const created = await unwrap<BackendRole>(
        apiClient.post('/v1/roles', { name: data.name, description: data.description })
      );
      return { ...mapBackendRole(created), permissions: data.permissions || [] };
    } catch {
      await delay(300);
      return {
        ...data,
        id: 'role-' + Date.now(),
        userCount: 0,
        createdAt: new Date().toISOString(),
        permissions: data.permissions || [],
      } as Role;
    }
  },

  updateRole: async (id: string, data: Partial<Role>): Promise<Role> => {
    await delay(500);
    const role = MOCK_ROLES.find(r => r.id === id)!;
    return { ...role, ...data };
  },

  deleteRole: async (_id: string): Promise<void> => {
    await delay(400);
  },

  togglePermission: async (roleId: string, permissionKey: string): Promise<Role> => {
    await delay(200);
    const role = MOCK_ROLES.find(r => r.id === roleId)!;
    const hasPermission = role.permissions.includes(permissionKey);
    return {
      ...role,
      permissions: hasPermission
        ? role.permissions.filter(p => p !== permissionKey)
        : [...role.permissions, permissionKey],
    };
  },
};
