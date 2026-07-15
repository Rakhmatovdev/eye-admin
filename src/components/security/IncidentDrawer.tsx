import React, { useEffect, useState } from 'react';
import { X, CheckCircle2, UserCheck, Server, MapPin, Clock, Layers } from 'lucide-react';
import { format } from 'date-fns';
import type { SecurityIncident } from '../../types';
import { severityColor } from '../../api/security';

interface IncidentDrawerProps {
  incident: SecurityIncident | null;
  onClose: () => void;
  onResolve: (id: string) => void;
  onAssignToMe: (id: string) => void;
}

const TLP_STYLE: Record<SecurityIncident['tlp'], string> = {
  RED: 'bg-red-500/10 text-red-400 border-red-500/30',
  AMBER: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  GREEN: 'bg-green-500/10 text-green-400 border-green-500/30',
  WHITE: 'bg-gray-500/10 text-gray-300 border-gray-500/30',
};

export const IncidentDrawer: React.FC<IncidentDrawerProps> = ({ incident, onClose, onResolve, onAssignToMe }) => {
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    setFlash(null);
  }, [incident?.id]);

  if (!incident) return null;
  const color = severityColor(incident.severity);

  const handleResolve = () => {
    onResolve(incident.id);
    setFlash('Incident marked as resolved.');
  };

  const handleAssign = () => {
    onAssignToMe(incident.id);
    setFlash('Incident assigned to you.');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end modal-overlay" onClick={onClose}>
      <div
        className="glass-strong w-full max-w-md h-full overflow-y-auto no-scrollbar border-l border-gray-800 animate-slide-in-right"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-gray-800 flex items-start justify-between sticky top-0 bg-gray-950/90 backdrop-blur-md z-10">
          <div>
            <span
              className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border"
              style={{ backgroundColor: `${color}1A`, borderColor: `${color}4D`, color }}
            >
              {incident.severity}
            </span>
            <h3 className="text-base font-bold text-white mt-2 leading-snug">{incident.title}</h3>
            <p className="text-xxs text-gray-500 mt-1 font-mono">{incident.id}</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-500 hover:text-white rounded-lg hover:bg-gray-800 transition-all shrink-0">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className="flex flex-wrap gap-2">
            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${TLP_STYLE[incident.tlp]}`}>TLP:{incident.tlp}</span>
            <span className="px-2.5 py-1 rounded-lg text-xs font-semibold border border-gray-700 text-gray-300 capitalize">{incident.status}</span>
            <span className="px-2.5 py-1 rounded-lg text-xs font-semibold border border-gray-700 text-gray-300 capitalize">{incident.type.replace('_', ' ')}</span>
          </div>

          <div>
            <h4 className="text-xxs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Description</h4>
            <p className="text-sm text-gray-300 leading-relaxed">{incident.description}</p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center gap-3 bg-gray-950/60 border border-gray-800 rounded-xl p-3">
              <Server size={16} className="text-gray-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-xxs text-gray-500">Source</p>
                <p className="text-sm font-mono text-gray-200 truncate">{incident.sourceIp}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-gray-950/60 border border-gray-800 rounded-xl p-3">
              <Layers size={16} className="text-gray-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-xxs text-gray-500">Affected Assets</p>
                <p className="text-sm text-gray-200 truncate">{incident.affectedAssets.join(', ')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-gray-950/60 border border-gray-800 rounded-xl p-3">
              <Clock size={16} className="text-gray-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-xxs text-gray-500">Detected</p>
                <p className="text-sm text-gray-200">{format(new Date(incident.timestamp), 'MMM d, yyyy · HH:mm:ss')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-gray-950/60 border border-gray-800 rounded-xl p-3">
              <MapPin size={16} className="text-gray-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-xxs text-gray-500">Assignee</p>
                <p className="text-sm text-gray-200">{incident.assignee ?? 'Unassigned'}</p>
              </div>
            </div>
          </div>

          {flash && (
            <div className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
              {flash}
            </div>
          )}

          <div className="flex gap-2 pt-2 border-t border-gray-800">
            <button
              onClick={handleAssign}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-xs font-semibold text-gray-300 hover:bg-gray-800 transition-all"
            >
              <UserCheck size={14} />
              Assign to Me
            </button>
            {incident.status !== 'resolved' ? (
              <button
                onClick={handleResolve}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 rounded-xl text-xs font-semibold transition-all"
              >
                <CheckCircle2 size={14} />
                Resolve Incident
              </button>
            ) : (
              <span className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-xs font-semibold text-gray-500">
                <CheckCircle2 size={14} />
                Already Resolved
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
