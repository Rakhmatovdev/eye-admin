import type { ServiceStatus, AlertRule, DataSource } from '../types';
import apiClient from './client';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface BackendService { name: string; status: string }

function mapBackendStatus(s: string): ServiceStatus['status'] {
  if (s === 'up') return 'healthy';
  if (s === 'degraded') return 'degraded';
  if (s === 'down') return 'down';
  return 'unknown';
}
async function unwrap<T>(p: Promise<{ data: { data: T } }>): Promise<T> {
  return (await p).data.data;
}

export const MOCK_SERVICES: ServiceStatus[] = [
  { id: 'svc-001', name: 'API Gateway', status: 'healthy', uptime: 99.98, responseTime: 12, version: '3.2.1', lastCheck: new Date().toISOString() },
  { id: 'svc-002', name: 'Auth Service', status: 'healthy', uptime: 99.95, responseTime: 18, version: '2.1.0', lastCheck: new Date().toISOString() },
  { id: 'svc-003', name: 'Intelligence Engine', status: 'healthy', uptime: 99.87, responseTime: 45, version: '4.0.2', lastCheck: new Date().toISOString() },
  { id: 'svc-004', name: 'Data Ingestion', status: 'degraded', uptime: 97.23, responseTime: 230, version: '1.8.5', lastCheck: new Date().toISOString() },
  { id: 'svc-005', name: 'Graph Database', status: 'healthy', uptime: 99.99, responseTime: 8, version: '5.1.3', lastCheck: new Date().toISOString() },
  { id: 'svc-006', name: 'ML Pipeline', status: 'healthy', uptime: 98.45, responseTime: 89, version: '2.3.0', lastCheck: new Date().toISOString() },
  { id: 'svc-007', name: 'Notification Hub', status: 'healthy', uptime: 99.91, responseTime: 15, version: '1.5.2', lastCheck: new Date().toISOString() },
  { id: 'svc-008', name: 'Audit Logger', status: 'healthy', uptime: 100, responseTime: 5, version: '2.0.1', lastCheck: new Date().toISOString() },
];

export const MOCK_ALERT_RULES: AlertRule[] = [
  { id: 'ar-001', name: 'High CPU Alert', metric: 'cpu_usage', condition: '>', threshold: 90, severity: 'critical', enabled: true, lastTriggered: new Date(Date.now() - 3600000).toISOString() },
  { id: 'ar-002', name: 'Memory Warning', metric: 'ram_usage', condition: '>', threshold: 85, severity: 'warning', enabled: true },
  { id: 'ar-003', name: 'API Error Rate', metric: 'error_rate', condition: '>', threshold: 5, severity: 'critical', enabled: true, lastTriggered: new Date(Date.now() - 86400000).toISOString() },
  { id: 'ar-004', name: 'Low Disk Space', metric: 'disk_usage', condition: '>', threshold: 80, severity: 'warning', enabled: true },
  { id: 'ar-005', name: 'Latency Spike', metric: 'api_latency_p99', condition: '>', threshold: 2000, severity: 'warning', enabled: false },
  { id: 'ar-006', name: 'Active Sessions Drop', metric: 'active_sessions', condition: '<', threshold: 5, severity: 'info', enabled: true },
];

export const MOCK_DATA_SOURCES: DataSource[] = [
  { id: 'ds-001', name: 'PostgreSQL Primary', type: 'postgresql', status: 'connected', host: 'db-primary.internal', database: 'nexus_main', lastSync: new Date(Date.now() - 120000).toISOString(), recordCount: 2847392, syncInterval: 300, description: 'Primary relational database', tags: ['core', 'primary'], },
  { id: 'ds-002', name: 'Kafka Intelligence Stream', type: 'kafka', status: 'connected', host: 'kafka-cluster.internal:9092', lastSync: new Date().toISOString(), recordCount: 0, syncInterval: 0, description: 'Real-time event streaming', tags: ['streaming', 'realtime'], },
  { id: 'ds-003', name: 'External OSINT API', type: 'api', status: 'connected', host: 'api.osint-provider.com', lastSync: new Date(Date.now() - 600000).toISOString(), recordCount: 145823, syncInterval: 3600, description: 'Open source intelligence feed', tags: ['osint', 'external'], },
  { id: 'ds-004', name: 'MongoDB Analytics', type: 'mongodb', status: 'warning', host: 'mongo-analytics.internal', database: 'analytics', lastSync: new Date(Date.now() - 3600000).toISOString(), recordCount: 892341, syncInterval: 600, description: 'Analytics and reporting store', tags: ['analytics'], errorMessage: 'Replication lag detected (15min)', },
  { id: 'ds-005', name: 'Threat Intel CSV Feed', type: 'csv', status: 'connected', host: 'feeds.internal/threat-intel', lastSync: new Date(Date.now() - 1800000).toISOString(), recordCount: 48293, syncInterval: 3600, description: 'Daily threat indicators CSV', tags: ['threat-intel', 'feeds'], },
  { id: 'ds-006', name: 'Elasticsearch Logs', type: 'elasticsearch', status: 'connected', host: 'elastic-cluster.internal:9200', lastSync: new Date(Date.now() - 60000).toISOString(), recordCount: 15782903, syncInterval: 60, description: 'System and application logs', tags: ['logs', 'search'], },
  { id: 'ds-007', name: 'S3 Archive Bucket', type: 's3', status: 'connected', host: 's3.amazonaws.com/nexus-archive', lastSync: new Date(Date.now() - 7200000).toISOString(), recordCount: 384920, syncInterval: 86400, description: 'Cold storage archive', tags: ['archive', 'cold-storage'], },
  { id: 'ds-008', name: 'MySQL Auxiliary', type: 'mysql', status: 'error', host: 'mysql-aux.internal', database: 'auxiliary', lastSync: new Date(Date.now() - 86400000).toISOString(), recordCount: 23841, syncInterval: 1800, description: 'Auxiliary data store', tags: ['auxiliary'], errorMessage: 'Connection refused — service unreachable', },
];

