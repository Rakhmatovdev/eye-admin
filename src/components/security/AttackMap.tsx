import React, { useMemo, useState } from 'react';
import { Crosshair, Globe2 } from 'lucide-react';
import type { AttackMapNode } from '../../types';
import { severityColor } from '../../api/security';

interface AttackMapProps {
  nodes: AttackMapNode[];
}

export const AttackMap: React.FC<AttackMapProps> = ({ nodes }) => {
  const [hovered, setHovered] = useState<string | null>(null);

  const positioned = useMemo(() => {
    const center = 200;
    const radius = 148;
    return nodes.map((node, i) => {
      const angle = (2 * Math.PI * i) / Math.max(1, nodes.length) - Math.PI / 2;
      const x = center + radius * Math.cos(angle);
      const y = center + radius * Math.sin(angle);
      const r = 9 + Math.min(node.incidentCount, 10) * 1.6;
      return { ...node, x, y, r };
    });
  }, [nodes]);

  const active = positioned.find((n) => n.id === hovered) ?? null;

  return (
    <div className="glass rounded-2xl border border-gray-800 p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Globe2 size={15} className="text-blue-500" />
            Attack Surface Map
          </h3>
          <p className="text-xxs text-gray-500 mt-0.5">Top offending sources, sized by incident volume</p>
        </div>
        {active && (
          <div className="text-right">
            <p className="text-xs font-mono font-bold text-white">{active.label}</p>
            <p className="text-xxs text-gray-500">
              {active.incidentCount} incident{active.incidentCount === 1 ? '' : 's'} · {active.kind === 'ip' ? 'external source' : 'internal asset'}
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-center">
        <svg viewBox="0 0 400 400" className="w-full max-w-md mx-auto">
          {positioned.map((node) => {
            const color = severityColor(node.severity);
            const isActive = hovered === node.id;
            return (
              <line
                key={`edge-${node.id}`}
                x1={200}
                y1={200}
                x2={node.x}
                y2={node.y}
                stroke={color}
                strokeWidth={isActive ? 2.5 : 1.2}
                strokeOpacity={isActive ? 0.9 : 0.35}
                strokeDasharray="6 5"
                className="data-flow"
              />
            );
          })}

          {/* Core */}
          <circle cx={200} cy={200} r={26} fill="#111827" stroke="#3B82F6" strokeWidth={2} className="map-dot" />
          <circle cx={200} cy={200} r={26} fill="none" stroke="#3B82F6" strokeWidth={1} strokeOpacity={0.4} />
          <text x={200} y={196} textAnchor="middle" fontSize="7" fontWeight={700} fill="#93C5FD" letterSpacing="0.5">
            PLATFORM
          </text>
          <text x={200} y={206} textAnchor="middle" fontSize="7" fontWeight={700} fill="#93C5FD" letterSpacing="0.5">
            CORE
          </text>

          {positioned.map((node) => {
            const color = severityColor(node.severity);
            return (
              <g
                key={node.id}
                onMouseEnter={() => setHovered(node.id)}
                onMouseLeave={() => setHovered((h) => (h === node.id ? null : h))}
                className="cursor-pointer"
              >
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={node.r}
                  fill={`${color}26`}
                  stroke={color}
                  strokeWidth={hovered === node.id ? 2.5 : 1.5}
                />
                <circle cx={node.x} cy={node.y} r={3} fill={color} className="map-dot" />
                <text
                  x={node.x}
                  y={node.y + node.r + 12}
                  textAnchor="middle"
                  fontSize="8"
                  fill="#94A3B8"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {node.label.length > 16 ? `${node.label.slice(0, 14)}…` : node.label}
                </text>
              </g>
            );
          })}
        </svg>

        <div className="w-full lg:w-56 space-y-2 shrink-0">
          <p className="text-xxs font-bold text-gray-500 uppercase flex items-center gap-1.5">
            <Crosshair size={12} />
            Top Sources
          </p>
          {positioned
            .slice()
            .sort((a, b) => b.incidentCount - a.incidentCount)
            .map((node) => {
              const color = severityColor(node.severity);
              return (
                <div
                  key={node.id}
                  onMouseEnter={() => setHovered(node.id)}
                  onMouseLeave={() => setHovered((h) => (h === node.id ? null : h))}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-xs transition-all cursor-default ${
                    hovered === node.id ? 'border-gray-700 bg-gray-800/60' : 'border-transparent'
                  }`}
                >
                  <span className="font-mono text-gray-300 truncate">{node.label}</span>
                  <span className="font-bold shrink-0 ml-2" style={{ color }}>
                    {node.incidentCount}
                  </span>
                </div>
              );
            })}
          {positioned.length === 0 && <p className="text-xxs text-gray-500">No external sources recorded.</p>}
        </div>
      </div>
    </div>
  );
};
