import React from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { Cpu, HardDrive, Network } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { monitoringApi } from '../api/monitoring';
import type { ServiceStatus } from '../types';

interface MetricNode {
  time: string;
  memoryUsage: number;
  goroutines: number;
  heapMb: number;
}

function statusDotClass(status: ServiceStatus['status']): string {
  if (status === 'healthy') return 'bg-green-500';
  if (status === 'degraded') return 'bg-amber-500';
  if (status === 'down') return 'bg-red-500';
  return 'bg-gray-500';
}

export const Monitoring: React.FC = () => {
  const { data: services = [] } = useQuery({
    queryKey: ['monitoring', 'services'],
    queryFn: () => monitoringApi.getServices(),
    refetchInterval: 5000,
  });

  const { data: history = [] } = useQuery({
    queryKey: ['monitoring', 'metrics-history'],
    queryFn: () => monitoringApi.getMetricsHistory(),
    refetchInterval: 20000,
  });

  const metrics: MetricNode[] = history.map((sample) => ({
    time: new Date(sample.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    memoryUsage: Math.round(sample.memory_usage),
    goroutines: sample.goroutines,
    heapMb: Math.round(sample.heap_alloc_mb),
  }));

  const latest = history.length ? history[history.length - 1] : undefined;
  const memoryUsage = latest ? Math.round(latest.memory_usage) : 0;
  const heapMb = latest ? Math.round(latest.heap_alloc_mb) : 0;
  const goroutines = latest ? latest.goroutines : 0;

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Real-time Telemetry <span className="live-dot w-2 h-2 bg-green-500 rounded-full" />
          </h1>
          <p className="text-gray-400 text-sm mt-1">Monitor operational load metrics, memory buffers, service pings, and database connection pools.</p>
        </div>
      </div>

      {/* Numerical Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass p-5 rounded-2xl border border-gray-800 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-500/10 text-green-500 rounded-xl flex items-center justify-center border border-green-500/20">
            <HardDrive size={22} />
          </div>
          <div>
            <p className="text-xxs text-gray-500 uppercase font-semibold">Memory usage</p>
            <h3 className="text-2xl font-extrabold text-white">{memoryUsage}%</h3>
          </div>
        </div>
        <div className="glass p-5 rounded-2xl border border-gray-800 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center border border-blue-500/20">
            <Cpu size={22} />
          </div>
          <div>
            <p className="text-xxs text-gray-500 uppercase font-semibold">Heap allocated</p>
            <h3 className="text-2xl font-extrabold text-white">{heapMb} MB</h3>
          </div>
        </div>
        <div className="glass p-5 rounded-2xl border border-gray-800 flex items-center gap-4">
          <div className="w-12 h-12 bg-cyan-500/10 text-cyan-500 rounded-xl flex items-center justify-center border border-cyan-500/20">
            <Network size={22} />
          </div>
          <div>
            <p className="text-xxs text-gray-500 uppercase font-semibold">Active goroutines</p>
            <h3 className="text-2xl font-extrabold text-white">{goroutines}</h3>
          </div>
        </div>
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass p-5 rounded-2xl border border-gray-800">
          <h4 className="text-base font-bold text-white mb-4">Memory Usage % (Real-time)</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" hide />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="memoryUsage" stroke="#3B82F6" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass p-5 rounded-2xl border border-gray-800">
          <h4 className="text-base font-bold text-white mb-4">Goroutine Count (Real-time)</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" hide />
                <YAxis domain={[0, 'auto']} />
                <Tooltip />
                <Area type="monotone" dataKey="goroutines" stroke="#10B981" fill="#10B981" fillOpacity={0.1} strokeWidth={2} dot={false} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Services status */}
      <div className="glass p-6 rounded-2xl border border-gray-800">
        <h4 className="text-base font-bold text-white mb-4">Node Operations & Service Status</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((srv) => (
            <div key={srv.id} className="bg-gray-950/40 p-4 border border-gray-800/40 rounded-xl space-y-2 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-gray-200">{srv.name}</span>
                <span className={`w-2.5 h-2.5 rounded-full live-dot inline-block ${statusDotClass(srv.status)}`} />
              </div>
              <div className="flex justify-between text-xs text-gray-500 pt-2 border-t border-gray-800/30">
                <span>Uptime: {srv.uptime}%</span>
                <span>Latency: {srv.responseTime}ms</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
