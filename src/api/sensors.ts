import apiClient from './client';

// Surveillance sensor network — admin CRUD + detections. Backend shapes are
// used directly (snake_case). Every call falls back to demo data if the API
// is unreachable, matching the rest of the admin data layer.

export interface Sensor {
  id: string;
  name: string;
  type: string;
  status: string;
  lat: number;
  lng: number;
  area: string;
  coverage_radius: number;
  resolution: string;
  classification: string;
  feed_url: string;
  last_heartbeat: string;
}

export interface Detection {
  id: string;
  sensor_id: string;
  sensor_name: string;
  entity_id: string;
  entity_name: string;
  kind: string;
  confidence: number;
  area: string;
  timestamp: string;
}

export interface SensorStats {
  total: number;
  online: number;
  degraded: number;
  offline: number;
  detections_24h: number;
  identified_hits: number;
}

export type SensorInput = Pick<
  Sensor,
  'name' | 'type' | 'status' | 'lat' | 'lng' | 'area' | 'coverage_radius' | 'resolution' | 'classification'
>;

async function unwrap<T>(p: Promise<{ data: { data: T } }>): Promise<T> {
  return (await p).data.data;
}

const MOCK_SENSORS: Sensor[] = [
  { id: 'cam-001', name: 'TAS Airport — Terminal Cam A', type: 'camera', status: 'online', lat: 41.2579, lng: 69.2812, area: 'Tashkent Intl Airport', coverage_radius: 300, resolution: '4K', classification: 'confidential', feed_url: 'sim://cam-001', last_heartbeat: new Date().toISOString() },
  { id: 'drn-001', name: 'UAV Reaper-7 (patrol)', type: 'drone', status: 'online', lat: 40.7841, lng: 72.3417, area: 'Fergana Valley', coverage_radius: 5000, resolution: 'EO/IR gimbal', classification: 'secret', feed_url: 'sim://drn-001', last_heartbeat: new Date().toISOString() },
  { id: 'sig-001', name: 'SIGINT Collector Alpha', type: 'sigint', status: 'degraded', lat: 41.2995, lng: 69.2401, area: 'Tashkent metro', coverage_radius: 15000, resolution: 'COMINT', classification: 'secret', feed_url: 'sim://sig-001', last_heartbeat: new Date().toISOString() },
];
const MOCK_STATS: SensorStats = { total: 12, online: 9, degraded: 2, offline: 1, detections_24h: 10, identified_hits: 14 };

export const sensorsApi = {
  list: async (): Promise<Sensor[]> => {
    try {
      const d = await unwrap<Sensor[] | null>(apiClient.get('/v1/sensors'));
      return d?.length ? d : MOCK_SENSORS;
    } catch {
      return MOCK_SENSORS;
    }
  },
  detections: async (): Promise<Detection[]> => {
    try {
      return (await unwrap<Detection[] | null>(apiClient.get('/v1/sensors/detections', { params: { limit: 50 } }))) ?? [];
    } catch {
      return [];
    }
  },
  stats: async (): Promise<SensorStats> => {
    try {
      return await unwrap<SensorStats>(apiClient.get('/v1/sensors/stats'));
    } catch {
      return MOCK_STATS;
    }
  },
  create: async (input: SensorInput): Promise<Sensor> =>
    unwrap<Sensor>(apiClient.post('/v1/sensors', input)),
  update: async (id: string, input: SensorInput): Promise<Sensor> =>
    unwrap<Sensor>(apiClient.put(`/v1/sensors/${id}`, input)),
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/v1/sensors/${id}`);
  },
};
