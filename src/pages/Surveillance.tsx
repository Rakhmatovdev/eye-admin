import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash, Cctv, Plane, Radar, RadioTower, Video, ScanFace } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { sensorsApi, type Sensor, type SensorInput } from '../api/sensors';

const EMPTY: SensorInput = {
  name: '', type: 'camera', status: 'online', lat: 41.31, lng: 69.28,
  area: '', coverage_radius: 200, resolution: '1080p', classification: 'confidential',
};

const TYPE_ICON: Record<string, LucideIcon> = {
  camera: Cctv, drone: Plane, radar: Radar, sigint: RadioTower,
};
const STATUS_COLOR: Record<string, string> = {
  online: 'text-green-400', degraded: 'text-amber-400', offline: 'text-red-400',
};

export const Surveillance: React.FC = () => {
  const qc = useQueryClient();
  const { data: sensors = [] } = useQuery({ queryKey: ['adm-sensors'], queryFn: sensorsApi.list });
  const { data: stats } = useQuery({ queryKey: ['adm-sensor-stats'], queryFn: sensorsApi.stats });
  const { data: detections = [] } = useQuery({ queryKey: ['adm-detections'], queryFn: sensorsApi.detections });

  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Sensor | null>(null);
  const [form, setForm] = useState<SensorInput>(EMPTY);
  const [err, setErr] = useState('');

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['adm-sensors'] });
    qc.invalidateQueries({ queryKey: ['adm-sensor-stats'] });
  };
  const createM = useMutation({ mutationFn: (i: SensorInput) => sensorsApi.create(i), onSuccess: () => { invalidate(); close(); }, onError: () => setErr('Create failed — admin role required.') });
  const updateM = useMutation({ mutationFn: (v: { id: string; i: SensorInput }) => sensorsApi.update(v.id, v.i), onSuccess: () => { invalidate(); close(); }, onError: () => setErr('Update failed.') });
  const deleteM = useMutation({ mutationFn: (id: string) => sensorsApi.remove(id), onSuccess: invalidate });

  const open = (s?: Sensor) => {
    setErr('');
    if (s) { setEditing(s); setForm({ name: s.name, type: s.type, status: s.status, lat: s.lat, lng: s.lng, area: s.area, coverage_radius: s.coverage_radius, resolution: s.resolution, classification: s.classification }); }
    else { setEditing(null); setForm(EMPTY); }
    setModal(true);
  };
  const close = () => { setModal(false); setEditing(null); };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) updateM.mutate({ id: editing.id, i: form });
    else createM.mutate(form);
  };
  const del = (s: Sensor) => { if (confirm(`Decommission sensor "${s.name}"?`)) deleteM.mutate(s.id); };

  const tiles = stats ? [
    { label: 'Sensors', value: stats.total, color: 'text-blue-400' },
    { label: 'Online', value: stats.online, color: 'text-green-400' },
    { label: 'Degraded', value: stats.degraded, color: 'text-amber-400' },
    { label: 'Offline', value: stats.offline, color: 'text-red-400' },
    { label: 'Hits 24h', value: stats.detections_24h, color: 'text-violet-400' },
    { label: 'Identified', value: stats.identified_hits, color: 'text-fuchsia-400' },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Surveillance Network</h1>
          <p className="text-gray-400 text-sm mt-1">Provision and manage the sensor/camera collection grid and review detections.</p>
        </div>
        <button onClick={() => open()} className="btn-primary px-4 py-2.5 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2">
          <Plus size={16} /> <span>Deploy Sensor</span>
        </button>
      </div>

      {/* stat tiles */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {tiles.map((t) => (
          <div key={t.label} className="card rounded-2xl p-4 border border-gray-800">
            <p className="text-xs text-gray-500 uppercase tracking-wider">{t.label}</p>
            <p className={`text-2xl font-bold mt-1 ${t.color}`}>{t.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* sensor table */}
        <div className="xl:col-span-2 glass rounded-2xl border border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-950/40 text-gray-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="p-4">Sensor</th><th className="p-4">Type</th><th className="p-4">Status</th>
                  <th className="p-4">Area</th><th className="p-4">Coverage</th><th className="p-4 text-right">Manage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {sensors.map((s) => {
                  const Icon = TYPE_ICON[s.type] || Video;
                  return (
                    <tr key={s.id} className="table-row-hover text-sm">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-900/30 text-blue-400 flex items-center justify-center border border-blue-500/20"><Icon size={16} /></div>
                          <div><p className="font-semibold text-gray-200">{s.name}</p><p className="text-xs text-gray-500">{s.resolution} · {s.classification}</p></div>
                        </div>
                      </td>
                      <td className="p-4 capitalize text-gray-300">{s.type}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${STATUS_COLOR[s.status] || 'text-gray-400'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${s.status === 'online' ? 'bg-green-500 live-dot' : s.status === 'degraded' ? 'bg-amber-500' : 'bg-red-500'}`} />{s.status}
                        </span>
                      </td>
                      <td className="p-4 text-gray-400">{s.area}</td>
                      <td className="p-4 text-gray-400">{(s.coverage_radius / 1000).toFixed(s.coverage_radius >= 1000 ? 1 : 2)} km</td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => open(s)} title="Edit" className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20"><Edit2 size={14} /></button>
                          <button onClick={() => del(s)} title="Decommission" className="p-1.5 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20"><Trash size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {sensors.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-gray-600 text-sm">No sensors deployed.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {/* detections */}
        <div className="glass rounded-2xl border border-gray-800 p-4">
          <h2 className="text-sm font-bold text-gray-200 flex items-center gap-2 mb-3"><ScanFace size={15} className="text-fuchsia-400" /> Recent Detections</h2>
          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
            {detections.map((d) => (
              <div key={d.id} className="bg-gray-950/40 border border-gray-800/60 rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-200">{d.entity_name || 'Unidentified'}</span>
                  <span className={`text-xxs font-bold px-1.5 py-0.5 rounded ${d.confidence >= 0.85 ? 'text-green-400' : d.confidence >= 0.7 ? 'text-amber-400' : 'text-gray-400'}`}>{(d.confidence * 100).toFixed(0)}%</span>
                </div>
                <p className="text-xxs text-gray-500 mt-0.5">{d.kind.replace('_', ' ')} · {d.sensor_name}</p>
              </div>
            ))}
            {detections.length === 0 && <p className="text-xs text-gray-600 text-center py-6">No detections.</p>}
          </div>
        </div>
      </div>

      {/* create/edit modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay p-4">
          <div className="glass w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-gray-800">
            <div className="p-6 border-b border-gray-800 bg-gray-950/50">
              <h3 className="text-lg font-bold text-white">{editing ? 'Edit Sensor' : 'Deploy New Sensor'}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{editing ? editing.id : 'Register a collection asset on the grid.'}</p>
            </div>
            <form onSubmit={submit} className="p-6 space-y-4">
              {err && <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{err}</div>}
              <div className="grid grid-cols-2 gap-4">
                <Field label="Name" span2><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="inp" placeholder="e.g. North Gate Cam" /></Field>
                <Field label="Type"><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="inp"><option value="camera">Camera</option><option value="drone">Drone / UAV</option><option value="radar">Radar</option><option value="sigint">SIGINT</option><option value="thermal">Thermal</option></select></Field>
                <Field label="Status"><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="inp"><option value="online">Online</option><option value="degraded">Degraded</option><option value="offline">Offline</option></select></Field>
                <Field label="Area" span2><input value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} className="inp" placeholder="e.g. Tashkent — Yunusabad" /></Field>
                <Field label="Latitude"><input type="number" step="any" value={form.lat} onChange={(e) => setForm({ ...form, lat: parseFloat(e.target.value) })} className="inp" /></Field>
                <Field label="Longitude"><input type="number" step="any" value={form.lng} onChange={(e) => setForm({ ...form, lng: parseFloat(e.target.value) })} className="inp" /></Field>
                <Field label="Coverage (m)"><input type="number" value={form.coverage_radius} onChange={(e) => setForm({ ...form, coverage_radius: parseInt(e.target.value || '0') })} className="inp" /></Field>
                <Field label="Resolution"><input value={form.resolution} onChange={(e) => setForm({ ...form, resolution: e.target.value })} className="inp" placeholder="4K / EO-IR" /></Field>
                <Field label="Classification" span2><select value={form.classification} onChange={(e) => setForm({ ...form, classification: e.target.value })} className="inp"><option value="internal">Internal</option><option value="confidential">Confidential</option><option value="secret">Secret</option></select></Field>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                <button type="button" onClick={close} className="px-4 py-2 border border-gray-800 rounded-xl text-sm font-semibold text-gray-400 hover:bg-gray-800/30">Cancel</button>
                <button type="submit" disabled={createM.isPending || updateM.isPending} className="btn-primary px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50">{editing ? 'Save Changes' : 'Deploy Sensor'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const Field: React.FC<{ label: string; span2?: boolean; children: React.ReactNode }> = ({ label, span2, children }) => (
  <div className={span2 ? 'col-span-2' : ''}>
    <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">{label}</label>
    {children}
  </div>
);
