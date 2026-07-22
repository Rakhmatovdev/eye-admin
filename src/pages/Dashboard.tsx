import React from 'react';
import { 
  Users, 
  ShieldAlert, 
  Layers, 
  Activity, 
  ArrowUpRight, 
  ArrowDownRight,
  TrendingUp
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { sensorsApi } from '../api/sensors';
import { militaryApi } from '../api/military';
import { usersApi } from '../api/users';
import { entitiesApi } from '../api/entities';
import { useT } from '../hooks/useT';

export const Dashboard: React.FC = () => {
  const t = useT();
  // Live platform metrics (fall back gracefully inside each api on error).
  const { data: sensorStats } = useQuery({ queryKey: ['dash-sensors'], queryFn: sensorsApi.stats });
  const { data: milStats } = useQuery({ queryKey: ['dash-mil'], queryFn: militaryApi.stats });
  const { data: users } = useQuery({ queryKey: ['dash-users'], queryFn: () => usersApi.getUsers() });
  const { data: entityTypes } = useQuery({ queryKey: ['dash-types'], queryFn: entitiesApi.getEntityTypes });

  const stats = [
    { name: t('dashboard.statTotalUsers'), value: users ? String(users.length) : '—', icon: Users, trend: 'live', up: true, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { name: t('dashboard.statSensorsOnline'), value: sensorStats ? `${sensorStats.online}/${sensorStats.total}` : '—', icon: Activity, trend: `${sensorStats?.degraded ?? 0} deg`, up: true, color: 'text-green-500', bg: 'bg-green-500/10' },
    { name: t('dashboard.statThreatTracks'), value: milStats ? String(milStats.threats) : '—', icon: ShieldAlert, trend: `${milStats?.critical_threats ?? 0} crit`, up: false, color: 'text-red-500', bg: 'bg-red-500/10' },
    { name: t('dashboard.statActiveMissions'), value: milStats ? String(milStats.active_missions) : '—', icon: Layers, trend: 'ops', up: true, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  ];

  // Mock Traffic Data
  const trafficData = [
    { time: '00:00', requests: 1200, errors: 12 },
    { time: '04:00', requests: 800, errors: 4 },
    { time: '08:00', requests: 2400, errors: 45 },
    { time: '12:00', requests: 3800, errors: 98 },
    { time: '16:00', requests: 3100, errors: 52 },
    { time: '20:00', requests: 1900, errors: 22 },
  ];

  // Entity distribution from the live ontology (grouped by type).
  const entityData = (entityTypes ?? [])
    .slice(0, 6)
    .map((t) => ({ name: t.name, value: t.count, color: t.color }));

  const recentIncidents = [
    { id: '1', title: 'Brute Force Attempt', status: 'Blocked', severity: 'High', time: '12m ago', target: 'admin@platform.io' },
    { id: '2', title: 'Impossible Travel Anomaly', status: 'Investigating', severity: 'Medium', time: '42m ago', target: 'analyst@platform.io' },
    { id: '3', title: 'Suspicious Bulk File Access', status: 'Mitigated', severity: 'Critical', time: '2h ago', target: 'viewer@platform.io' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-gradient-to-r from-gray-900 to-slate-900 border border-gray-800 rounded-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            {t('dashboard.title')} <span className="live-dot w-2.5 h-2.5 bg-green-500 rounded-full inline-block" />
          </h1>
          <p className="text-gray-400 text-sm mt-1">{t('dashboard.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2 bg-gray-800/80 px-4 py-2 rounded-xl border border-gray-700/50">
          <TrendingUp size={16} className="text-blue-400" />
          <span className="text-xs font-semibold text-gray-300">{t('dashboard.allNodesOperational')}</span>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="glass p-5 rounded-2xl border border-gray-800 flex items-center justify-between card-hover">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{stat.name}</span>
                <h3 className="text-3xl font-extrabold text-white">{stat.value}</h3>
                <div className="flex items-center gap-1.5 mt-2">
                  {stat.up ? (
                    <ArrowUpRight size={14} className="text-green-500" />
                  ) : (
                    <ArrowDownRight size={14} className="text-red-500" />
                  )}
                  <span className={`text-xs font-bold ${stat.up ? 'text-green-500' : 'text-red-500'}`}>{stat.trend}</span>
                  <span className="text-xxs text-gray-500 font-medium">{t('dashboard.vsLastMonth')}</span>
                </div>
              </div>
              <div className={`w-12 h-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center border border-gray-800`}>
                <Icon size={22} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass p-5 rounded-2xl border border-gray-800">
          <h4 className="text-base font-bold text-white mb-4">{t('dashboard.trafficTitle')}</h4>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trafficData}>
                <defs>
                  <linearGradient id="requestsGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="requests" stroke="#3B82F6" fillOpacity={1} fill="url(#requestsGlow)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass p-5 rounded-2xl border border-gray-800 flex flex-col justify-between">
          <div>
            <h4 className="text-base font-bold text-white mb-4">{t('dashboard.ontologyChartTitle')}</h4>
            <div className="h-60 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={entityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {entityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {entityData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: item.color }} />
                <span className="text-gray-400">{item.name} ({item.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Underworld / Lower Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Incidents */}
        <div className="glass p-5 rounded-2xl border border-gray-800">
          <h4 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            {t('dashboard.threatIndicatorsTitle')} <span className="live-dot-red w-2 h-2 bg-red-500 rounded-full" />
          </h4>
          <div className="divide-y divide-gray-800 space-y-3">
            {recentIncidents.map(inc => (
              <div key={inc.id} className="pt-3 flex items-center justify-between text-sm">
                <div>
                  <h5 className="font-semibold text-gray-200">{inc.title}</h5>
                  <p className="text-xs text-gray-500">{t('dashboard.targetLabel')} {inc.target} • {inc.time}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xxs font-bold ${
                    inc.severity === 'Critical' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                    inc.severity === 'High' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' :
                    'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                  }`}>
                    {inc.severity}
                  </span>
                  <span className="text-xs text-gray-400 font-medium">{inc.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Node Telemetry */}
        <div className="glass p-5 rounded-2xl border border-gray-800">
          <h4 className="text-base font-bold text-white mb-4">{t('dashboard.coreNodeServicesTitle')}</h4>
          <div className="space-y-3.5">
            {[
              { name: 'PostgreSQL Relational DB', status: 'Healthy', ping: '12ms' },
              { name: 'Redis Token Store', status: 'Healthy', ping: '2ms' },
              { name: 'WebSocket Real-time Broadcast', status: 'Healthy', ping: '1ms' },
              { name: 'mTLS Remote Agent Connector', status: 'Slight Lag', ping: '180ms', lag: true },
            ].map((node, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${node.lag ? 'live-dot-amber bg-amber-500' : 'live-dot bg-green-500'}`} />
                  <span className="font-medium text-gray-300">{node.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-gray-400">{node.status}</p>
                  <p className="text-xxs text-gray-500">{node.ping}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
