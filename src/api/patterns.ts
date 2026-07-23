import apiClient from './client';

// AI-detected relationship/behavior patterns — computed on request by the
// backend (no caching contract), so `list()` is also used as the "refresh"
// action. Falls back to demo data if the API is unreachable.

export type PatternType = 'co_location' | 'hub_entity' | 'threat_correlation' | 'burst_activity';

export interface Pattern {
  id: string;
  type: PatternType;
  score: number;
  title: string;
  description: string;
  entity_ids: string[];
  evidence: string[];
  detected_at: string;
}

async function unwrap<T>(p: Promise<{ data: { data: T } }>): Promise<T> {
  return (await p).data.data;
}

const MOCK_PATTERNS: Pattern[] = [
  {
    id: 'mock-pat-1', type: 'hub_entity', score: 64,
    title: 'Hub entity: Alisher Karimov',
    description: "Alisher Karimov has 3 relationships, at least 2x the graph's mean degree.",
    entity_ids: ['ent-001'], evidence: ['degree=3 mean_degree=1.33'],
    detected_at: new Date().toISOString(),
  },
  {
    id: 'mock-pat-2', type: 'threat_correlation', score: 85,
    title: 'Threat linked to watchlisted entity',
    description: 'A hostile track is linked to a watchlisted entity.',
    entity_ids: ['ent-009'], evidence: ['threat_id=t-001 classification=hostile'],
    detected_at: new Date().toISOString(),
  },
];

export const patternsApi = {
  list: async (): Promise<Pattern[]> => {
    try {
      const data = await unwrap<{ patterns: Pattern[] } | null>(apiClient.get('/v1/analytics/patterns'));
      return data?.patterns?.length ? data.patterns : MOCK_PATTERNS;
    } catch {
      return MOCK_PATTERNS;
    }
  },
};
