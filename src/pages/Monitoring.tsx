import React, { useState, useEffect } from 'react';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { Cpu, HardDrive, Network, Layers, RefreshCw } from 'lucide-react';

interface MetricNode {
  time: string;
  cpu: number;
  ram: number;
  requests: number;
}

export const Monitoring: React.FC = () => {
  const [metrics, setMetrics] = useState<MetricNode[]>([]);
  const [cpuUsage, setCpuUsage] = useState(24.8);
  const [ramUsage, setRamUsage] = useState(62.4);
  const [requestsSec, setRequestsSec] = useState(42);

  // Initialize and update metrics in real-time
  useEffect(() => {
    // Generate initial history points
    const history: MetricNode[] = [];
    const now = new Date();
    for (let i = 15; i >= 0; i--) {
      const timeStr = new Date(now.getTime() - i * 3000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      history.push({
        time: timeStr,
        cpu: Math.floor(Math.random() * 30 + 15),
        ram: Math.floor(Math.random() * 10 + 55),
        requests: Math.floor(Math.random() * 40 + 20),
      });
    }
    setMetrics(history);

    const interval = setInterval(() => {
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const newCpu = Math.floor(Math.random() * 40 + 10);
      const newRam = Math.floor(Math.random() * 5 + 60);
      const newRequests = Math.floor(Math.random() * 60 + 15);

      setCpuUsage(newCpu);
      setRamUsage(newRam);
      setRequestsSec(newRequests);

      setMetrics(prev => [
        ...prev.slice(1),
        { time: timeStr, cpu: newCpu, ram: newRam, requests: newRequests }
      ]);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const services = [
    { name: 'PostgreSQL Relational DB', status: 'healthy', uptime: '99.98%', latency: '8ms' },
    { name: 'Redis Cache Server', status: 'healthy', uptime: '99.99%', latency: '2ms' },
    { name: 'WebSocket Broadcast Server', status: 'healthy', uptime: '100%', latency: '1ms' },
    { name: 'SIEM Threat Intelligence', status: 'healthy', uptime: '99.95%', latency: '14ms' },
    { name: 'ETL Ingestion Pipelines', status: 'healthy', uptime: '99.90%', latency: '40ms' },
    { name: 'mTLS Agent Controller', status: 'healthy', uptime: '99.85%', latency: '120ms' },
  ];

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
          <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center border border-blue-500/20">
            <Cpu size={22} />
          </div>
          <div>
            <p className="text-xxs text-gray-500 uppercase font-semibold">CPU operational load</p>
            <h3 className="text-2xl font-extrabold text-white">{cpuUsage}%</h3>
          </div>
        </div>
        <div className="glass p-5 rounded-2xl border border-gray-800 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-500/10 text-green-500 rounded-xl flex items-center justify-center border border-green-500/20">
            <HardDrive size={22} />
          </div>
          <div>
            <p className="text-xxs text-gray-500 uppercase font-semibold">Memory usage</p>
            <h3 className="text-2xl font-extrabold text-white">{ramUsage}%</h3>
          </div>
        </div>
        <div className="glass p-5 rounded-2xl border border-gray-800 flex items-center gap-4">
          <div className="w-12 h-12 bg-cyan-500/10 text-cyan-500 rounded-xl flex items-center justify-center border border-cyan-500/20">
            <Network size={22} />
          </div>
          <div>
            <p className="text-xxs text-gray-500 uppercase font-semibold">Active load</p>
            <h3 className="text-2xl font-extrabold text-white">{requestsSec} req/sec</h3>
          </div>
        </div>
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass p-5 rounded-2xl border border-gray-800">
          <h4 className="text-base font-bold text-white mb-4">CPU Utilization (Real-time)</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" hide />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="cpu" stroke="#3B82F6" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass p-5 rounded-2xl border border-gray-800">
          <h4 className="text-base font-bold text-white mb-4">Memory Buffer Map</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" hide />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Area type="monotone" dataKey="ram" stroke="#10B981" fill="#10B981" fillOpacity={0.1} strokeWidth={2} dot={false} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Services status */}
      <div className="glass p-6 rounded-2xl border border-gray-800">
        <h4 className="text-base font-bold text-white mb-4">Node Operations & Service Status</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((srv, idx) => (
            <div key={idx} className="bg-gray-950/40 p-4 border border-gray-800/40 rounded-xl space-y-2 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-gray-200">{srv.name}</span>
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 live-dot inline-block" />
              </div>
              <div className="flex justify-between text-xs text-gray-500 pt-2 border-t border-gray-800/30">
                <span>Uptime: {srv.uptime}</span>
                <span>Latency: {srv.latency}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
