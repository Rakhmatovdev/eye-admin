import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Brain,
  RefreshCcw,
  Gauge,
  ShieldAlert,
  Share2,
  ScanFace,
  Crosshair,
  Globe2,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { securityApi } from '../api/security';
import { sensorsApi } from '../api/sensors';
import { militaryApi } from '../api/military';
import type { SecurityIncident } from '../types';
import { useT } from '../hooks/useT';
import type { TKey } from '../lib/i18n';

// ---------------------------------------------------------------------------
// AI-style correlation engine — a client-side heuristic that fuses signals
// from sensors (biometric/plate detections), military threat tracks and the
// security SOC feed into a single ranked "findings" list with a 0-100 risk
// score. No ML/backend involved: this is a deterministic scoring demo that
// mimics a Palantir-style fusion / anomaly-detection surface.
// ---------------------------------------------------------------------------

type FindingCategory = 'biometric-hit' | 'hostile-track' | 'intrusion' | 'impossible-travel' | 'correlation';
type Severity = 'critical' | 'high' | 'medium' | 'low';

interface Finding {
  id: string;
  category: FindingCategory;
  severity: Severity;
  score: number;
  title: string;
  description: string;
  action: string;
  timestamp: string;
  sourceCount: number;
}

const CATEGORY_META: Record<FindingCategory, { labelKey: TKey; icon: LucideIcon; color: string }> = {
  'biometric-hit': { labelKey: 'threatIntel.catBiometricHit', icon: ScanFace, color: '#3B82F6' },
  'hostile-track': { labelKey: 'threatIntel.catHostileTrack', icon: Crosshair, color: '#EF4444' },
  intrusion: { labelKey: 'threatIntel.catIntrusion', icon: ShieldAlert, color: '#F59E0B' },
  'impossible-travel': { labelKey: 'threatIntel.catImpossibleTravel', icon: Globe2, color: '#A855F7' },
  correlation: { labelKey: 'threatIntel.catCrossSourceCorrelation', icon: Share2, color: '#06B6D4' },
};

const SEVERITY_STYLE: Record<Severity, string> = {
  critical: 'bg-red-500/10 text-red-500 border-red-500/20',
  high: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  low: 'bg-green-500/10 text-green-500 border-green-500/20',
};

