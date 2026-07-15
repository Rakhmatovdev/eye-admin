import React, { useState } from 'react';
import { Shield, Check, Save } from 'lucide-react';

export const Roles: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState('analyst');

  const [roles, setRoles] = useState([
    { id: 'admin', name: 'Administrator', description: 'Complete administrative controls, full read/write, user provisioning and remote agent actions.' },
    { id: 'analyst', name: 'Analyst', description: 'Standard intelligence analyst permissions. Access to graph investigation, timelines, and geospatial maps.' },
    { id: 'viewer', name: 'Viewer', description: 'Read-only access to entity databases and saved cases. No write, export, or audit modifications.' },
    { id: 'operator', name: 'Operator', description: 'Handles data ingest, scheduler parameters, and source configuration.' },
  ]);

  const [permissions, setPermissions] = useState([
    { key: 'users:write', name: 'Create/Provision Users', category: 'Identity' },
    { key: 'users:read', name: 'Read Users Registry', category: 'Identity' },
    { key: 'entities:write', name: 'Modify Ontology Nodes', category: 'Data Analysis' },
    { key: 'entities:read', name: 'Read Entities', category: 'Data Analysis' },
    { key: 'graph:expand', name: 'Perform Link Analysis', category: 'Data Analysis' },
    { key: 'agents:command', name: 'Issue Remote Agent Commands', category: 'System Operations' },
    { key: 'audit:read', name: 'View System Audit Logs', category: 'System Operations' },
    { key: 'security:write', name: 'Resolve Incidents & Blocklist', category: 'Security' },
  ]);

  const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>({
    admin: [
      'users:write', 'users:read', 'entities:write', 'entities:read',
      'graph:expand', 'agents:command', 'audit:read', 'security:write'
    ],
    analyst: [
      'users:read', 'entities:read', 'graph:expand'
    ],
    viewer: [
      'entities:read'
    ],
    operator: [
      'entities:write', 'entities:read', 'agents:command'
    ],
  });

  const handleTogglePermission = (roleId: string, permKey: string) => {
    const activePerms = rolePermissions[roleId] || [];
    let updated: string[];

    if (activePerms.includes(permKey)) {
      updated = activePerms.filter(k => k !== permKey);
    } else {
      updated = [...activePerms, permKey];
    }

    setRolePermissions({
      ...rolePermissions,
      [roleId]: updated
    });
  };

  const handleSaveMatrix = () => {
    alert('RBAC Access Policies Updated Successfully!');
  };

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
                <h5 className="font-bold text-sm text-white">{role.name}</h5>
                <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{role.description}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Permissions Grid */}
        <div className="lg:col-span-2 glass p-6 rounded-2xl border border-gray-800 space-y-6">
          <div>
            <h4 className="text-base font-bold text-white">
              Privileges for: {roles.find(r => r.id === selectedRole)?.name}
            </h4>
            <p className="text-xs text-gray-500 mt-0.5">Toggle check boxes to instantly provision/revoke role capability.</p>
          </div>

          <div className="space-y-6 overflow-y-auto max-h-[500px] pr-2">
            {['Identity', 'Data Analysis', 'System Operations', 'Security'].map(cat => {
              const catPerms = permissions.filter(p => p.category === cat);
              return (
                <div key={cat} className="space-y-2">
                  <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-800/50 pb-1">
                    {cat}
                  </h5>
                  <div className="space-y-2">
                    {catPerms.map(perm => {
                      const hasPerm = (rolePermissions[selectedRole] || []).includes(perm.key);
                      return (
                        <div
                          key={perm.key}
                          onClick={() => handleTogglePermission(selectedRole, perm.key)}
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
