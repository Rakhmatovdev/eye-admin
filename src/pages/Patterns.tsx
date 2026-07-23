import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Brain, RefreshCw, MapPin, Network, ShieldAlert, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { patternsApi, type Pattern, type PatternType } from '../api/patterns';
import { useT } from '../hooks/useT';

const TYPE_ICON: Record<PatternType, LucideIcon> = {
  co_location: MapPin,
  hub_entity: Network,
  threat_correlation: ShieldAlert,
  burst_activity: Zap,
};

const TYPE_COLOR: Record<PatternType, string> = {
  co_location: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  hub_entity: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  threat_correlation: 'bg-red-500/10 text-red-500 border-red-500/20',
  burst_activity: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

function scoreColor(score: number): string {
  if (score >= 75) return 'bg-red-500';
  if (score >= 50) return 'bg-amber-500';
  return 'bg-blue-500';
}

export const Patterns: React.FC = () => {
  const t = useT();
  const qc = useQueryClient();
  const { data: patterns = [], isFetching } = useQuery({ queryKey: ['patterns'], queryFn: patternsApi.list });

  const typeLabel: Record<PatternType, string> = {
    co_location: t('patterns.type.coLocation'),
    hub_entity: t('patterns.type.hubEntity'),
    threat_correlation: t('patterns.type.threatCorrelation'),
    burst_activity: t('patterns.type.burstActivity'),
  };

  const refresh = () => qc.invalidateQueries({ queryKey: ['patterns'] });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Brain size={22} className="text-violet-400" /> {t('patterns.title')}
          </h1>
          <p className="text-gray-400 text-sm mt-1">{t('patterns.subtitle')}</p>
        </div>
        <button onClick={refresh} disabled={isFetching} className="btn-primary px-4 py-2.5 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-60">
          <RefreshCw size={15} className={isFetching ? 'animate-spin' : ''} /> {t('patterns.refresh')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {patterns.map((p: Pattern) => {
          const Icon = TYPE_ICON[p.type] || Network;
          return (
            <div key={p.id} className="glass rounded-2xl border border-gray-800 p-5 space-y-3 card-hover">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${TYPE_COLOR[p.type]}`}>
                    <Icon size={17} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-100 text-sm">{p.title}</h3>
                    <span className={`inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-xxs font-bold uppercase border ${TYPE_COLOR[p.type]}`}>
                      {typeLabel[p.type]}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xxs text-gray-500 uppercase font-semibold">{t('patterns.scoreLabel')}</p>
                  <p className="text-lg font-extrabold text-white">{p.score}</p>
                </div>
              </div>

              <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${scoreColor(p.score)}`} style={{ width: `${Math.max(0, Math.min(100, p.score))}%` }} />
              </div>

              <p className="text-sm text-gray-400">{p.description}</p>

              {p.entity_ids.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {p.entity_ids.map((id) => (
                    <span key={id} className="px-2 py-0.5 rounded-full bg-gray-800/70 border border-gray-700 text-xxs font-mono text-gray-300">{id}</span>
                  ))}
                </div>
              )}

              {p.evidence.length > 0 && (
                <div>
                  <p className="text-xxs font-semibold text-gray-500 uppercase mb-1">{t('patterns.evidenceLabel')}</p>
                  <ul className="space-y-1">
                    {p.evidence.map((e, i) => (
                      <li key={i} className="text-xs text-gray-500 flex items-start gap-1.5">
                        <span className="text-gray-600 mt-0.5">&bull;</span> <span className="font-mono">{e}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="text-xxs text-gray-600 pt-1 border-t border-gray-800/60">{t('patterns.detectedAt')} {new Date(p.detected_at).toLocaleString()}</p>
            </div>
          );
        })}
        {!isFetching && patterns.length === 0 && (
          <div className="lg:col-span-2 glass rounded-2xl border border-gray-800 p-10 text-center text-gray-600 text-sm">
            {t('patterns.noPatterns')}
          </div>
        )}
      </div>
    </div>
  );
};
