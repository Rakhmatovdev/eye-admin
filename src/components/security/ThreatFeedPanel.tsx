import React from 'react';
import { formatDistanceToNowStrict } from 'date-fns';
import { Pause, Play, Radio, Trash2, Globe, Hash, Link as LinkIcon, Mail, Server } from 'lucide-react';
import type { ThreatFeedItem } from '../../types';
import type { FeedLinkStatus } from '../../hooks/useLiveThreatFeed';
import { severityColor } from '../../api/security';

interface ThreatFeedPanelProps {
  feed: ThreatFeedItem[];
  status: FeedLinkStatus;
  paused: boolean;
  onTogglePause: () => void;
  onClear: () => void;
}

const TYPE_ICON: Record<ThreatFeedItem['type'], React.ElementType> = {
  ip: Server,
  domain: Globe,
  hash: Hash,
  url: LinkIcon,
  email: Mail,
};

const STATUS_META: Record<FeedLinkStatus, { label: string; dot: string; text: string }> = {
  connecting: { label: 'CONNECTING…', dot: 'bg-gray-500', text: 'text-gray-400' },
  live: { label: 'SIEM LINK: LIVE', dot: 'bg-green-500 live-dot', text: 'text-green-400' },
  simulated: { label: 'SIMULATED FEED', dot: 'bg-amber-500 live-dot-amber', text: 'text-amber-400' },
};

export const ThreatFeedPanel: React.FC<ThreatFeedPanelProps> = ({ feed, status, paused, onTogglePause, onClear }) => {
  const meta = STATUS_META[status];

  return (
    <div className="glass rounded-2xl border border-gray-800 flex flex-col h-full max-h-[calc(100vh-140px)] sticky top-20">
      <div className="p-4 border-b border-gray-800 flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Radio size={14} className="text-blue-500" />
            Live Threat Feed
          </h3>
          <span className={`inline-flex items-center gap-1.5 text-xxs font-bold mt-1.5 ${meta.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
            {meta.label}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={onTogglePause}
            title={paused ? 'Resume feed' : 'Pause feed'}
            className="p-1.5 bg-gray-950 border border-gray-800 rounded-lg text-gray-400 hover:text-white hover:border-gray-700 transition-all"
          >
            {paused ? <Play size={13} /> : <Pause size={13} />}
          </button>
          <button
            onClick={onClear}
            title="Clear feed"
            className="p-1.5 bg-gray-950 border border-gray-800 rounded-lg text-gray-400 hover:text-red-400 hover:border-red-500/30 transition-all"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar divide-y divide-gray-800/60">
        {feed.length === 0 && (
          <p className="text-xs text-gray-500 text-center py-10 px-4">Feed cleared. New indicators will appear here as they stream in.</p>
        )}
        {feed.map((item) => {
          const Icon = TYPE_ICON[item.type] ?? Server;
          const color = severityColor(item.severity);
          return (
            <div key={item.id} className="threat-item px-4 py-3 flex gap-3">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border"
                style={{ backgroundColor: `${color}1A`, borderColor: `${color}33`, color }}
              >
                <Icon size={13} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-mono font-semibold text-gray-200 truncate">{item.indicator}</p>
                  <span className="text-[10px] text-gray-500 shrink-0">
                    {formatDistanceToNowStrict(new Date(item.timestamp), { addSuffix: false })}
                  </span>
                </div>
                <p className="text-xxs text-gray-500 mt-0.5 leading-snug">{item.description}</p>
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  <span
                    className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border"
                    style={{ backgroundColor: `${color}1A`, borderColor: `${color}33`, color }}
                  >
                    {item.severity}
                  </span>
                  <span className="text-[9px] text-gray-600 font-medium">{item.source}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