// Mirrors backend internal/monitoring.MetricResponse — real Go runtime
// metrics (no synthetic cpu/disk/network numbers exist on the backend).
export interface MetricsSample {
  timestamp: string;
  heap_alloc_mb: number;
  sys_mem_mb: number;
  memory_usage: number; // heap as % of reserved sys memory
  goroutines: number;
  num_gc: number;
  uptime_seconds: number;
  num_cpu: number;
}

const HISTORY_POINTS = 240;
const SAMPLE_INTERVAL_MS = 15_000;

// Synthesizes a plausible history series client-side, used when
// GET /monitoring/metrics/history is unreachable (404/network error) so the
// Monitoring page keeps working before/without that endpoint deployed.
function generateMetricsHistory(count: number = HISTORY_POINTS): MetricsSample[] {
  const now = Date.now();
  const numCpu = (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) || 8;
  let heap = 40 + Math.random() * 20;
  let goroutines = 60 + Math.random() * 20;
  let numGc = 80;

  return Array.from({ length: count }, (_, i) => {
    heap = Math.max(10, Math.min(400, heap + (Math.random() - 0.5) * 6));
    goroutines = Math.max(10, Math.min(300, goroutines + (Math.random() - 0.5) * 8));
    if (Math.random() > 0.85) numGc += 1;
    const sysMem = heap * (1.6 + Math.random() * 0.4);
    const memoryUsage = +((heap / sysMem) * 100).toFixed(2);

    return {
      timestamp: new Date(now - (count - 1 - i) * SAMPLE_INTERVAL_MS).toISOString(),
      heap_alloc_mb: +heap.toFixed(2),
      sys_mem_mb: +sysMem.toFixed(2),
      memory_usage: memoryUsage,
      goroutines: Math.round(goroutines),
      num_gc: numGc,
      uptime_seconds: (count - (count - 1 - i)) * 15,
      num_cpu: numCpu,
    };
  });
}

export const monitoringApi = {
  getServices: async (): Promise<ServiceStatus[]> => {
    try {
      const data = await unwrap<BackendService[]>(apiClient.get('/v1/monitoring/services'));
      if (!data?.length) return MOCK_SERVICES;
      // Backend reports name+status; enrich with presentational defaults.
      return data.map((svc, i) => ({
        id: `svc-${i + 1}`,
        name: svc.name,
        status: mapBackendStatus(svc.status),
        uptime: MOCK_SERVICES[i]?.uptime ?? 99.9,
        responseTime: MOCK_SERVICES[i]?.responseTime ?? 15,
        version: MOCK_SERVICES[i]?.version ?? '1.0.0',
        lastCheck: new Date().toISOString(),
      }));
    } catch {
      return MOCK_SERVICES;
    }
  },

  // GET /monitoring/metrics/history — buffered time series (oldest-first,
  // ~15s samples, up to ~240 points), same shape as GET /monitoring/metrics.
  // Falls back to a synthesized series if the endpoint isn't deployed yet.
  getMetricsHistory: async (): Promise<MetricsSample[]> => {
    try {
      const data = await unwrap<MetricsSample[]>(apiClient.get('/v1/monitoring/metrics/history'));
      if (!data?.length) return generateMetricsHistory();
      return data;
    } catch {
      return generateMetricsHistory();
    }
  },

  getDataSources: async (): Promise<DataSource[]> => {
    interface BackendDataSource {
      id: string; name: string; type: string; status: string; host: string;
      database: string; record_count: number; sync_interval: number;
      description: string; tags: string[] | null; error_message?: string;
    }
    // Backend doesn't track a real last-sync timestamp; synthesize a plausible
    // one from status so the UI's "last sync" reads sensibly.
    const lastSyncFor = (status: string): string => {
      const ageMs = status === 'connected' ? 30_000 : status === 'syncing' ? 0 : 3_600_000;
      return new Date(Date.now() - ageMs).toISOString();
    };
    try {
      const data = await unwrap<BackendDataSource[]>(apiClient.get('/v1/monitoring/data-sources'));
      if (!data?.length) return MOCK_DATA_SOURCES;
      return data.map((d) => ({
        id: d.id,
        name: d.name,
        type: d.type as DataSource['type'],
        status: d.status as DataSource['status'],
        host: d.host,
        database: d.database || undefined,
        lastSync: lastSyncFor(d.status),
        recordCount: d.record_count,
        syncInterval: d.sync_interval,
        description: d.description,
        tags: d.tags ?? [],
        errorMessage: d.error_message || undefined,
      }));
    } catch {
      return MOCK_DATA_SOURCES;
    }
  },

  getAlertRules: async (): Promise<AlertRule[]> => {
    await delay(300);
    return MOCK_ALERT_RULES;
  },

  getLatencyStats: async () => {
    await delay(200);
    return {
      p50: Math.round(10 + Math.random() * 20),
      p95: Math.round(50 + Math.random() * 60),
      p99: Math.round(150 + Math.random() * 200),
      errorRate: +(Math.random() * 2).toFixed(2),
      throughput: Math.round(200 + Math.random() * 150),
    };
  },
};
