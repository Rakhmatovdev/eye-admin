import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Ban,
  Bug,
  Gauge,
  Globe2,
  RefreshCcw,
  CheckCircle2,
} from 'lucide-react';
import type { SecurityIncident, Vulnerability, BlocklistEntry, SecurityOverview, AttackMapNode } from '../types';
import { securityApi, computeOverview, computeAttackMap } from '../api/security';
import { useLiveThreatFeed } from '../hooks/useLiveThreatFeed';

import { RiskGauge } from '../components/security/RiskGauge';
import { SecurityChart, SeverityDonut } from '../components/security/SecurityCharts';
import { ThreatFeedPanel } from '../components/security/ThreatFeedPanel';
import { IncidentsTable } from '../components/security/IncidentsTable';
import { IncidentDrawer } from '../components/security/IncidentDrawer';
import { VulnerabilitiesPanel } from '../components/security/VulnerabilitiesPanel';
import { BlocklistPanel } from '../components/security/BlocklistPanel';
import { AttackMap } from '../components/security/AttackMap';

type TabKey = 'overview' | 'incidents' | 'vulnerabilities' | 'attackmap' | 'blocklist';

const SEVERITY_WEIGHT: Record<SecurityIncident['severity'], number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export const Security: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);
  const [blocklist, setBlocklist] = useState<BlocklistEntry[]>([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const { feed, status, paused, togglePause, clear } = useLiveThreatFeed();

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [incidentsRes, vulnRes, blocklistRes] = await Promise.all([
      securityApi.listIncidents(),
      securityApi.listVulnerabilities(),
      securityApi.listBlocklist(),
    ]);
    setIncidents(incidentsRes);
    setVulnerabilities(vulnRes);
    setBlocklist(blocklistRes);
    setLastRefreshed(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const overview: SecurityOverview | null = useMemo(() => {
    if (loading) return null;
    return computeOverview(incidents, vulnerabilities, blocklist);
  }, [incidents, vulnerabilities, blocklist, loading]);

  const attackMapNodes: AttackMapNode[] = useMemo(() => computeAttackMap(incidents), [incidents]);

  const selectedIncident = incidents.find((i) => i.id === selectedIncidentId) ?? null;

  const topOpenIncidents = useMemo(() => {
    return [...incidents]
      .filter((i) => i.status !== 'resolved')
      .sort((a, b) => SEVERITY_WEIGHT[b.severity] - SEVERITY_WEIGHT[a.severity])
      .slice(0, 5);
  }, [incidents]);

  const handleResolveIncident = useCallback(async (id: string) => {
    setIncidents((prev) => prev.map((i) => (i.id === id ? { ...i, status: 'resolved' } : i)));
    await securityApi.resolveIncident(id);
  }, []);

  const handleAssignToMe = useCallback(async (id: string) => {
    setIncidents((prev) => prev.map((i) => (i.id === id ? { ...i, assignee: 'You' } : i)));
    await securityApi.assignIncident(id, 'You');
  }, []);

  const handleUpdateVulnStatus = useCallback(async (id: string, statusVal: Vulnerability['status']) => {
    setVulnerabilities((prev) => prev.map((v) => (v.id === id ? { ...v, status: statusVal } : v)));
    await securityApi.updateVulnerabilityStatus(id, statusVal);
  }, []);

  const handleAddBlocklist = useCallback(async (value: string, type: BlocklistEntry['type'], reason: string) => {
    const entry = await securityApi.addToBlocklist(value, type, reason);
    setBlocklist((prev) => [entry, ...prev]);
  }, []);

  const handleRemoveBlocklist = useCallback(async (id: string) => {
    setBlocklist((prev) => prev.filter((b) => b.id !== id));
    await securityApi.removeFromBlocklist(id);
  }, []);

  const tabs: { key: TabKey; label: string; icon: React.ElementType; count?: number }[] = [
    { key: 'overview', label: 'Overview', icon: Gauge },
    { key: 'incidents', label: 'Incidents', icon: ShieldAlert, count: incidents.filter((i) => i.status !== 'resolved').length },
    { key: 'vulnerabilities', label: 'Vulnerabilities', icon: Bug, count: vulnerabilities.filter((v) => v.status === 'open' || v.status === 'patching').length },
    { key: 'attackmap', label: 'Attack Map', icon: Globe2 },
    { key: 'blocklist', label: 'Blocklist', icon: Ban, count: blocklist.length },
  ];

  return (
    <div className="space-y-6">
      {/* Title header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Security Operations Center
            <span className="live-dot-red w-2 h-2 bg-red-500 rounded-full" />
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            SIEM-driven threat detection, vulnerability management, and edge defense — real-time posture across the platform.
          </p>
        </div>
        <button
          onClick={loadAll}
          className="flex items-center gap-2 px-3.5 py-2 bg-gray-900 border border-gray-800 rounded-xl text-xs font-semibold text-gray-400 hover:text-white hover:border-gray-700 transition-all shrink-0"
        >
          <RefreshCcw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh · {lastRefreshed.toLocaleTimeString()}
        </button>
      </div>

      {/* Risk gauge + KPI row */}
      <div className="glass rounded-2xl border border-gray-800 p-5 flex flex-col lg:flex-row items-center gap-6">
        {overview ? (
          <>
            <div className="shrink-0 border-b lg:border-b-0 lg:border-r border-gray-800 pb-4 lg:pb-0 lg:pr-6 w-full lg:w-auto">
              <RiskGauge overview={overview} />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3 w-full">
              {[
                { name: 'Critical Open', value: overview.criticalOpen, icon: ShieldAlert, color: 'text-red-500', bg: 'bg-red-500/10' },
                { name: 'High Open', value: overview.highOpen, icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-500/10' },
                { name: 'Open Incidents', value: overview.openIncidents, icon: Gauge, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                { name: 'Open Vulns', value: overview.openVulnerabilities, icon: Bug, color: 'text-purple-500', bg: 'bg-purple-500/10' },
                { name: 'Blocked Entities', value: overview.blockedCount, icon: Ban, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
              ].map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.name} className="bg-gray-950/50 border border-gray-800 rounded-xl p-3.5 flex flex-col justify-between">
                    <div className={`w-8 h-8 rounded-lg ${stat.bg} ${stat.color} flex items-center justify-center mb-2`}>
                      <Icon size={15} />
                    </div>
                    <h3 className="text-xl font-extrabold text-white count-up">{stat.value}</h3>
                    <p className="text-xxs text-gray-500 uppercase font-semibold mt-0.5">{stat.name}</p>
                  </div>
                );
              })}
              <div className="bg-gray-950/50 border border-gray-800 rounded-xl p-3.5 flex flex-col justify-between">
                <div className="w-8 h-8 rounded-lg bg-green-500/10 text-green-500 flex items-center justify-center mb-2">
                  <CheckCircle2 size={15} />
                </div>
                <h3 className="text-xl font-extrabold text-white count-up">{overview.mttr}</h3>
                <p className="text-xxs text-gray-500 uppercase font-semibold mt-0.5">Mean Time to Resolve</p>
              </div>
            </div>
          </>
        ) : (
          <div className="w-full h-40 skeleton rounded-xl" />
        )}
      </div>

      {/* Main content: tabs + persistent live feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    isActive
                      ? 'bg-blue-600/10 text-blue-400 border-blue-500/40'
                      : 'bg-gray-900 text-gray-400 border-gray-800 hover:text-gray-200 hover:border-gray-700'
                  }`}
                >
                  <Icon size={14} />
                  {tab.label}
                  {typeof tab.count === 'number' && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${isActive ? 'bg-blue-500/20' : 'bg-gray-800'}`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="page-enter">
            {activeTab === 'overview' && overview && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  <SecurityChart overview={overview} />
                  <SeverityDonut overview={overview} />
                </div>
                <div className="glass rounded-2xl border border-gray-800 overflow-hidden">
                  <div className="p-4 border-b border-gray-800">
                    <h3 className="text-sm font-bold text-white">Priority Incidents</h3>
                    <p className="text-xxs text-gray-500 mt-0.5">Highest-severity open incidents requiring attention</p>
                  </div>
                  <div className="divide-y divide-gray-800/60">
                    {topOpenIncidents.map((inc) => (
                      <button
                        key={inc.id}
                        onClick={() => setSelectedIncidentId(inc.id)}
                        className="w-full text-left px-4 py-3 flex items-center justify-between gap-3 table-row-hover"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border shrink-0 ${
                              inc.severity === 'critical'
                                ? 'bg-red-500/10 text-red-500 border-red-500/20'
                                : inc.severity === 'high'
                                ? 'bg-orange-500/10 text-orange-500 border-orange-500/20'
                                : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                            }`}
                          >
                            {inc.severity}
                          </span>
                          <p className="text-sm font-semibold text-gray-200 truncate">{inc.title}</p>
                        </div>
                        <span className="text-xxs text-gray-500 shrink-0 capitalize">{inc.status}</span>
                      </button>
                    ))}
                    {topOpenIncidents.length === 0 && (
                      <p className="text-xs text-gray-500 text-center py-6">All clear — no priority incidents open.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'incidents' && (
              <IncidentsTable incidents={incidents} onSelect={(inc) => setSelectedIncidentId(inc.id)} onResolve={handleResolveIncident} />
            )}

            {activeTab === 'vulnerabilities' && (
              <VulnerabilitiesPanel vulnerabilities={vulnerabilities} onUpdateStatus={handleUpdateVulnStatus} />
            )}

            {activeTab === 'attackmap' && <AttackMap nodes={attackMapNodes} />}

            {activeTab === 'blocklist' && (
              <BlocklistPanel blocklist={blocklist} onAdd={handleAddBlocklist} onRemove={handleRemoveBlocklist} />
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <ThreatFeedPanel feed={feed} status={status} paused={paused} onTogglePause={togglePause} onClear={clear} />
        </div>
      </div>

      <IncidentDrawer
        incident={selectedIncident}
        onClose={() => setSelectedIncidentId(null)}
        onResolve={handleResolveIncident}
        onAssignToMe={handleAssignToMe}
      />
    </div>
  );
};
