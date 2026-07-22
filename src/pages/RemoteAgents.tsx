import React, { useState } from 'react';
import { Cpu, Terminal, Play, Circle } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { agentsApi } from '../api/agents';
import type { Agent } from '../types';
import { useT } from '../hooks/useT';
import type { TKey } from '../lib/i18n';

function statusTextClass(status: Agent['status']): string {
  if (status === 'online') return 'text-green-400';
  if (status === 'degraded' || status === 'updating') return 'text-amber-400';
  return 'text-red-400';
}

function statusFillColor(status: Agent['status']): string {
  if (status === 'online') return '#10B981';
  if (status === 'degraded' || status === 'updating') return '#F59E0B';
  return '#EF4444';
}

function heartbeatAgo(iso: string, t: (key: TKey) => string): string {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return `${seconds}${t('time.secondsAgo')}`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}${t('time.minutesAgo')}`;
  const hours = Math.floor(minutes / 60);
  return `${hours}${t('time.hoursAgo')}`;
}

export const RemoteAgents: React.FC = () => {
  const t = useT();
  const queryClient = useQueryClient();

  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: () => agentsApi.getAgents(),
    refetchInterval: 15000,
  });

  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [cmd, setCmd] = useState('restart');
  const [logs, setLogs] = useState<string[]>([]);

  const sendCommandMutation = useMutation({
    mutationFn: ({ agentId, command }: { agentId: string; command: string }) => agentsApi.sendCommand(agentId, command),
    onSuccess: (result, variables) => {
      const now = new Date().toLocaleString();
      setLogs(prev => [
        ...prev,
        `[${now}] ${t('remoteAgents.logCmdPrefix')}${variables.command.toUpperCase()}${t('remoteAgents.logCmdSuffix')}`,
        `[${now}] ${t('remoteAgents.logHandshakeAck')}`,
        `[${now}] ${t('remoteAgents.logExecutionPrefix')}${result.status}.`,
      ]);
      queryClient.invalidateQueries({ queryKey: ['agents', variables.agentId, 'commands'] });
      alert(`${t('remoteAgents.logCmdPrefix')}${variables.command.toUpperCase()}${t('remoteAgents.alertIssuedSuffix')}`);
    },
    onError: () => {
      alert(t('remoteAgents.dispatchFailedAlert'));
    },
  });

  const handleSelectAgent = (agent: Agent) => {
    setSelectedAgentId(agent.id);
    setLogs([
      `[${new Date().toLocaleString()}] ${t('remoteAgents.logHandshakeEndpointPrefix')}${agent.location}`,
      `[${new Date().toLocaleString()}] ${t('remoteAgents.logMtlsHandshake')}`,
      `[${new Date().toLocaleString()}] ${t('remoteAgents.logTelemetryPacket')}`,
    ]);
  };

  const handleSendCommand = (agentId: string) => {
    sendCommandMutation.mutate({ agentId, command: cmd });
  };

  const activeAgent = agents.find(a => a.id === selectedAgentId);

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            {t('remoteAgents.title')}
          </h1>
          <p className="text-gray-400 text-sm mt-1">{t('remoteAgents.subtitle')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agents Grid List */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {agents.map(agent => (
            <div
              key={agent.id}
              onClick={() => handleSelectAgent(agent)}
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
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${statusTextClass(agent.status)}`}>
                    <Circle size={8} fill={statusFillColor(agent.status)} />
                    {agent.status}
                  </span>
                </div>

                <h4 className="font-bold text-sm text-gray-200 mt-1 leading-snug">{agent.name}</h4>
                <p className="text-xxs text-gray-500 mt-0.5">{agent.platform} • {agent.location}</p>
              </div>

              <div className="pt-2 border-t border-gray-800/40 flex justify-between items-center text-xxs text-gray-500">
                <span className="truncate max-w-[150px]">CPU {agent.cpuUsage}% • MEM {agent.memUsage}%</span>
                <span>{heartbeatAgo(agent.lastHeartbeat, t)}</span>
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
                  {t('remoteAgents.remoteLabel')} {activeAgent.name}
                </h4>
                <p className="text-xxs text-gray-500 mt-0.5">{t('remoteAgents.firmwareLabel')} {activeAgent.version} • {t('remoteAgents.locationLabel')} {activeAgent.location}</p>

                {/* Dropdown & Dispatch command */}
                <div className="flex gap-2 mt-4">
                  <select
                    value={cmd}
                    onChange={e => setCmd(e.target.value)}
                    className="flex-1 bg-gray-950 border border-gray-800 rounded-lg px-2 py-1.5 text-xs text-gray-300 focus:outline-none"
                  >
                    <option value="restart">{t('remoteAgents.cmdRestart')}</option>
                    <option value="update">{t('remoteAgents.cmdUpdate')}</option>
                    <option value="collect">{t('remoteAgents.cmdSync')}</option>
                    <option value="stop">{t('remoteAgents.cmdStop')}</option>
                  </select>
                  <button
                    onClick={() => handleSendCommand(activeAgent.id)}
                    disabled={sendCommandMutation.isPending}
                    className="btn-primary p-2 rounded-lg text-white disabled:opacity-50"
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
              <p className="text-xs">{t('remoteAgents.emptyState')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
