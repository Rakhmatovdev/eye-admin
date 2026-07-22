import React, { useState } from 'react';
import { Search, Download, AlertCircle, CheckCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { auditApi } from '../api/audit';
import { useT } from '../hooks/useT';

export const AuditLogs: React.FC = () => {
  const t = useT();
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['audit', 'logs'],
    queryFn: () => auditApi.getLogs(),
  });

  const [search, setSearch] = useState('');

  const filteredLogs = logs.filter(l =>
    l.userEmail.toLowerCase().includes(search.toLowerCase()) ||
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    l.resource.toLowerCase().includes(search.toLowerCase()) ||
    l.ip.includes(search)
  );

  const handleExportCSV = async () => {
    const csv = await auditApi.exportLogs();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `koz_audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            {t('auditLogs.title')} <span className="text-xxs font-bold bg-blue-600/10 border border-blue-500/20 text-blue-400 px-2.5 py-0.5 rounded-full">{t('auditLogs.hashChainedBadge')}</span>
          </h1>
          <p className="text-gray-400 text-sm mt-1">{t('auditLogs.subtitle')}</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="btn-primary px-4 py-2.5 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2"
        >
          <Download size={16} />
          <span>{t('auditLogs.exportLogs')}</span>
        </button>
      </div>

      {/* Filter bar */}
      <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
          <Search size={16} />
        </span>
        <input
          type="text"
          placeholder={t('auditLogs.searchPlaceholder')}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-all"
        />
      </div>

      {/* Logs Table */}
      <div className="glass rounded-2xl border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-950/40 text-gray-400 text-xs font-semibold uppercase tracking-wider">
                <th className="p-4">{t('auditLogs.table.timestamp')}</th>
                <th className="p-4">{t('auditLogs.table.identity')}</th>
                <th className="p-4">{t('auditLogs.table.capabilityAction')}</th>
                <th className="p-4">{t('auditLogs.table.resource')}</th>
                <th className="p-4">{t('auditLogs.table.ipAddress')}</th>
                <th className="p-4">{t('auditLogs.table.result')}</th>
                <th className="p-4">{t('auditLogs.table.cryptographicHash')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 font-mono text-xs">
              {isLoading && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-gray-500">{t('auditLogs.loadingAuditTrail')}</td>
                </tr>
              )}
              {!isLoading && filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-gray-500">{t('auditLogs.noEntriesMatch')}</td>
                </tr>
              )}
              {filteredLogs.map(log => (
                <tr key={log.id} className="table-row-hover">
                  <td className="p-4 text-gray-500">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="p-4 font-semibold text-gray-300">{log.userEmail}</td>
                  <td className="p-4 text-blue-400 font-semibold">{log.action}</td>
                  <td className="p-4 text-gray-400">{log.resource}</td>
                  <td className="p-4 text-gray-500">{log.ip}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1 font-bold ${
                      log.result === 'success' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {log.result === 'success' ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                      {log.result}
                    </span>
                  </td>
                  <td className="p-4 text-gray-600 select-all" title={t('auditLogs.hashTooltip')}>{log.hash}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
