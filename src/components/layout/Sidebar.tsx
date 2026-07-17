import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Database,
  Binary,
  Activity,
  FileSpreadsheet,
  Cpu,
  ShieldAlert,
  LogOut,
  Cctv,
  Crosshair,
  Brain,
  Settings as SettingsIcon
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useT } from '../../hooks/useT';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (c: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed }) => {
  const logout = useAuthStore(state => state.logout);
  const user = useAuthStore(state => state.user);
  const t = useT();

  const menuItems = [
    { name: t('nav.dashboard'), path: '/dashboard', icon: LayoutDashboard },
    { name: t('nav.users'), path: '/users', icon: Users },
    { name: t('nav.roles'), path: '/roles', icon: ShieldCheck },
    { name: t('nav.dataSources'), path: '/data-sources', icon: Database },
    { name: t('nav.ontology'), path: '/ontology', icon: Binary },
    { name: t('nav.monitoring'), path: '/monitoring', icon: Activity },
    { name: t('nav.auditLogs'), path: '/audit-logs', icon: FileSpreadsheet },
    { name: t('nav.surveillance'), path: '/surveillance', icon: Cctv },
    { name: t('nav.command'), path: '/command', icon: Crosshair },
    { name: t('nav.remoteAgents'), path: '/remote-agents', icon: Cpu },
    { name: t('nav.security'), path: '/security', icon: ShieldAlert },
    { name: t('nav.threatIntel'), path: '/threat-intel', icon: Brain },
    { name: t('nav.settings'), path: '/settings', icon: SettingsIcon },
  ];

  return (
    <aside 
      className={`bg-gray-900 border-r border-gray-800 transition-all duration-300 flex flex-col justify-between h-screen fixed left-0 top-0 z-30 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div>
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-gray-800 gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/30">
            N
          </div>
          {!collapsed && (
            <span className="font-extrabold text-lg tracking-wider gradient-text">
              BRAVE ADMIN
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav className="p-2 space-y-1">
          {menuItems.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600/10 text-blue-400 border-l-2 border-blue-500'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                  }`
                }
              >
                <Icon size={18} />
                {!collapsed && <span>{item.name}</span>}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-gray-800 space-y-3">
        {!collapsed && user && (
          <div className="px-2 py-1">
            <p className="text-sm font-semibold truncate">{user.name}</p>
            <p className="text-xs text-gray-500 truncate capitalize">{user.role}</p>
          </div>
        )}
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-950/20 transition-all"
        >
          <LogOut size={18} />
          {!collapsed && <span>{t('nav.logout')}</span>}
        </button>
      </div>
    </aside>
  );
};