function severityFromScore(score: number): Severity {
  if (score >= 85) return 'critical';
  if (score >= 65) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

function threatLevelToSeverity(level: string): Severity {
  const l = level.toLowerCase();
  if (l === 'critical' || l === 'high' || l === 'medium' || l === 'low') return l as Severity;
  return 'medium';
}

export const ThreatIntel: React.FC = () => {
  const t = useT();
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const { data: detections = [], isFetching: fetchingDetections, refetch: refetchDetections } = useQuery({
    queryKey: ['ti-detections'],
    queryFn: sensorsApi.detections,
  });
  const { data: sensorStats, refetch: refetchSensorStats } = useQuery({
    queryKey: ['ti-sensor-stats'],
    queryFn: sensorsApi.stats,
  });
  const { data: threats = [], isFetching: fetchingThreats, refetch: refetchThreats } = useQuery({
    queryKey: ['ti-threats'],
    queryFn: militaryApi.threats,
  });
  const { data: incidents = [], isFetching: fetchingIncidents, refetch: refetchIncidents } = useQuery({
    queryKey: ['ti-incidents'],
    queryFn: securityApi.listIncidents,
  });

  const loading = fetchingDetections || fetchingThreats || fetchingIncidents;

  const refreshAll = () => {
    refetchDetections();
    refetchSensorStats();
    refetchThreats();
    refetchIncidents();
    setLastRefreshed(new Date());
  };

  const findings: Finding[] = useMemo(() => {
    const out: Finding[] = [];

    // Index threats by entity_id for cross-source correlation lookups.
    const threatsByEntity = new Map<string, (typeof threats)[number][]>();
    threats.forEach((t) => {
      if (!t.entity_id) return;
      const arr = threatsByEntity.get(t.entity_id) ?? [];
      arr.push(t);
      threatsByEntity.set(t.entity_id, arr);
    });

    // 1) High-confidence sensor detections → biometric-hit / correlation.
    detections
      .filter((d) => d.confidence >= 0.8)
      .forEach((d) => {
        const confPct = Math.round(d.confidence * 100);
        const matchedThreats = d.entity_id ? threatsByEntity.get(d.entity_id) ?? [] : [];
        const correlated = matchedThreats.length > 0;
        const sourceCount = 1 + (correlated ? matchedThreats.length : 0);

        let score = Math.round(d.confidence * 65);
        if (correlated) score += 30;
        score = Math.min(100, score);

        const category: FindingCategory = correlated ? 'correlation' : 'biometric-hit';
        const severity = severityFromScore(score);

        const entityLabel = d.entity_name || 'Unidentified subject';
        const kindLabel = (d.kind || 'detection').replace(/_/g, ' ');

        let description = `${confPct}% confidence ${kindLabel} of ${entityLabel} captured by ${d.sensor_name} (${d.area}).`;
        if (correlated) {
          const t = matchedThreats[0];
          description += ` Subject cross-referenced against active hostile track ${t.designation} (${t.threat_level} threat, ${Math.round(
            t.confidence * 100
          )}% tracking confidence) — correlated across ${sourceCount} sources.`;
        }

        out.push({
          id: `bio-${d.id}`,
          category,
          severity,
          score,
          title: correlated
            ? `High-confidence match: ${entityLabel} linked to hostile track ${matchedThreats[0].designation}`
            : `High-confidence ${kindLabel} match (${confPct}%) of ${entityLabel} at ${d.sensor_name}`,
          description,
          action: correlated
            ? 'Escalate to fusion cell immediately — confirm identity and initiate intercept/detention authorization request.'
            : 'Dispatch field verification team and cross-check subject against active watchlists.',
          timestamp: d.timestamp,
          sourceCount,
        });
      });

    // 2) Critical/high military threat tracks → hostile-track findings.
    threats
      .filter((t) => ['critical', 'high'].includes(t.threat_level?.toLowerCase()))
      .forEach((t) => {
        const levelBase: Record<string, number> = { critical: 80, high: 60 };
        const base = levelBase[t.threat_level.toLowerCase()] ?? 55;
        const score = Math.min(100, Math.round(base + t.confidence * 20));
        const severity = threatLevelToSeverity(t.threat_level);
        const hasBiometricTie = detections.some((d) => d.entity_id && d.entity_id === t.entity_id && d.confidence >= 0.8);

        out.push({
          id: `mil-${t.id}`,
          category: 'hostile-track',
          severity,
          score,
          title: `Hostile track ${t.designation} — ${t.threat_level} threat`,
          description: `${t.type || 'Unclassified'} contact, classification ${t.classification}, heading ${Math.round(
            t.heading
          )}° at ${Math.round(t.speed)} kt with ${Math.round(t.confidence * 100)}% tracking confidence.${
            hasBiometricTie ? ' Track corroborated by a recent high-confidence biometric detection of the linked entity.' : ''
          }`,
          action: severity === 'critical'
            ? 'Alert command & control — recommend intercept posture and QRF tasking.'
            : 'Maintain continuous track and notify area commander for situational awareness.',
          timestamp: t.last_seen ?? new Date().toISOString(),
          sourceCount: hasBiometricTie ? 2 : 1,
        });
      });

    // 3) Critical/high security incidents → intrusion / impossible-travel findings.
    incidents
      .filter((i) => i.severity === 'critical' || i.severity === 'high')
      .forEach((i: SecurityIncident) => {
        const sevBase: Record<string, number> = { critical: 75, high: 55 };
        const base = sevBase[i.severity] ?? 45;
        const assetBonus = Math.min(15, (i.affectedAssets?.length ?? 0) * 5);
        const score = Math.min(100, base + assetBonus);
        const category: FindingCategory = i.type === 'impossible_travel' ? 'impossible-travel' : 'intrusion';

        out.push({
          id: `sec-${i.id}`,
          category,
          severity: i.severity,
          score,
          title: i.title,
          description: `${i.description} Source: ${i.sourceIp} · Assets: ${i.affectedAssets?.join(', ') || 'n/a'}.`,
          action: category === 'impossible-travel'
            ? 'Force session termination and MFA re-challenge; flag account for manual review.'
            : 'Trigger SOC incident response playbook and isolate affected assets pending investigation.',
          timestamp: i.timestamp,
          sourceCount: 1,
        });
      });

    return out.sort((a, b) => b.score - a.score);
  }, [detections, threats, incidents]);

  const stats = useMemo(() => {
    const total = findings.length;
    const critical = findings.filter((f) => f.severity === 'critical').length;
    const avgScore = total ? Math.round(findings.reduce((sum, f) => sum + f.score, 0) / total) : 0;
    const correlations = findings.filter((f) => f.category === 'correlation').length;
    return { total, critical, avgScore, correlations };
  }, [findings]);

  const categoryDistribution = useMemo(() => {
    const counts = new Map<FindingCategory, number>();
    findings.forEach((f) => counts.set(f.category, (counts.get(f.category) ?? 0) + 1));
    return (Object.keys(CATEGORY_META) as FindingCategory[])
      .map((cat) => ({ category: cat, label: t(CATEGORY_META[cat].labelKey), count: counts.get(cat) ?? 0, color: CATEGORY_META[cat].color }))
      .filter((c) => c.count > 0);
  }, [findings, t]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Brain size={22} className="text-blue-400" />
            {t('threatIntel.title')}
            <span className="live-dot w-2 h-2 bg-blue-500 rounded-full" />
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {t('threatIntel.subtitle')}
          </p>
        </div>
        <button
          onClick={refreshAll}
          className="flex items-center gap-2 px-3.5 py-2 bg-gray-900 border border-gray-800 rounded-xl text-xs font-semibold text-gray-400 hover:text-white hover:border-gray-700 transition-all shrink-0"
        >
          <RefreshCcw size={14} className={loading ? 'animate-spin' : ''} />
          {t('threatIntel.refreshLabel')} {lastRefreshed.toLocaleTimeString()}
        </button>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { name: t('threatIntel.statTotalFindings'), value: stats.total, icon: Sparkles, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { name: t('threatIntel.statCritical'), value: stats.critical, icon: ShieldAlert, color: 'text-red-500', bg: 'bg-red-500/10' },
          { name: t('threatIntel.statAvgRiskScore'), value: stats.avgScore, icon: Gauge, color: 'text-amber-500', bg: 'bg-amber-500/10' },
          { name: t('threatIntel.statActiveCorrelations'), value: stats.correlations, icon: Share2, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
        ].map((tile) => {
          const Icon = tile.icon;
          return (
            <div key={tile.name} className="card rounded-2xl p-4 border border-gray-800">
              <div className={`w-8 h-8 rounded-lg ${tile.bg} ${tile.color} flex items-center justify-center mb-2`}>
                <Icon size={15} />
              </div>
              <h3 className="text-2xl font-extrabold text-white count-up">{tile.value}</h3>
              <p className="text-xxs text-gray-500 uppercase font-semibold mt-0.5">{tile.name}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Findings feed */}
        <div className="xl:col-span-2 glass rounded-2xl border border-gray-800 overflow-hidden">
          <div className="p-4 border-b border-gray-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp size={14} className="text-blue-400" /> {t('threatIntel.rankedFindings')}
              </h3>
              <p className="text-xxs text-gray-500 mt-0.5">{t('threatIntel.sortedHint')}</p>
            </div>
            {sensorStats && (
              <span className="text-xxs text-gray-500">
                {sensorStats.detections_24h}{t('threatIntel.detectionsLabel')} {sensorStats.identified_hits} {t('threatIntel.identifiedLabel')}
              </span>
            )}
          </div>
          <div className="divide-y divide-gray-800/60 max-h-[720px] overflow-y-auto">
            {findings.map((f) => {
              const meta = CATEGORY_META[f.category];
              const Icon = meta.icon;
              return (
                <div key={f.id} className="p-4 table-row-hover">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center border shrink-0"
                      style={{ backgroundColor: `${meta.color}1A`, borderColor: `${meta.color}33`, color: meta.color }}
                    >
                      <Icon size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border shrink-0 ${SEVERITY_STYLE[f.severity]}`}>
                          {f.severity}
                        </span>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-gray-500">{t(meta.labelKey)}</span>
                        {f.sourceCount > 1 && (
                          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                            {f.sourceCount} {t('threatIntel.sourcesSuffix')}
                          </span>
                        )}
                        <span className="text-xxs text-gray-600 ml-auto shrink-0">{new Date(f.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-200 mt-1">{f.title}</p>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{f.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden max-w-[160px]">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${f.score}%`, backgroundColor: meta.color }}
                          />
                        </div>
                        <span className="text-xs font-bold text-white">{f.score}</span>
                      </div>
                      <p className="text-xxs text-blue-400 mt-2 flex items-center gap-1.5">
                        <Sparkles size={11} /> {f.action}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            {!loading && findings.length === 0 && (
              <p className="text-xs text-gray-500 text-center py-10">{t('threatIntel.noFindings')}</p>
            )}
            {loading && findings.length === 0 && (
              <div className="p-4 space-y-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-16 skeleton rounded-xl" />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Risk distribution */}
        <div className="glass rounded-2xl border border-gray-800 p-5">
          <div className="mb-3">
            <h3 className="text-sm font-bold text-white">{t('threatIntel.riskDistributionTitle')}</h3>
            <p className="text-xxs text-gray-500 mt-0.5">{t('threatIntel.riskDistributionHint')}</p>
          </div>
          {categoryDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={Math.max(180, categoryDistribution.length * 46)}>
              <BarChart data={categoryDistribution} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="label"
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={120}
                />
                <Tooltip
                  contentStyle={{ background: '#0F172A', border: '1px solid #1F2937', borderRadius: 8, fontSize: 12 }}
                  cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={16}>
                  {categoryDistribution.map((c) => (
                    <Cell key={c.category} fill={c.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-gray-500 text-center py-10">{t('threatIntel.noFindingsYet')}</p>
          )}

          <div className="mt-4 pt-4 border-t border-gray-800 space-y-2">
            {categoryDistribution.map((c) => (
              <div key={c.category} className="flex items-center justify-between text-xxs">
                <span className="flex items-center gap-2 text-gray-400">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                  {c.label}
                </span>
                <span className="font-bold text-gray-300">{c.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
