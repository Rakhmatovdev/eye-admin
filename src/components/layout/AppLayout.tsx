import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export const AppLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#0B0F1A] text-gray-100">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div 
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          collapsed ? 'pl-16' : 'pl-64'
        }`}
      >
        <Topbar collapsed={collapsed} setCollapsed={setCollapsed} />
        <main className="flex-1 p-6 overflow-y-auto h-[calc(100vh-64px)]">
          <div className="max-w-7xl mx-auto space-y-6 page-enter">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
