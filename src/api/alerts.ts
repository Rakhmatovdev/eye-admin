import apiClient from './client';

// Alert Center — alerts feed, alert rules (admin-only CRUD) and the entity
// watchlist. Backend shapes are used directly (snake_case), matching the
// pattern in sensors.ts / audit.ts. Every read falls back to demo data if the
// API is unreachable so the page is still demonstrable offline.

export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface Alert {
  id: string;
  rule_id: string;
  rule_name: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  entity_id?: string;
  threat_id?: string;
  detection_id?: string;
  acknowledged: boolean;
  ack_by?: string;
  ack_at?: string;
  created_at: string;
}

export interface AlertsPage {
  items: Alert[];
  page: number;
  limit: number;
  total: number;
}

export interface AlertsListParams {
  acknowledged?: boolean;
  severity?: AlertSeverity | '';
  page?: number;
  limit?: number;
}

export type AlertRuleType = 'watchlist_detection' | 'threat_class' | 'risk_threshold';

export interface AlertRuleParams {
  classes?: string[];
  min_score?: number;
}

export interface AlertRule {
  id: string;
  name: string;
  type: AlertRuleType;
  enabled: boolean;
  severity: AlertSeverity;
  params: AlertRuleParams;
  created_at: string;
}

export type AlertRuleInput = Pick<AlertRule, 'name' | 'type' | 'enabled' | 'severity' | 'params'>;

export interface WatchlistEntry {
  id: string;
  entity_id: string;
  entity_label: string;
  note: string;
  created_by: string;
  created_at: string;
}

export interface WatchlistInput {
  entity_id: string;
  note?: string;
}

async function unwrap<T>(p: Promise<{ data: { data: T } }>): Promise<T> {
  return (await p).data.data;
}

const MOCK_ALERTS: Alert[] = [
  {
    id: 'mock-alert-1', rule_id: 'rule-seed-watchlist', rule_name: 'Watchlist Sensor Hit',
    severity: 'high', title: 'Watchlisted entity detected',
    message: 'A watchlisted entity was picked up by a sensor.',
    entity_id: 'ent-003', detection_id: 'det-008',
    acknowledged: true, ack_by: 'admin@platform.io', ack_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: 'mock-alert-2', rule_id: 'rule-seed-risk', rule_name: 'High Risk Entity (>=80)',
    severity: 'medium', title: 'High risk entity',
    message: 'An entity crossed the configured risk threshold.',
    entity_id: 'ent-018',
    acknowledged: false,
    created_at: new Date().toISOString(),
  },
];

const MOCK_RULES: AlertRule[] = [
  { id: 'rule-seed-watchlist', name: 'Watchlist Sensor Hit', type: 'watchlist_detection', enabled: true, severity: 'high', params: {}, created_at: new Date().toISOString() },
  { id: 'rule-seed-threat', name: 'Hostile Threat Classification', type: 'threat_class', enabled: true, severity: 'critical', params: { classes: ['hostile'] }, created_at: new Date().toISOString() },
  { id: 'rule-seed-risk', name: 'High Risk Entity (>=80)', type: 'risk_threshold', enabled: true, severity: 'medium', params: { min_score: 80 }, created_at: new Date().toISOString() },
];

const MOCK_WATCHLIST: WatchlistEntry[] = [
  { id: 'mock-wl-1', entity_id: 'ent-009', entity_label: 'Timur Umarov', note: 'High-priority target.', created_by: 'admin@platform.io', created_at: new Date().toISOString() },
];

export const alertsApi = {
  list: async (params: AlertsListParams = {}): Promise<AlertsPage> => {
    const query: Record<string, string | number> = {
      page: params.page ?? 1,
      limit: params.limit ?? 20,
    };
    if (params.severity) query.severity = params.severity;
    if (params.acknowledged !== undefined) query.acknowledged = String(params.acknowledged);
    try {
      const res = await apiClient.get('/v1/alerts', { params: query });
      const body = res.data as { data: Alert[]; meta?: { page: number; limit: number; total: number } };
      const items = body.data ?? [];
      const meta = body.meta ?? { page: query.page as number, limit: query.limit as number, total: items.length };
      return { items, page: meta.page, limit: meta.limit, total: meta.total };
    } catch {
      return { items: MOCK_ALERTS, page: 1, limit: params.limit ?? 20, total: MOCK_ALERTS.length };
    }
  },

  ack: async (id: string): Promise<Alert> => unwrap<Alert>(apiClient.patch(`/v1/alerts/${id}/ack`)),

  rules: {
    list: async (): Promise<AlertRule[]> => {
      try {
        const data = await unwrap<AlertRule[] | null>(apiClient.get('/v1/alerts/rules'));
        return data?.length ? data : MOCK_RULES;
      } catch {
        return MOCK_RULES;
      }
    },
    create: async (input: AlertRuleInput): Promise<AlertRule> =>
      unwrap<AlertRule>(apiClient.post('/v1/alerts/rules', input)),
    update: async (id: string, input: AlertRuleInput): Promise<AlertRule> =>
      unwrap<AlertRule>(apiClient.put(`/v1/alerts/rules/${id}`, input)),
    remove: async (id: string): Promise<void> => {
      await apiClient.delete(`/v1/alerts/rules/${id}`);
    },
  },
};

export const watchlistApi = {
  list: async (): Promise<WatchlistEntry[]> => {
    try {
      const data = await unwrap<WatchlistEntry[] | null>(apiClient.get('/v1/watchlist'));
      return data?.length ? data : MOCK_WATCHLIST;
    } catch {
      return MOCK_WATCHLIST;
    }
  },
  add: async (input: WatchlistInput): Promise<WatchlistEntry> =>
    unwrap<WatchlistEntry>(apiClient.post('/v1/watchlist', input)),
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/v1/watchlist/${id}`);
  },
};
