import React, { useState } from 'react';
import { Database, Plus, RefreshCw, CheckCircle, AlertCircle, Play } from 'lucide-react';

export const DataSources: React.FC = () => {
  const [sources, setSources] = useState([
    { id: '1', name: 'Postgres Core Ingest', type: 'postgresql', status: 'connected', host: '10.0.4.15:5432', database: 'prod_intel_db', lastSync: '3m ago', records: '1.2M' },
    { id: '2', name: 'Border Crossing Kafka Feed', type: 'kafka', status: 'syncing', host: 'kafka-broker-01:9092', database: 'customs.telemetry', lastSync: 'Active Now', records: '48.2M' },
    { id: '3', name: 'Static Registry S3 Bucket', type: 's3', status: 'connected', host: 's3.us-east-1.amazonaws.com', database: 'static-persons-vault', lastSync: '1d ago', records: '240K' },
    { id: '4', name: 'Customs CSV Logs Ingestion', type: 'csv', status: 'warning', host: 'Manual File Import', database: 'border_logs_2026.csv', lastSync: '3d ago', records: '8.4K', error: 'Incomplete columns parsed' },
  ]);

  const [syncingId, setSyncingId] = useState<string | null>(null);

  const handleManualSync = (id: string) => {
    setSyncingId(id);
    setTimeout(() => {
      setSyncingId(null);
      alert('Data Synchronization Completed Successfully!');
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Data Integrations</h1>
          <p className="text-gray-400 text-sm mt-1">Connect database feeds, file repositories, and streaming pipelines to the core ontology.</p>
        </div>
        <button className="btn-primary px-4 py-2.5 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2">
          <Plus size={16} />
          <span>Connect Source</span>
        </button>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {sources.map(source => (
          <div key={source.id} className="glass p-6 rounded-2xl border border-gray-800 space-y-4 relative overflow-hidden card-hover">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600/10 border border-blue-500/20 rounded-xl flex items-center justify-center text-blue-400">
                  <Database size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-base text-white">{source.name}</h4>
                  <p className="text-xxs text-gray-500 uppercase font-semibold">Type: {source.type}</p>
                </div>
              </div>

              {/* Status Badge */}
              <span className={`px-2.5 py-0.5 rounded-full text-xxs font-bold flex items-center gap-1.5 ${
                source.status === 'connected' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                source.status === 'syncing' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}>
                {source.status === 'connected' && <CheckCircle size={10} />}
                {source.status === 'syncing' && <RefreshCw size={10} className="animate-spin" />}
                {source.status === 'warning' && <AlertCircle size={10} />}
                {source.status}
              </span>
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-gray-950/40 p-4 border border-gray-800/40 rounded-xl">
              <div>
                <p className="text-gray-500 font-semibold uppercase tracking-wider text-xxs">Endpoint / Host</p>
                <p className="text-gray-300 font-medium truncate mt-0.5">{source.host}</p>
              </div>
              <div>
                <p className="text-gray-500 font-semibold uppercase tracking-wider text-xxs">Resource Target</p>
                <p className="text-gray-300 font-medium truncate mt-0.5">{source.database}</p>
              </div>
              <div>
                <p className="text-gray-500 font-semibold uppercase tracking-wider text-xxs">Total Records</p>
                <p className="text-gray-300 font-medium mt-0.5">{source.records}</p>
              </div>
              <div>
                <p className="text-gray-500 font-semibold uppercase tracking-wider text-xxs">Last Synced</p>
                <p className="text-gray-300 font-medium mt-0.5">{source.lastSync}</p>
              </div>
            </div>

            {source.error && (
              <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl text-xxs text-red-400 font-medium">
                Warning: {source.error}
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
                <span>{syncingId === source.id ? 'Syncing...' : 'Sync Now'}</span>
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/10 border border-blue-500/20 hover:bg-blue-600/20 text-blue-400 rounded-lg text-xs font-semibold transition-all">
                <Play size={12} />
                <span>Inspect Pipeline</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
