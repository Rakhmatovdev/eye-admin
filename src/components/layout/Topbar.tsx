import React from 'react';
import { Menu, Bell, Shield, Search } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { LocaleSwitcher } from '../ui/LocaleSwitcher';

interface TopbarProps {
  collapsed: boolean;
  setCollapsed: (c: boolean) => void;
}

export const Topbar: React.FC<TopbarProps> = ({ collapsed, setCollapsed }) => {
  const user = useAuthStore(state => state.user);

  return (
    <header className="h-16 bg-gray-900/80 backdrop-blur-md border-b border-gray-800 flex items-center justify-between px-6 sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-gray-400 hover:text-gray-200 p-1.5 rounded-lg hover:bg-gray-800 transition-all"
        >
          <Menu size={20} />
        </button>

        {/* Global Search */}
        <div className="relative max-w-xs hidden sm:block">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Global search (Ctrl+K)..."
            className="w-64 pl-9 pr-4 py-1.5 bg-gray-950 border border-gray-800 rounded-lg text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <LocaleSwitcher />

        {/* Clearance Level */}
        {user && (
          <div className="flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 px-2.5 py-1 rounded-full text-xs font-semibold">
            <Shield size={12} />
            <span>Clearance: {user.clearance}</span>
          </div>
        )}

        {/* Notifications */}
        <button className="relative text-gray-400 hover:text-gray-200 p-1.5 rounded-lg hover:bg-gray-800 transition-all">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-ping" />
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-3 border-l border-gray-800">
          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg text-sm">
            {user?.name.charAt(0) || 'A'}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-sm font-semibold leading-none">{user?.name}</p>
            <span className="text-xxs text-gray-500 uppercase font-bold">{user?.role}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
