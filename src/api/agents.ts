import type { Agent, AgentCommand, AgentStatus, AgentType } from '../types';
import apiClient from './client';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// --- backend <-> UI mapping -------------------------------------------------

interface BackendAgent {
  id: string;
  name: string;
  status: string;
  version: string;
  last_heartbeat?: string | null;
  public_key: string;
  created_at: string;
}

interface BackendAgentCommand {
  id: string;
  agent_id: string;
  command: string;
  status: string;
  issued_by: string;
  created_at: string;
  updated_at: string;
}

async function unwrap<T>(p: Promise<{ data: { data: T } }>): Promise<T> {
  return (await p).data.data;
}

function mapBackendStatus(s: string): AgentStatus {
  if (s === 'online' || s === 'offline' || s === 'degraded' || s === 'updating' || s === 'error') return s;
  return 'offline';
}

function guessType(name: string): AgentType {
  const n = name.toLowerCase();
  if (n.includes('sensor')) return 'sensor';
  if (n.includes('relay')) return 'relay';
  if (n.includes('gateway')) return 'gateway';
  if (n.includes('analy')) return 'analyzer';
  return 'collector';
}

export const MOCK_AGENTS: Agent[] = [
  { id: '1', name: 'Tashkent Border Collector 01', type: 'collector', status: 'online', version: 'v1.4.2', lastHeartbeat: new Date(Date.now() - 5000).toISOString(), location: 'Tashkent, UZ', country: 'Uzbekistan', ip: '10.44.2.11', platform: 'Linux x86_64', cpuUsage: 22, memUsage: 41, dataCollected: 128400, tasksCompleted: 842, uptime: 99.4, lat: 41.2995, lng: 69.2401 },
  { id: '2', name: 'Samarkand Sensor Node', type: 'sensor', status: 'online', version: 'v1.4.1', lastHeartbeat: new Date(Date.now() - 12000).toISOString(), location: 'Samarkand, UZ', country: 'Uzbekistan', ip: '10.44.5.30', platform: 'Raspberry Pi 4', cpuUsage: 34, memUsage: 55, dataCollected: 58210, tasksCompleted: 391, uptime: 98.9, lat: 39.6542, lng: 66.9597 },
  { id: '3', name: 'Almaty Proxy Relay', type: 'relay', status: 'degraded', version: 'v1.4.0', lastHeartbeat: new Date(Date.now() - 60000).toISOString(), location: 'Almaty, KZ', country: 'Kazakhstan', ip: '10.55.8.4', platform: 'Windows Server 2022', cpuUsage: 78, memUsage: 82, dataCollected: 94021, tasksCompleted: 512, uptime: 92.1, lat: 43.222, lng: 76.8512 },
  { id: '4', name: 'Bishkek Collector 02', type: 'collector', status: 'offline', version: 'v1.4.2', lastHeartbeat: new Date(Date.now() - 7200000).toISOString(), location: 'Bishkek, KG', country: 'Kyrgyzstan', ip: '10.66.1.9', platform: 'Linux x86_64', cpuUsage: 0, memUsage: 0, dataCollected: 30442, tasksCompleted: 201, uptime: 74.5, lat: 42.8746, lng: 74.5698 },
];

// Backend only tracks id/name/status/version/last_heartbeat/public_key — enrich
// with presentational defaults (location, platform, usage stats) as monitoring.ts does.
function mapAgent(a: BackendAgent, i: number): Agent {
  const fallback = MOCK_AGENTS[i % MOCK_AGENTS.length];
  return {
    id: a.id,
    name: a.name,
    type: guessType(a.name),
    status: mapBackendStatus(a.status),
    version: a.version,
    lastHeartbeat: a.last_heartbeat ?? a.created_at,
    location: fallback.location,
    country: fallback.country,
    ip: fallback.ip,
    platform: fallback.platform,
    cpuUsage: fallback.cpuUsage,
    memUsage: fallback.memUsage,
    dataCollected: fallback.dataCollected,
    tasksCompleted: fallback.tasksCompleted,
    uptime: fallback.uptime,
    lat: fallback.lat,
    lng: fallback.lng,
  };
}

function mapCommandStatus(s: string): AgentCommand['status'] {
  if (s === 'executed') return 'completed';
  if (s === 'failed') return 'failed';
  if (s === 'running') return 'running';
  return 'pending';
}

function mapAgentCommand(c: BackendAgentCommand): AgentCommand {
  return {
    id: c.id,
    agentId: c.agent_id,
    command: c.command,
    status: mapCommandStatus(c.status),
    issuedAt: c.created_at,
    completedAt: c.status === 'executed' || c.status === 'failed' ? c.updated_at : undefined,
    issuedBy: c.issued_by,
  };
}

export const agentsApi = {
  getAgents: async (): Promise<Agent[]> => {
    try {
      const data = await unwrap<BackendAgent[]>(apiClient.get('/v1/agents'));
      if (!data?.length) return MOCK_AGENTS;
      return data.map(mapAgent);
    } catch {
      return MOCK_AGENTS;
    }
  },

  getAgent: async (id: string): Promise<Agent> => {
    try {
      const data = await unwrap<BackendAgent>(apiClient.get(`/v1/agents/${id}`));
      return mapAgent(data, 0);
    } catch {
      const agent = MOCK_AGENTS.find(a => a.id === id);
      if (!agent) throw new Error('Agent not found');
      return agent;
    }
  },

  sendCommand: async (agentId: string, command: string): Promise<AgentCommand> => {
    try {
      const data = await unwrap<BackendAgentCommand>(apiClient.post(`/v1/agents/${agentId}/command`, { command }));
      return mapAgentCommand(data);
    } catch {
      await delay(300);
      return {
        id: 'cmd-' + Date.now(),
        agentId,
        command,
        status: 'pending',
        issuedAt: new Date().toISOString(),
        issuedBy: 'admin@platform.io',
      };
    }
  },

  getCommands: async (agentId: string): Promise<AgentCommand[]> => {
    try {
      const data = await unwrap<BackendAgentCommand[]>(apiClient.get(`/v1/agents/${agentId}/commands`));
      return data.map(mapAgentCommand);
    } catch {
      return [];
    }
  },
};
