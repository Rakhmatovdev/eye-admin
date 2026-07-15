import React, { useState } from 'react';
import { Plus, Trash2, Globe, Server, Network } from 'lucide-react';
import { formatDistanceToNowStrict } from 'date-fns';
import type { BlocklistEntry } from '../../types';

interface BlocklistPanelProps {
  blocklist: BlocklistEntry[];
  onAdd: (value: string, type: BlocklistEntry['type'], reason: string) => void;
  onRemove: (id: string) => void;
}

const TYPE_ICON: Record<BlocklistEntry['type'], React.ElementType> = {
  ip: Server,
  domain: Globe,
  cidr: Network,
  asn: Network,
};

function guessType(value: string): BlocklistEntry['type'] {
  if (value.includes('/')) return 'cidr';
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(value)) return 'ip';
  return 'domain';
}

export const BlocklistPanel: React.FC<BlocklistPanelProps> = ({ blocklist, onAdd, onRemove }) => {
  const [value, setValue] = useState('');
  const [reason, setReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    onAdd(value.trim(), guessType(value.trim()), reason.trim());
    setValue('');
    setReason('');
  };

  const totalHits = blocklist.reduce((s, b) => s + b.hitCount, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 glass rounded-2xl border border-gray-800 overflow-hidden">
        <div className="p-5 border-b border-gray-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Blocklist Registry</h3>
            <p className="text-xxs text-gray-500 mt-0.5">{blocklist.length} rules active · {totalHits.toLocaleString()} total hits blocked</p>
          </div>
        </div>
        <div className="divide-y divide-gray-800/60">
          {blocklist.map((item) => {
            const Icon = TYPE_ICON[item.type];
            return (
              <div key={item.id} className="p-4 flex items-center justify-between gap-3 table-row-hover">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-gray-800/60 border border-gray-700 flex items-center justify-center text-gray-400 shrink-0">
                    <Icon size={14} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-sm font-semibold text-gray-200 truncate">{item.value}</p>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-gray-800 text-gray-400 border border-gray-700 shrink-0">
                        {item.type}
                      </span>
                    </div>
                    <p className="text-xxs text-gray-500 truncate mt-0.5">{item.reason}</p>
                    <p className="text-[10px] text-gray-600 mt-0.5">
                      Added by {item.addedBy} · {formatDistanceToNowStrict(new Date(item.addedAt), { addSuffix: true })} · {item.hitCount.toLocaleString()} hits
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onRemove(item.id)}
                  title="Remove rule"
                  className="p-1.5 hover:bg-red-500/10 text-red-500 rounded-lg border border-transparent hover:border-red-500/20 transition-all shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
          {blocklist.length === 0 && <p className="text-xs text-gray-500 text-center py-10">No active block rules.</p>}
        </div>
      </div>

      <div className="glass p-5 rounded-2xl border border-gray-800 h-fit space-y-4">
        <div>
          <h3 className="text-sm font-bold text-white">Add Block Rule</h3>
          <p className="text-xxs text-gray-500 mt-0.5">Manually block an IP, CIDR range, or domain at the edge.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            placeholder="IP / CIDR / domain to block..."
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-blue-500"
            required
          />
          <input
            type="text"
            placeholder="Reason for blocking..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-blue-500"
          />
          <button type="submit" className="w-full btn-primary py-2 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-1.5">
            <Plus size={14} />
            <span>Add Block Rule</span>
          </button>
        </form>
      </div>
    </div>
  );
};
