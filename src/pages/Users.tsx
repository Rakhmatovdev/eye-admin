import React, { useState } from 'react';
import { Plus, Search, Filter, ShieldAlert, Check, Trash } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../api/users';
import type { ClearanceLevel, User, UserRole } from '../types';
import { useT } from '../hooks/useT';

export const Users: React.FC = () => {
  const t = useT();
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getUsers(),
  });

  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('analyst');
  const [newClearance, setNewClearance] = useState<ClearanceLevel>('SECRET');
  const [newDepartment, setNewDepartment] = useState('Threat Intel');

  const createMutation = useMutation({
    mutationFn: (data: Partial<User>) => usersApi.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (user: User) =>
      user.status === 'active' ? usersApi.suspendUser(user.id) : usersApi.activateUser(user.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersApi.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      name: newName,
      email: newEmail,
      role: newRole,
      clearance: newClearance,
      department: newDepartment,
    });
    setShowCreateModal(false);
    setNewName('');
    setNewEmail('');
  };

  const handleToggleStatus = (user: User) => {
    toggleStatusMutation.mutate(user);
  };

  const handleDeleteUser = (id: string) => {
    if (confirm(t('users.confirmDelete'))) {
      deleteMutation.mutate(id);
    }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.department.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">{t('users.title')}</h1>
          <p className="text-gray-400 text-sm mt-1">{t('users.subtitle')}</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary px-4 py-2.5 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2"
        >
          <Plus size={16} />
          <span>{t('users.provisionUser')}</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder={t('users.searchPlaceholder')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-all"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-sm text-gray-400 hover:text-gray-200">
          <Filter size={16} />
          <span>{t('users.filters')}</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="glass rounded-2xl border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-950/40 text-gray-400 text-xs font-semibold uppercase tracking-wider">
                <th className="p-4">{t('users.table.name')}</th>
                <th className="p-4">{t('users.table.clearance')}</th>
                <th className="p-4">{t('users.table.department')}</th>
                <th className="p-4">{t('users.table.role')}</th>
                <th className="p-4">{t('users.table.status')}</th>
                <th className="p-4">{t('users.table.lastLogin')}</th>
                <th className="p-4 text-right">{t('users.table.accessControl')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {isLoading && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-sm text-gray-500">{t('users.loadingIdentities')}</td>
                </tr>
              )}
              {!isLoading && filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-sm text-gray-500">{t('users.noUsersFound')}</td>
                </tr>
              )}
              {filteredUsers.map(user => (
                <tr key={user.id} className="table-row-hover text-sm">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-900/30 text-blue-400 flex items-center justify-center font-bold border border-blue-500/20">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-200">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded-full text-xxs font-bold ${
                      user.clearance === 'TOP_SECRET' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                      user.clearance === 'SECRET' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' :
                      user.clearance === 'CONFIDENTIAL' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                      'bg-gray-500/10 text-gray-500 border border-gray-500/20'
                    }`}>
                      {user.clearance}
                    </span>
                  </td>
                  <td className="p-4 text-gray-400">{user.department}</td>
                  <td className="p-4 capitalize text-gray-300">{user.role}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                      user.status === 'active' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        user.status === 'active' ? 'bg-green-500 live-dot' : 'bg-red-500'
                      }`} />
                      {user.status}
                    </span>
                  </td>
                  <td className="p-4 text-gray-500">{user.lastLogin}</td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleToggleStatus(user)}
                        title={user.status === 'active' ? t('users.suspendAccess') : t('users.activateAccess')}
                        className={`p-1.5 rounded-lg border transition-all ${
                          user.status === 'active'
                            ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20'
                            : 'bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20'
                        }`}
                      >
                        {user.status === 'active' ? <ShieldAlert size={14} /> : <Check size={14} />}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        title={t('users.revokeIdentity')}
                        className="p-1.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-all"
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Provision User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay p-4">
          <div className="glass w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-gray-800">
            <div className="p-6 border-b border-gray-800 bg-gray-950/50">
              <h3 className="text-lg font-bold text-white">{t('users.modalTitle')}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{t('users.modalSubtitle')}</p>
            </div>
            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">{t('users.fullName')}</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-blue-500"
                    placeholder={t('users.fullNamePlaceholder')}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">{t('users.systemEmail')}</label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-blue-500"
                    placeholder={t('users.emailPlaceholder')}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">{t('users.systemRole')}</label>
                  <select
                    value={newRole}
                    onChange={e => setNewRole(e.target.value as UserRole)}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-blue-500"
                  >
                    <option value="admin">{t('users.roleAdmin')}</option>
                    <option value="analyst">{t('users.roleAnalyst')}</option>
                    <option value="viewer">{t('users.roleViewer')}</option>
                    <option value="operator">{t('users.roleOperator')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">{t('users.clearanceClass')}</label>
                  <select
                    value={newClearance}
                    onChange={e => setNewClearance(e.target.value as ClearanceLevel)}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-blue-500"
                  >
                    <option value="TOP_SECRET">{t('users.clearanceTopSecret')}</option>
                    <option value="SECRET">{t('users.clearanceSecret')}</option>
                    <option value="CONFIDENTIAL">{t('users.clearanceConfidential')}</option>
                    <option value="UNCLASSIFIED">{t('users.clearanceUnclassified')}</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">{t('users.table.department')}</label>
                  <input
                    type="text"
                    required
                    value={newDepartment}
                    onChange={e => setNewDepartment(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-blue-500"
                    placeholder={t('users.departmentPlaceholder')}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-800 rounded-xl text-sm font-semibold text-gray-400 hover:bg-gray-800/30 transition-all"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="btn-primary px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                >
                  {createMutation.isPending ? t('users.provisioning') : t('users.provisionUser')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
