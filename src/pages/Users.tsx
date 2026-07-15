import React, { useState } from 'react';
import { Plus, Search, Filter, Edit2, ShieldAlert, LogOut, Check, Trash } from 'lucide-react';

export const Users: React.FC = () => {
  // Mock User Data
  const [users, setUsers] = useState([
    { id: '1', name: 'Alisher Karimov', email: 'alisher@nexus.io', role: 'admin', clearance: 'TOP_SECRET', status: 'active', department: 'Executive', lastLogin: '10m ago' },
    { id: '2', name: 'Elena Petrova', email: 'elena@nexus.io', role: 'analyst', clearance: 'SECRET', status: 'active', department: 'Threat Intel', lastLogin: '1h ago' },
    { id: '3', name: 'Rustam Nazarov', email: 'rustam@nexus.io', role: 'analyst', clearance: 'CONFIDENTIAL', status: 'suspended', department: 'Field Ops', lastLogin: '3d ago' },
    { id: '4', name: 'John Doe', email: 'john@nexus.io', role: 'viewer', clearance: 'UNCLASSIFIED', status: 'active', department: 'Audit', lastLogin: '1d ago' },
    { id: '5', name: 'Sarah Connor', email: 'sarah@nexus.io', role: 'operator', clearance: 'SECRET', status: 'active', department: 'Defense', lastLogin: '45m ago' },
  ]);

  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('analyst');
  const [newClearance, setNewClearance] = useState('SECRET');
  const [newDepartment, setNewDepartment] = useState('Threat Intel');

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser = {
      id: String(users.length + 1),
      name: newName,
      email: newEmail,
      role: newRole,
      clearance: newClearance,
      status: 'active',
      department: newDepartment,
      lastLogin: 'Never'
    };
    setUsers([newUser, ...users]);
    setShowCreateModal(false);
    setNewName('');
    setNewEmail('');
  };

  const handleToggleStatus = (id: string) => {
    setUsers(users.map(u => {
      if (u.id === id) {
        return { ...u, status: u.status === 'active' ? 'suspended' : 'active' };
      }
      return u;
    }));
  };

  const handleDeleteUser = (id: string) => {
    if (confirm('Are you sure you want to delete this identity?')) {
      setUsers(users.filter(u => u.id !== id));
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
          <h1 className="text-2xl font-bold tracking-tight text-white">Identity Governance</h1>
          <p className="text-gray-400 text-sm mt-1">Manage personnel registry, active authentication states, and clearance levels.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary px-4 py-2.5 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2"
        >
          <Plus size={16} />
          <span>Provision User</span>
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
            placeholder="Search by name, email, or department..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-all"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-sm text-gray-400 hover:text-gray-200">
          <Filter size={16} />
          <span>Filters</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="glass rounded-2xl border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-950/40 text-gray-400 text-xs font-semibold uppercase tracking-wider">
                <th className="p-4">Name / ID</th>
                <th className="p-4">Clearance</th>
                <th className="p-4">Department</th>
                <th className="p-4">Role</th>
                <th className="p-4">Status</th>
                <th className="p-4">Last Login</th>
                <th className="p-4 text-right">Access Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
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
                        onClick={() => handleToggleStatus(user.id)}
                        title={user.status === 'active' ? 'Suspend Access' : 'Activate Access'}
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
                        title="Revoke Identity"
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
              <h3 className="text-lg font-bold text-white">Provision System Identity</h3>
              <p className="text-xs text-gray-500 mt-0.5">Initialize credentials and link clearance bounds.</p>
            </div>
            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">Full Name</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-blue-500"
                    placeholder="Enter user full name..."
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">System Email</label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-blue-500"
                    placeholder="e.g. user@nexus.io"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">System Role</label>
                  <select
                    value={newRole}
                    onChange={e => setNewRole(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-blue-500"
                  >
                    <option value="admin">Administrator</option>
                    <option value="analyst">Analyst</option>
                    <option value="viewer">Viewer</option>
                    <option value="operator">Operator</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">Clearance Class</label>
                  <select
                    value={newClearance}
                    onChange={e => setNewClearance(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-blue-500"
                  >
                    <option value="TOP_SECRET">Top Secret</option>
                    <option value="SECRET">Secret</option>
                    <option value="CONFIDENTIAL">Confidential</option>
                    <option value="UNCLASSIFIED">Unclassified</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">Department</label>
                  <input
                    type="text"
                    required
                    value={newDepartment}
                    onChange={e => setNewDepartment(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-blue-500"
                    placeholder="e.g. Threat Intel / Ops"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-800 rounded-xl text-sm font-semibold text-gray-400 hover:bg-gray-800/30 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary px-4 py-2 rounded-xl text-sm font-semibold text-white"
                >
                  Provision User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
