import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Database, Plus, RefreshCw, CheckCircle, AlertCircle, XCircle, Play } from 'lucide-react';
import { monitoringApi } from '../api/monitoring';
import type { DataSource } from '../types';
import { useT } from '../hooks/useT';
import type { TKey } from '../lib/i18n';

function formatRecords(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
function timeAgo(iso: string, t: (key: TKey) => string): string {
  const s = Math.floor((Date.now() - +new Date(iso)) / 1000);
  if (s < 5) return t('dataSources.activeNow');
  if (s < 60) return `${s}${t('time.secondsAgo')}`;
  if (s < 3600) return `${Math.floor(s / 60)}${t('time.minutesAgo')}`;
  if (s < 86400) return `${Math.floor(s / 3600)}${t('time.hoursAgo')}`;
  return `${Math.floor(s / 86400)}${t('time.daysAgo')}`;
}

export const DataSources: React.FC = () => {
  const t = useT();
  const qc = useQueryClient();
  const { data: sources = [] } = useQuery({ queryKey: ['data-sources'], queryFn: monitoringApi.getDataSources });
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const handleManualSync = (id: string) => {
    setSyncingId(id);
    // Simulated re-sync: refetch the live list, then clear the spinner.
    setTimeout(() => {
      qc.invalidateQueries({ queryKey: ['data-sources'] });
      setSyncingId(null);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">{t('dataSources.title')}</h1>
          <p className="text-gray-400 text-sm mt-1">{t('dataSources.subtitle')}</p>
        </div>
        <button className="btn-primary px-4 py-2.5 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2">
          <Plus size={16} />
          <span>{t('dataSources.connectSource')}</span>
        </button>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {sources.map((source: DataSource) => (
          <div key={source.id} className="glass p-6 rounded-2xl border border-gray-800 space-y-4 relative overflow-hidden card-hover">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600/10 border border-blue-500/20 rounded-xl flex items-center justify-center text-blue-400">
                  <Database size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-base text-white">{source.name}</h4>
                  <p className="text-xxs text-gray-500 uppercase font-semibold">{t('dataSources.typeLabel')} {source.type}</p>
                </div>
              </div>

              {/* Status Badge */}
              <span className={`px-2.5 py-0.5 rounded-full text-xxs font-bold flex items-center gap-1.5 ${
                source.status === 'connected' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                source.status === 'syncing' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                source.status === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                source.status === 'disconnected' ? 'bg-gray-500/10 text-gray-400 border border-gray-500/20' :
                'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}>
                {source.status === 'connected' && <CheckCircle size={10} />}
                {source.status === 'syncing' && <RefreshCw size={10} className="animate-spin" />}
                {source.status === 'error' && <XCircle size={10} />}
                {(source.status === 'warning' || source.status === 'disconnected') && <AlertCircle size={10} />}
                {source.status}
              </span>
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-gray-950/40 p-4 border border-gray-800/40 rounded-xl">
              <div>
                <p className="text-gray-500 font-semibold uppercase tracking-wider text-xxs">{t('dataSources.endpointHost')}</p>
                <p className="text-gray-300 font-medium truncate mt-0.5">{source.host}</p>
              </div>
              <div>
                <p className="text-gray-500 font-semibold uppercase tracking-wider text-xxs">{t('dataSources.resourceTarget')}</p>
                <p className="text-gray-300 font-medium truncate mt-0.5">{source.database || '—'}</p>
              </div>
              <div>
                <p className="text-gray-500 font-semibold uppercase tracking-wider text-xxs">{t('dataSources.totalRecords')}</p>
                <p className="text-gray-300 font-medium mt-0.5">{formatRecords(source.recordCount)}</p>
              </div>
              <div>
                <p className="text-gray-500 font-semibold uppercase tracking-wider text-xxs">{t('dataSources.lastSynced')}</p>
                <p className="text-gray-300 font-medium mt-0.5">{timeAgo(source.lastSync, t)}</p>
              </div>
            </div>

            {source.errorMessage && (
              <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl text-xxs text-red-400 font-medium">
                {t('dataSources.warningLabel')} {source.errorMessage}
              </div>
            )}

            {/* Tags */}
            {source.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {source.tags.map((t) => (
                  <span key={t} className="px-2 py-0.5 rounded-md bg-gray-800/60 text-gray-400 text-xxs font-medium">{t}</span>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                disabled={syncingId === source.id}
                onClick={() => handleManualSync(source.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-800 hover:border-gray-700 rounded-lg text-xs font-semibold text-gray-400 hover:text-gray-200 transition-all disabled:opacity-50"
              >
                <RefreshCw size={12} className={syncingId === source.id ? 'animate-spin' : ''} />
                <span>{syncingId === source.id ? t('dataSources.syncing') : t('dataSources.syncNow')}</span>
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/10 border border-blue-500/20 hover:bg-blue-600/20 text-blue-400 rounded-lg text-xs font-semibold transition-all">
                <Play size={12} />
                <span>{t('dataSources.inspectPipeline')}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
