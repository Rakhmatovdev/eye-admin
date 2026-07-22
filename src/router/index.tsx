import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AuthGuard } from '../components/guards/AuthGuard';
import { AppLayout } from '../components/layout/AppLayout';
import { Login } from '../pages/Login';
import { ForgotPassword } from '../pages/ForgotPassword';
import { ResetPassword } from '../pages/ResetPassword';
import { Dashboard } from '../pages/Dashboard';
import { Users } from '../pages/Users';
import { Roles } from '../pages/Roles';
import { DataSources } from '../pages/DataSources';
import { Ontology } from '../pages/Ontology';
import { Monitoring } from '../pages/Monitoring';
import { AuditLogs } from '../pages/AuditLogs';
import { RemoteAgents } from '../pages/RemoteAgents';
import { Security } from '../pages/Security';
import { Surveillance } from '../pages/Surveillance';
import { Command } from '../pages/Command';
import { ThreatIntel } from '../pages/ThreatIntel';
import { Settings } from '../pages/Settings';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPassword />,
  },
  {
    path: '/reset-password',
    element: <ResetPassword />,
  },
  {
    path: '/',
    element: (
      <AuthGuard>
        <AppLayout />
      </AuthGuard>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <Dashboard />,
      },
      {
        path: 'users',
        element: <Users />,
      },
      {
        path: 'roles',
        element: <Roles />,
      },
      {
        path: 'data-sources',
        element: <DataSources />,
      },
      {
        path: 'ontology',
        element: <Ontology />,
      },
      {
        path: 'monitoring',
        element: <Monitoring />,
      },
      {
        path: 'audit-logs',
        element: <AuditLogs />,
      },
      {
        path: 'remote-agents',
        element: <RemoteAgents />,
      },
      {
        path: 'security',
        element: <Security />,
      },
      {
        path: 'surveillance',
        element: <Surveillance />,
      },
      {
        path: 'command',
        element: <Command />,
      },
      {
        path: 'threat-intel',
        element: <ThreatIntel />,
      },
      {
        path: 'settings',
        element: <Settings />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);
