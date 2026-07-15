import React from 'react';
import { ShieldQuestion, ExternalLink } from 'lucide-react';
import { formatDistanceToNowStrict } from 'date-fns';
import type { Vulnerability } from '../../types';
import { severityColor } from '../../api/security';

interface VulnerabilitiesPanelProps {
  vulnerabilities: Vulnerability[];
  onUpdateStatus: (id: string, status: Vulnerability['status']) => void;
}

const STATUS_OPTIONS: Vulnerability['status'][] = ['open', 'patching', 'mitigated', 'resolved', 'accepted_risk'];

const STATUS_LABEL: Record<Vulnerability['status'], string> = {
  open: 'Open',
  patching: 'Patching',
  mitigated: 'Mitigated',
  resolved: 'Resolved',
  accepted_risk: 'Accepted Risk',
};

export const VulnerabilitiesPanel: React.FC<VulnerabilitiesPanelProps> = ({ vulnerabilities, onUpdateStatus }) => {
  return (
    <div className="space-y-3">
      {vulnerabilities.map((vuln) => {
        const color = severityColor(vuln.severity);
        const pct = Math.min(100, (vuln.cvssScore / 10) * 100);
        return (
          <div key={vuln.id} className="glass p-5 rounded-2xl border border-gray-800 card-hover">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="flex gap-3 min-w-0">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border"
                  style={{ backgroundColor: `${color}1A`, borderColor: `${color}33`, color }}
                >
                  <ShieldQuestion size={16} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-sm text-gray-200">{vuln.title}</h4>
                    {vuln.cveId && (
                      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-800 text-[10px] font-mono text-gray-400 border border-gray-700">
                        {vuln.cveId}
                        <ExternalLink size={9} />
                      </span>
                    )}
                  </div>
                  <p className="text-xxs text-gray-500 mt-1">
                    {vuln.component} · {vuln.affectedAsset}
                  </p>
                  <p className="text-xs text-gray-400 mt-2 leading-relaxed max-w-2xl">{vuln.description}</p>
                  <p className="text-[10px] text-gray-600 mt-2">
                    Discovered {formatDistanceToNowStrict(new Date(vuln.discoveredAt), { addSuffix: true })} · Remediation: {vuln.remediation}
                  </p>
                </div>
              </div>

              <div className="flex flex-row md:flex-col items-center md:items-end gap-3 shrink-0 md:w-40">
                <div className="text-right w-full">
                  <div className="flex items-center justify-between md:justify-end gap-2">
                    <span className="text-xxs text-gray-500">CVSS</span>
                    <span className="text-lg font-extrabold" style={{ color }}>{vuln.cvssScore.toFixed(1)}</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden mt-1">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                  </div>
                </div>
                <select
                  value={vuln.status}
                  onChange={(e) => onUpdateStatus(vuln.id, e.target.value as Vulnerability['status'])}
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-2 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-blue-500"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
