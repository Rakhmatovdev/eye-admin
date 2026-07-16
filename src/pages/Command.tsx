import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash, Users, Target, Flag } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { militaryApi, type Unit, type Threat, type Mission } from '../api/military';

type Tab = 'units' | 'threats' | 'missions';

const EMPTY_UNIT: Omit<Unit, 'id'> = { callsign: '', name: '', type: 'infantry', domain: 'land', status: 'active', readiness: 'green', lat: 41.3, lng: 69.28, strength: 20, heading: 0, speed: 0 };
const EMPTY_THREAT: Omit<Threat, 'id'> = { designation: '', type: 'unknown', classification: 'unknown', threat_level: 'medium', lat: 40.5, lng: 70, heading: 0, speed: 0, confidence: 0.6, entity_id: '' };
const EMPTY_MISSION: Omit<Mission, 'id'> = { name: '', status: 'planning', priority: 'routine', objective: '', area: '', assigned_units: [], progress: 0 };

export const Command: React.FC = () => {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('units');
  const invalidate = () => qc.invalidateQueries();

  const units = useQuery({ queryKey: ['adm-units'], queryFn: militaryApi.units });
  const threats = useQuery({ queryKey: ['adm-threats'], queryFn: militaryApi.threats });
  const missions = useQuery({ queryKey: ['adm-missions'], queryFn: militaryApi.missions });
  const stats = useQuery({ queryKey: ['adm-mil-stats'], queryFn: militaryApi.stats });

  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [err, setErr] = useState('');

  const openNew = () => { setErr(''); setEditId(null); setForm(tab === 'units' ? { ...EMPTY_UNIT } : tab === 'threats' ? { ...EMPTY_THREAT } : { ...EMPTY_MISSION }); setModal(true); };
  const openEdit = (row: Record<string, unknown>) => { setErr(''); setEditId(row.id as string); const { id, ...rest } = row; setForm({ ...rest }); setModal(true); };
  const close = () => { setModal(false); setEditId(null); };

  const mFail = () => setErr('Operation failed — admin role required.');
  const uM = useMutation({ mutationFn: (v: { id: string | null; d: Omit<Unit, 'id'> }) => v.id ? militaryApi.updateUnit(v.id, v.d) : militaryApi.createUnit(v.d), onSuccess: () => { invalidate(); close(); }, onError: mFail });
  const tM = useMutation({ mutationFn: (v: { id: string | null; d: Omit<Threat, 'id'> }) => v.id ? militaryApi.updateThreat(v.id, v.d) : militaryApi.createThreat(v.d), onSuccess: () => { invalidate(); close(); }, onError: mFail });
  const msM = useMutation({ mutationFn: (v: { id: string | null; d: Omit<Mission, 'id'> }) => v.id ? militaryApi.updateMission(v.id, v.d) : militaryApi.createMission(v.d), onSuccess: () => { invalidate(); close(); }, onError: mFail });
  const delU = useMutation({ mutationFn: militaryApi.removeUnit, onSuccess: invalidate });
  const delT = useMutation({ mutationFn: militaryApi.removeThreat, onSuccess: invalidate });
  const delM = useMutation({ mutationFn: militaryApi.removeMission, onSuccess: invalidate });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tab === 'units') uM.mutate({ id: editId, d: form as unknown as Omit<Unit, 'id'> });
    else if (tab === 'threats') tM.mutate({ id: editId, d: form as unknown as Omit<Threat, 'id'> });
    else msM.mutate({ id: editId, d: form as unknown as Omit<Mission, 'id'> });
  };

  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));
  const num = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => set(k, parseFloat(e.target.value || '0'));
  const str = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => set(k, e.target.value);

  const tabs: { id: Tab; label: string; icon: LucideIcon; count: number }[] = [
    { id: 'units', label: 'Units', icon: Users, count: units.data?.length ?? 0 },
    { id: 'threats', label: 'Threats', icon: Target, count: threats.data?.length ?? 0 },
    { id: 'missions', label: 'Missions', icon: Flag, count: missions.data?.length ?? 0 },
  ];

  const tiles = stats.data ? [
    { label: 'Units', value: stats.data.units, color: 'text-blue-400' },
    { label: 'Ready', value: stats.data.units_ready, color: 'text-green-400' },
    { label: 'Threats', value: stats.data.threats, color: 'text-orange-400' },
    { label: 'Critical', value: stats.data.critical_threats, color: 'text-red-400' },
    { label: 'Active Ops', value: stats.data.active_missions, color: 'text-violet-400' },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Command &amp; Control</h1>
          <p className="text-gray-400 text-sm mt-1">Manage the common operating picture — units, threat tracks and operations.</p>
        </div>
        <button onClick={openNew} className="btn-primary px-4 py-2.5 rounded-xl font-semibold text-sm text-white flex items-center gap-2">
          <Plus size={16} /> <span>New {tab.slice(0, -1)}</span>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {tiles.map((t) => (
          <div key={t.label} className="card rounded-2xl p-4 border border-gray-800">
            <p className="text-xs text-gray-500 uppercase tracking-wider">{t.label}</p>
            <p className={`text-2xl font-bold mt-1 ${t.color}`}>{t.value}</p>
          </div>
        ))}
      </div>

      {/* tabs */}
      <div className="flex gap-2 border-b border-gray-800">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-all ${tab === t.id ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
              <Icon size={15} /> {t.label} <span className="text-xs text-gray-600">({t.count})</span>
            </button>
          );
        })}
      </div>

      <div className="glass rounded-2xl border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          {tab === 'units' && (
            <table className="w-full text-left text-sm">
              <thead><tr className="border-b border-gray-800 bg-gray-950/40 text-gray-400 text-xs uppercase tracking-wider">
                <th className="p-4">Callsign</th><th className="p-4">Type</th><th className="p-4">Status</th><th className="p-4">Readiness</th><th className="p-4">Strength</th><th className="p-4 text-right">Manage</th></tr></thead>
              <tbody className="divide-y divide-gray-800/60">
                {(units.data ?? []).map((u) => (
                  <tr key={u.id} className="table-row-hover">
                    <td className="p-4"><p className="font-semibold text-gray-200">{u.callsign}</p><p className="text-xs text-gray-500">{u.name}</p></td>
                    <td className="p-4 capitalize text-gray-300">{u.type} · {u.domain}</td>
                    <td className="p-4 capitalize text-gray-400">{u.status}</td>
                    <td className="p-4"><span className={`px-2 py-0.5 rounded-full text-xxs font-bold ${u.readiness === 'green' ? 'bg-green-500/10 text-green-400' : u.readiness === 'amber' ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'}`}>{u.readiness}</span></td>
                    <td className="p-4 text-gray-400">{u.strength}</td>
                    <td className="p-4 text-right"><RowActions onEdit={() => openEdit(u as unknown as Record<string, unknown>)} onDel={() => confirm(`Delete unit ${u.callsign}?`) && delU.mutate(u.id)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {tab === 'threats' && (
            <table className="w-full text-left text-sm">
              <thead><tr className="border-b border-gray-800 bg-gray-950/40 text-gray-400 text-xs uppercase tracking-wider">
                <th className="p-4">Designation</th><th className="p-4">Class</th><th className="p-4">Level</th><th className="p-4">Type</th><th className="p-4">Conf.</th><th className="p-4 text-right">Manage</th></tr></thead>
              <tbody className="divide-y divide-gray-800/60">
                {(threats.data ?? []).map((t) => (
                  <tr key={t.id} className="table-row-hover">
                    <td className="p-4 font-semibold text-gray-200">{t.designation}</td>
                    <td className="p-4 capitalize text-gray-300">{t.classification}</td>
                    <td className="p-4"><span className={`px-2 py-0.5 rounded-full text-xxs font-bold ${t.threat_level === 'critical' ? 'bg-red-500/10 text-red-400' : t.threat_level === 'high' ? 'bg-orange-500/10 text-orange-400' : t.threat_level === 'medium' ? 'bg-amber-500/10 text-amber-400' : 'bg-gray-500/10 text-gray-400'}`}>{t.threat_level}</span></td>
                    <td className="p-4 capitalize text-gray-400">{t.type}</td>
                    <td className="p-4 text-gray-400">{(t.confidence * 100).toFixed(0)}%</td>
                    <td className="p-4 text-right"><RowActions onEdit={() => openEdit(t as unknown as Record<string, unknown>)} onDel={() => confirm(`Delete threat ${t.designation}?`) && delT.mutate(t.id)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {tab === 'missions' && (
            <table className="w-full text-left text-sm">
              <thead><tr className="border-b border-gray-800 bg-gray-950/40 text-gray-400 text-xs uppercase tracking-wider">
                <th className="p-4">Operation</th><th className="p-4">Status</th><th className="p-4">Priority</th><th className="p-4">Progress</th><th className="p-4 text-right">Manage</th></tr></thead>
              <tbody className="divide-y divide-gray-800/60">
                {(missions.data ?? []).map((m) => (
                  <tr key={m.id} className="table-row-hover">
                    <td className="p-4"><p className="font-semibold text-gray-200">{m.name}</p><p className="text-xs text-gray-500 max-w-xs truncate">{m.objective}</p></td>
                    <td className="p-4 capitalize text-gray-300">{m.status.replace('_', ' ')}</td>
                    <td className="p-4 capitalize text-gray-400">{m.priority}</td>
                    <td className="p-4 w-40"><div className="h-1.5 bg-gray-800 rounded-full overflow-hidden"><div className="h-full bg-blue-500" style={{ width: `${m.progress}%` }} /></div><span className="text-xxs text-gray-500">{m.progress}%</span></td>
                    <td className="p-4 text-right"><RowActions onEdit={() => openEdit(m as unknown as Record<string, unknown>)} onDel={() => confirm(`Delete mission ${m.name}?`) && delM.mutate(m.id)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay p-4">
          <div className="glass w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-gray-800 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-800 bg-gray-950/50">
              <h3 className="text-lg font-bold text-white capitalize">{editId ? 'Edit' : 'New'} {tab.slice(0, -1)}</h3>
            </div>
            <form onSubmit={submit} className="p-6 space-y-4">
              {err && <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{err}</div>}
              <div className="grid grid-cols-2 gap-4">
                {tab === 'units' && <>
                  <F l="Callsign"><input required className="inp" value={String(form.callsign ?? '')} onChange={str('callsign')} placeholder="STEEL-1" /></F>
                  <F l="Name"><input className="inp" value={String(form.name ?? '')} onChange={str('name')} placeholder="1st Armored Coy" /></F>
                  <F l="Type"><select className="inp" value={String(form.type ?? '')} onChange={str('type')}><option>infantry</option><option>armor</option><option>recon</option><option>uav</option><option>air</option><option>hq</option><option>logistics</option></select></F>
                  <F l="Domain"><select className="inp" value={String(form.domain ?? '')} onChange={str('domain')}><option>land</option><option>air</option><option>sea</option><option>cyber</option></select></F>
                  <F l="Status"><select className="inp" value={String(form.status ?? '')} onChange={str('status')}><option>active</option><option>standby</option><option>moving</option><option>engaged</option></select></F>
                  <F l="Readiness"><select className="inp" value={String(form.readiness ?? '')} onChange={str('readiness')}><option>green</option><option>amber</option><option>red</option></select></F>
                  <F l="Latitude"><input type="number" step="any" className="inp" value={Number(form.lat ?? 0)} onChange={num('lat')} /></F>
                  <F l="Longitude"><input type="number" step="any" className="inp" value={Number(form.lng ?? 0)} onChange={num('lng')} /></F>
                  <F l="Strength"><input type="number" className="inp" value={Number(form.strength ?? 0)} onChange={num('strength')} /></F>
                  <F l="Heading"><input type="number" className="inp" value={Number(form.heading ?? 0)} onChange={num('heading')} /></F>
                  <F l="Speed (km/h)"><input type="number" step="any" className="inp" value={Number(form.speed ?? 0)} onChange={num('speed')} /></F>
                </>}
                {tab === 'threats' && <>
                  <F l="Designation" span2><input required className="inp" value={String(form.designation ?? '')} onChange={str('designation')} placeholder="HOSTILE-01 (convoy)" /></F>
                  <F l="Classification"><select className="inp" value={String(form.classification ?? '')} onChange={str('classification')}><option>hostile</option><option>suspect</option><option>unknown</option></select></F>
                  <F l="Threat level"><select className="inp" value={String(form.threat_level ?? '')} onChange={str('threat_level')}><option>critical</option><option>high</option><option>medium</option><option>low</option></select></F>
                  <F l="Type"><select className="inp" value={String(form.type ?? '')} onChange={str('type')}><option>armor</option><option>infantry</option><option>uav</option><option>aircraft</option><option>artillery</option><option>convoy</option><option>unknown</option></select></F>
                  <F l="Confidence (0-1)"><input type="number" step="0.01" min="0" max="1" className="inp" value={Number(form.confidence ?? 0)} onChange={num('confidence')} /></F>
                  <F l="Latitude"><input type="number" step="any" className="inp" value={Number(form.lat ?? 0)} onChange={num('lat')} /></F>
                  <F l="Longitude"><input type="number" step="any" className="inp" value={Number(form.lng ?? 0)} onChange={num('lng')} /></F>
                  <F l="Heading"><input type="number" className="inp" value={Number(form.heading ?? 0)} onChange={num('heading')} /></F>
                  <F l="Speed (km/h)"><input type="number" step="any" className="inp" value={Number(form.speed ?? 0)} onChange={num('speed')} /></F>
                  <F l="Linked entity id" span2><input className="inp" value={String(form.entity_id ?? '')} onChange={str('entity_id')} placeholder="ent-009 (optional)" /></F>
                </>}
                {tab === 'missions' && <>
                  <F l="Name" span2><input required className="inp" value={String(form.name ?? '')} onChange={str('name')} placeholder="OP SILK SENTINEL" /></F>
                  <F l="Objective" span2><textarea className="inp" rows={2} value={String(form.objective ?? '')} onChange={str('objective')} /></F>
                  <F l="Status"><select className="inp" value={String(form.status ?? '')} onChange={str('status')}><option>planning</option><option>active</option><option>on_hold</option><option>complete</option></select></F>
                  <F l="Priority"><select className="inp" value={String(form.priority ?? '')} onChange={str('priority')}><option>flash</option><option>immediate</option><option>priority</option><option>routine</option></select></F>
                  <F l="Area" span2><input className="inp" value={String(form.area ?? '')} onChange={str('area')} placeholder="Fergana Valley" /></F>
                  <F l="Progress (%)"><input type="number" min="0" max="100" className="inp" value={Number(form.progress ?? 0)} onChange={num('progress')} /></F>
                  <F l="Assigned units (comma)"><input className="inp" value={(Array.isArray(form.assigned_units) ? (form.assigned_units as string[]).join(', ') : '')} onChange={(e) => set('assigned_units', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))} placeholder="u-001, u-002" /></F>
                </>}
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                <button type="button" onClick={close} className="px-4 py-2 border border-gray-800 rounded-xl text-sm font-semibold text-gray-400 hover:bg-gray-800/30">Cancel</button>
                <button type="submit" className="btn-primary px-4 py-2 rounded-xl text-sm font-semibold text-white">{editId ? 'Save' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const RowActions: React.FC<{ onEdit: () => void; onDel: () => void }> = ({ onEdit, onDel }) => (
  <div className="flex items-center justify-end gap-2">
    <button onClick={onEdit} title="Edit" className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20"><Edit2 size={14} /></button>
    <button onClick={onDel} title="Delete" className="p-1.5 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20"><Trash size={14} /></button>
  </div>
);

const F: React.FC<{ l: string; span2?: boolean; children: React.ReactNode }> = ({ l, span2, children }) => (
  <div className={span2 ? 'col-span-2' : ''}>
    <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">{l}</label>
    {children}
  </div>
);
