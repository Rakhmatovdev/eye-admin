import React, { useState } from 'react';
import { Cpu, Terminal, Play, Circle, ShieldAlert } from 'lucide-react';

export const RemoteAgents: React.FC = () => {
  const [agents, setAgents] = useState([
    { id: '1', name: 'Tashkent Border Collector 01', type: 'collector', status: 'online', version: 'v1.4.2', heartbeat: '5s ago', location: 'Tashkent, UZ', platform: 'Linux x86_64', activeTask: 'Listening on Customs API' },
    { id: '2', name: 'Samarkand Sensor Node', type: 'sensor', status: 'online', version: 'v1.4.1', heartbeat: '12s ago', location: 'Samarkand, UZ', platform: 'Raspberry Pi 4', activeTask: 'Syncing telemetry packet' },
    { id: '3', name: 'Almaty Proxy Relay', type: 'relay', status: 'degraded', version: 'v1.4.0', heartbeat: '1m ago', location: 'Almaty, KZ', platform: 'Windows Server 2022', activeTask: 'Buffer queue threshold warning' },
    { id: '4', name: 'Bishkek Collector 02', type: 'collector', status: 'offline', version: 'v1.4.2', heartbeat: '2h ago', location: 'Bishkek, KG', platform: 'Linux x86_64', activeTask: 'Idle / Network route timeout' },
  ]);

  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [cmd, setCmd] = useState('restart');
  const [logs, setLogs] = useState<string[]>([
    '[2026-07-14 10:40:01] Initializing remote handshake...',
    '[2026-07-14 10:40:02] mTLS verification completed (ClientCert verified)',
    '[2026-07-14 10:40:02] Connected to core telemetry stream',
  ]);

  const handleSendCommand = (agentId: string) => {
    setLogs(prev => [
      ...prev,
      `[2026-07-14 10:44:12] Command [${cmd.toUpperCase()}] dispatched by System Administrator.`,
      `[2026-07-14 10:44:13] HANDSHAKE: Agent acknowledged command code.`,
      `[2026-07-14 10:44:15] EXECUTION: Command finished with exit code 0.`
    ]);
    alert(`Command [${cmd.toUpperCase()}] successfully issued to Agent.`);
  };

  const activeAgent = agents.find(a => a.id === selectedAgentId);

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Remote Agent Governance
          </h1>
          <p className="text-gray-400 text-sm mt-1">Configure edge sensor daemons, telemetry collectors, and dispatch mTLS remote shell commands.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agents Grid List */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {agents.map(agent => (
            <div
              key={agent.id}
              onClick={() => {
                setSelectedAgentId(agent.id);
                setLogs([
                  `[2026-07-14 10:40:01] HANDSHAKE: Handled by edge endpoint ${agent.location}`,
                  `[2026-07-14 10:40:02] MTLS: TLS_AES_256_GCM_SHA384 handshake completed`,
                  `[2026-07-14 10:40:03] TELEMETRY: Streaming packet payload size 24.2KB`,
                ]);
              }}
              className={`glass p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between h-44 card-hover ${
                selectedAgentId === agent.id ? 'border-blue-500/50 bg-blue-600/5' : 'border-gray-800'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-gray-950 border border-gray-800 rounded-lg text-gray-400">
                      <Cpu size={16} />
                    </div>
                    <span className="text-xxs text-gray-500 uppercase font-bold">{agent.type}</span>
                  </div>
                  {/* Status dot */}
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                    agent.status === 'online' ? 'text-green-400' :
                    agent.status === 'degraded' ? 'text-amber-400' : 'text-red-400'
                  }`}>
                    <Circle size={8} fill={
                      agent.status === 'online' ? '#10B981' :
                      agent.status === 'degraded' ? '#F59E0B' : '#EF4444'
                    } />
                    {agent.status}
                  </span>
                </div>

                <h4 className="font-bold text-sm text-gray-200 mt-1 leading-snug">{agent.name}</h4>
                <p className="text-xxs text-gray-500 mt-0.5">{agent.platform} • {agent.location}</p>
              </div>

              <div className="pt-2 border-t border-gray-800/40 flex justify-between items-center text-xxs text-gray-500">
                <span className="truncate max-w-[150px]">{agent.activeTask}</span>
                <span>{agent.heartbeat}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Command Panel & Live terminal logs */}
        <div className="glass p-5 rounded-2xl border border-gray-800 flex flex-col justify-between h-96">
          {activeAgent ? (
            <div className="space-y-4 flex-1 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-sm text-white flex items-center gap-2">
                  <Terminal size={14} className="text-blue-500" />
                  Remote: {activeAgent.name}
                </h4>
                <p className="text-xxs text-gray-500 mt-0.5">Firmware: {activeAgent.version} • Location: {activeAgent.location}</p>

                {/* Dropdown & Dispatch command */}
                <div className="flex gap-2 mt-4">
                  <select
                    value={cmd}
                    onChange={e => setCmd(e.target.value)}
                    className="flex-1 bg-gray-950 border border-gray-800 rounded-lg px-2 py-1.5 text-xs text-gray-300 focus:outline-none"
                  >
                    <option value="restart">Restart Edge Daemon</option>
                    <option value="update">Update Firmware</option>
                    <option value="collect">Force Sync Telemetry</option>
                    <option value="stop">Stop Node Ingest</option>
                  </select>
                  <button
                    onClick={() => handleSendCommand(activeAgent.id)}
                    className="btn-primary p-2 rounded-lg text-white"
                  >
                    <Play size={14} />
                  </button>
                </div>
              </div>

              {/* Console Logs */}
              <div className="flex-1 mt-4 bg-gray-950 border border-gray-800 rounded-xl p-3 font-mono text-[10px] text-green-500 overflow-y-auto no-scrollbar max-h-44 space-y-1">
                {logs.map((log, idx) => (
                  <div key={idx} className="leading-normal">{log}</div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 space-y-2">
              <Terminal size={32} />
              <p className="text-xs">Select a remote agent to audit active connection handshake logs and dispatch console controls.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
