import apiClient from './client';

// Military COP — admin CRUD over units, threat tracks and missions.

export interface Unit {
  id: string;
  callsign: string;
  name: string;
  type: string;
  domain: string;
  status: string;
  readiness: string;
  lat: number;
  lng: number;
  strength: number;
  heading: number;
  speed: number;
  updated_at?: string;
}

export interface Threat {
  id: string;
  designation: string;
  type: string;
  classification: string;
  threat_level: string;
  lat: number;
  lng: number;
  heading: number;
  speed: number;
  confidence: number;
  entity_id: string;
  last_seen?: string;
}

export interface Mission {
  id: string;
  name: string;
  status: string;
  priority: string;
  objective: string;
  area: string;
  assigned_units: string[];
  progress: number;
  starts_at?: string;
  updated_at?: string;
}

export interface MilitaryStats {
  units: number;
  units_ready: number;
  threats: number;
  critical_threats: number;
  active_missions: number;
}

async function unwrap<T>(p: Promise<{ data: { data: T } }>): Promise<T> {
  return (await p).data.data;
}

const EMPTY_STATS: MilitaryStats = { units: 0, units_ready: 0, threats: 0, critical_threats: 0, active_missions: 0 };

export const militaryApi = {
  units: async (): Promise<Unit[]> => {
    try { return (await unwrap<Unit[] | null>(apiClient.get('/v1/military/units'))) ?? []; } catch { return []; }
  },
  threats: async (): Promise<Threat[]> => {
    try { return (await unwrap<Threat[] | null>(apiClient.get('/v1/military/threats'))) ?? []; } catch { return []; }
  },
  missions: async (): Promise<Mission[]> => {
    try { return (await unwrap<Mission[] | null>(apiClient.get('/v1/military/missions'))) ?? []; } catch { return []; }
  },
  stats: async (): Promise<MilitaryStats> => {
    try { return await unwrap<MilitaryStats>(apiClient.get('/v1/military/stats')); } catch { return EMPTY_STATS; }
  },

  createUnit: (u: Omit<Unit, 'id'>): Promise<Unit> => unwrap<Unit>(apiClient.post('/v1/military/units', u)),
  updateUnit: (id: string, u: Omit<Unit, 'id'>): Promise<Unit> => unwrap<Unit>(apiClient.put(`/v1/military/units/${id}`, u)),
  removeUnit: async (id: string): Promise<void> => { await apiClient.delete(`/v1/military/units/${id}`); },

  createThreat: (t: Omit<Threat, 'id'>): Promise<Threat> => unwrap<Threat>(apiClient.post('/v1/military/threats', t)),
  updateThreat: (id: string, t: Omit<Threat, 'id'>): Promise<Threat> => unwrap<Threat>(apiClient.put(`/v1/military/threats/${id}`, t)),
  removeThreat: async (id: string): Promise<void> => { await apiClient.delete(`/v1/military/threats/${id}`); },

  createMission: (m: Omit<Mission, 'id'>): Promise<Mission> => unwrap<Mission>(apiClient.post('/v1/military/missions', m)),
  updateMission: (id: string, m: Omit<Mission, 'id'>): Promise<Mission> => unwrap<Mission>(apiClient.put(`/v1/military/missions/${id}`, m)),
  removeMission: async (id: string): Promise<void> => { await apiClient.delete(`/v1/military/missions/${id}`); },
};
