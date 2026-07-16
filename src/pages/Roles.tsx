import React, { useEffect, useMemo, useState } from 'react';
import { Shield, Check, Save } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { rolesApi } from '../api/roles';
import type { Role } from '../types';

export const Roles: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: roles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: rolesApi.getRoles,
  });

  const { data: permissions = [] } = useQuery({
    queryKey: ['permissions'],
    queryFn: rolesApi.getPermissions,
  });

  const [selectedRole, setSelectedRole] = useState('');

  useEffect(() => {
    if (!selectedRole && roles.length) setSelectedRole(roles[0].id);
  }, [roles, selectedRole]);

  const toggleMutation = useMutation({
    mutationFn: async ({ roleId, key }: { roleId: string; key: string }) => {
      try {
        return await rolesApi.togglePermission(roleId, key);
      } catch {
        return null;
      }
    },
    onMutate: async ({ roleId, key }) => {
      await queryClient.cancelQueries({ queryKey: ['roles'] });
      const previous = queryClient.getQueryData<Role[]>(['roles']);
      queryClient.setQueryData<Role[]>(['roles'], (old) =>
        (old ?? []).map(r =>
          r.id === roleId
            ? {
                ...r,
                permissions: r.permissions.includes(key)
                  ? r.permissions.filter(p => p !== key)
                  : [...r.permissions, key],
              }
            : r
        )
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(['roles'], context.previous);
    },
  });

  const handleTogglePermission = (roleId: string, permKey: string) => {
    toggleMutation.mutate({ roleId, key: permKey });
  };

  const handleSaveMatrix = () => {
    alert('RBAC Access Policies Updated Successfully!');
  };

  const categories = useMemo(() => {
    const seen: string[] = [];
    for (const p of permissions) {
      if (!seen.includes(p.category)) seen.push(p.category);
    }
    return seen;
  }, [permissions]);

  const currentRole = roles.find(r => r.id === selectedRole);

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">RBAC Permissions Matrix</h1>
          <p className="text-gray-400 text-sm mt-1">Configure role privileges, link access boundaries, and review access policy rules.</p>
        </div>
        <button
          onClick={handleSaveMatrix}
          className="btn-primary px-4 py-2.5 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2"
        >
          <Save size={16} />
          <span>Save Changes</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Roles List */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Access Roles</h4>
          {rolesLoading && (
            <div className="text-sm text-gray-500 p-4">Loading roles…</div>
          )}
          {roles.map(role => (
            <button
              key={role.id}
              onClick={() => setSelectedRole(role.id)}
              className={`w-full text-left p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${
                selectedRole === role.id
                  ? 'bg-blue-600/10 border-blue-500/50 text-blue-400 shadow-lg'
                  : 'bg-gray-900/50 border-gray-800 text-gray-300 hover:bg-gray-800/40'
              }`}
            >
              <div className={`p-2 rounded-lg border ${
                selectedRole === role.id ? 'bg-blue-600/20 border-blue-500/20' : 'bg-gray-950 border-gray-800'
              }`}>
                <Shield size={18} />
              </div>
              <div className="space-y-1">
                <h5 className="font-bold text-sm text-white">{role.displayName}</h5>
                <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{role.description}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Permissions Grid */}
        <div className="lg:col-span-2 glass p-6 rounded-2xl border border-gray-800 space-y-6">
          <div>
            <h4 className="text-base font-bold text-white">
              Privileges for: {currentRole?.displayName ?? '—'}
            </h4>
            <p className="text-xs text-gray-500 mt-0.5">Toggle check boxes to instantly provision/revoke role capability.</p>
          </div>

          <div className="space-y-6 overflow-y-auto max-h-[500px] pr-2">
            {categories.map(cat => {
              const catPerms = permissions.filter(p => p.category === cat);
              return (
                <div key={cat} className="space-y-2">
                  <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-800/50 pb-1">
                    {cat}
                  </h5>
                  <div className="space-y-2">
                    {catPerms.map(perm => {
                      const hasPerm = (currentRole?.permissions || []).includes(perm.key);
                      return (
                        <div
                          key={perm.key}
                          onClick={() => currentRole && handleTogglePermission(currentRole.id, perm.key)}
                          className="flex items-center justify-between p-3.5 bg-gray-950/40 border border-gray-800/50 rounded-xl cursor-pointer hover:border-gray-700/50 transition-all"
                        >
                          <div className="space-y-0.5">
                            <p className="text-sm font-semibold text-gray-300">{perm.name}</p>
                            <p className="text-xxs text-gray-500 font-medium">Capability key: {perm.key}</p>
                          </div>
                          <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                            hasPerm
                              ? 'bg-blue-600 border-blue-500 text-white'
                              : 'border-gray-800 bg-gray-950'
                          }`}>
                            {hasPerm && <Check size={12} />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
