import React, { useMemo, useState } from 'react';
import { Search, CheckCircle2, Eye } from 'lucide-react';
import { formatDistanceToNowStrict } from 'date-fns';
import type { SecurityIncident } from '../../types';
import { severityColor } from '../../api/security';

interface IncidentsTableProps {
  incidents: SecurityIncident[];
  onSelect: (incident: SecurityIncident) => void;
  onResolve: (id: string) => void;
}

const TLP_STYLE: Record<SecurityIncident['tlp'], string> = {
  RED: 'bg-red-500/10 text-red-400 border-red-500/30',
  AMBER: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  GREEN: 'bg-green-500/10 text-green-400 border-green-500/30',
  WHITE: 'bg-gray-500/10 text-gray-300 border-gray-500/30',
};

const STATUS_STYLE: Record<SecurityIncident['status'], string> = {
  open: 'text-red-400',
  investigating: 'text-amber-400',
  contained: 'text-cyan-400',
  resolved: 'text-green-400',
};

export const IncidentsTable: React.FC<IncidentsTableProps> = ({ incidents, onSelect, onResolve }) => {
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = useMemo(() => {
    return incidents.filter((inc) => {
      if (severityFilter !== 'all' && inc.severity !== severityFilter) return false;
      if (statusFilter !== 'all' && inc.status !== statusFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        if (
          !inc.title.toLowerCase().includes(s) &&
          !inc.sourceIp.toLowerCase().includes(s) &&
          !inc.affectedAssets.join(' ').toLowerCase().includes(s)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [incidents, search, severityFilter, statusFilter]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
            <Search size={15} />
          </span>
          <input
            type="text"
            placeholder="Search by title, source IP, or asset..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-900 border border-gray-800 rounded-xl text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-all"
          />
        </div>
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-blue-500"
        >
          <option value="all">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-blue-500"
        >
          <option value="all">All Statuses</option>
          <option value="open">Open</option>
          <option value="investigating">Investigating</option>
          <option value="contained">Contained</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      <div className="glass rounded-2xl border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-950/40 text-gray-400 text-xs font-semibold uppercase tracking-wider">
                <th className="p-4">Severity</th>
                <th className="p-4">Incident</th>
                <th className="p-4">Source</th>
                <th className="p-4">TLP</th>
                <th className="p-4">Status</th>
                <th className="p-4">Time</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {filtered.map((inc) => {
                const color = severityColor(inc.severity);
                return (
                  <tr key={inc.id} className="table-row-hover text-sm cursor-pointer" onClick={() => onSelect(inc)}>
                    <td className="p-4">
                      <span
                        className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border"
                        style={{ backgroundColor: `${color}1A`, borderColor: `${color}4D`, color }}
                      >
                        {inc.severity}
                      </span>
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-gray-200">{inc.title}</p>
                      <p className="text-xxs text-gray-500 mt-0.5">{inc.affectedAssets.join(', ')}</p>
                    </td>
                    <td className="p-4 text-gray-400 font-mono text-xs">{inc.sourceIp}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${TLP_STYLE[inc.tlp]}`}>{inc.tlp}</span>
                    </td>
                    <td className="p-4">
                      <span className={`text-xs font-semibold capitalize ${STATUS_STYLE[inc.status]}`}>{inc.status}</span>
                    </td>
                    <td className="p-4 text-gray-500 text-xs whitespace-nowrap">
                      {formatDistanceToNowStrict(new Date(inc.timestamp), { addSuffix: true })}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onSelect(inc)}
                          title="View details"
                          className="p-1.5 bg-gray-800/60 text-gray-400 border border-gray-700 rounded-lg hover:text-white transition-all"
                        >
                          <Eye size={14} />
                        </button>
                        {inc.status !== 'resolved' && (
                          <button
                            onClick={() => onResolve(inc.id)}
                            title="Resolve incident"
                            className="p-1.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg hover:bg-green-500/20 transition-all"
                          >
                            <CheckCircle2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500 text-sm">
                    No incidents match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
