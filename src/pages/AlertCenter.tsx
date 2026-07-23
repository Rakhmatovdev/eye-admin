import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  Bell, Check, CheckCheck, Plus, Edit2, Trash, ChevronLeft, ChevronRight,
  ListChecks, ShieldAlert, Eye,
} from 'lucide-react';
import {
  alertsApi, watchlistApi,
  type Alert, type AlertSeverity, type AlertRule, type AlertRuleType, type AlertRuleInput,
  type WatchlistEntry, type WatchlistInput,
} from '../api/alerts';
import { useT } from '../hooks/useT';

function apiErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.error?.message || err.message || fallback;
  }
  return fallback;
}

const SEVERITIES: AlertSeverity[] = ['critical', 'high', 'medium', 'low'];
const SEVERITY_COLOR: Record<AlertSeverity, string> = {
  critical: 'bg-red-500/10 text-red-500 border-red-500/20',
  high: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  medium: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  low: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
};
const RULE_TYPES: AlertRuleType[] = ['watchlist_detection', 'threat_class', 'risk_threshold'];
const CLASS_OPTIONS = ['hostile', 'suspect', 'unknown', 'friendly'];

function SeverityBadge({ severity }: { severity: AlertSeverity }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xxs font-bold uppercase border ${SEVERITY_COLOR[severity]}`}>
      {severity}
    </span>
  );
}

type Tab = 'alerts' | 'rules' | 'watchlist';

export const AlertCenter: React.FC = () => {
  const t = useT();
  const [tab, setTab] = useState<Tab>('alerts');

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'alerts', label: t('alertCenter.tabs.alerts'), icon: Bell },
    { key: 'rules', label: t('alertCenter.tabs.rules'), icon: ListChecks },
    { key: 'watchlist', label: t('alertCenter.tabs.watchlist'), icon: Eye },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <ShieldAlert size={22} className="text-red-400" /> {t('alertCenter.title')}
        </h1>
        <p className="text-gray-400 text-sm mt-1">{t('alertCenter.subtitle')}</p>
      </div>

      <div className="flex items-center gap-1.5 border-b border-gray-800">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            data-testid={`alert-center-tab-${key}`}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all -mb-px ${
              tab === key ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {tab === 'alerts' && <AlertsTab />}
      {tab === 'rules' && <RulesTab />}
      {tab === 'watchlist' && <WatchlistTab />}
    </div>
  );
};

// --- Alerts tab --------------------------------------------------------

const AlertsTab: React.FC = () => {
  const t = useT();
  const qc = useQueryClient();
  const [severity, setSeverity] = useState<AlertSeverity | ''>('');
  const [acked, setAcked] = useState<'' | 'true' | 'false'>('');
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading } = useQuery({
    queryKey: ['ac-alerts', severity, acked, page],
    queryFn: () =>
      alertsApi.list({
        severity: severity || undefined,
        acknowledged: acked === '' ? undefined : acked === 'true',
        page,
        limit,
      }),
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const invalidate = () => qc.invalidateQueries({ queryKey: ['ac-alerts'] });
  const ackM = useMutation({ mutationFn: (id: string) => alertsApi.ack(id), onSuccess: invalidate });

  const [ackingAll, setAckingAll] = useState(false);
  const ackAllVisible = async () => {
    const targets = items.filter((a) => !a.acknowledged);
    if (targets.length === 0) return;
    setAckingAll(true);
    try {
      await Promise.all(targets.map((a) => alertsApi.ack(a.id)));
      invalidate();
    } finally {
      setAckingAll(false);
    }
  };

  const changeFilter = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <select value={severity} onChange={(e) => changeFilter(setSeverity)(e.target.value as AlertSeverity | '')} className="inp !w-auto text-sm">
          <option value="">{t('alertCenter.filters.allSeverities')}</option>
          {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={acked} onChange={(e) => changeFilter(setAcked)(e.target.value as '' | 'true' | 'false')} className="inp !w-auto text-sm">
          <option value="">{t('alertCenter.filters.allStatuses')}</option>
          <option value="false">{t('alertCenter.unacked')}</option>
          <option value="true">{t('alertCenter.acked')}</option>
        </select>
        <div className="flex-1" />
        <button
          onClick={ackAllVisible}
          disabled={ackingAll || items.every((a) => a.acknowledged)}
          className="btn-primary px-3.5 py-2 rounded-xl text-xs font-semibold text-white flex items-center gap-2 disabled:opacity-40"
        >
          <CheckCheck size={14} /> {t('alertCenter.ackAllVisible')}
        </button>
      </div>

      <div className="glass rounded-2xl border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-950/40 text-gray-400 text-xs font-semibold uppercase tracking-wider">
                <th className="p-4">{t('alertCenter.table.severity')}</th>
                <th className="p-4">{t('alertCenter.table.title')}</th>
                <th className="p-4">{t('alertCenter.table.rule')}</th>
                <th className="p-4">{t('alertCenter.table.reference')}</th>
                <th className="p-4">{t('alertCenter.table.created')}</th>
                <th className="p-4">{t('alertCenter.table.status')}</th>
                <th className="p-4 text-right">{t('alertCenter.table.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {items.map((a: Alert) => (
                <tr key={a.id} className="table-row-hover text-sm">
                  <td className="p-4"><SeverityBadge severity={a.severity} /></td>
                  <td className="p-4">
                    <p className="font-semibold text-gray-200">{a.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 max-w-md truncate">{a.message}</p>
                  </td>
                  <td className="p-4 text-gray-400">{a.rule_name}</td>
                  <td className="p-4 text-gray-500 text-xs font-mono">
                    {a.entity_id && <div>ent: {a.entity_id}</div>}
                    {a.threat_id && <div>threat: {a.threat_id}</div>}
                    {a.detection_id && <div>det: {a.detection_id}</div>}
                  </td>
                  <td className="p-4 text-gray-400 text-xs">{new Date(a.created_at).toLocaleString()}</td>
                  <td className="p-4">
                    {a.acknowledged ? (
                      <div>
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-400"><Check size={12} /> {t('alertCenter.acked')}</span>
                        {a.ack_by && <p className="text-xxs text-gray-500 mt-0.5">{t('alertCenter.ackedBy')} {a.ack_by}</p>}
                      </div>
                    ) : (
                      <span className="text-xs font-semibold text-amber-400">{t('alertCenter.unacked')}</span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => ackM.mutate(a.id)}
                      disabled={a.acknowledged || ackM.isPending}
                      className="px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 text-xs font-semibold disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      {t('alertCenter.ackButton')}
                    </button>
                  </td>
                </tr>
              ))}
              {!isLoading && items.length === 0 && (
                <tr><td colSpan={7} className="p-8 text-center text-gray-600 text-sm">{t('alertCenter.noAlerts')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800 text-xs text-gray-400">
          <span>{t('alertCenter.pagination.total')}: {total}</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="p-1.5 rounded-lg border border-gray-800 hover:bg-gray-800/40 disabled:opacity-30">
              <ChevronLeft size={14} />
            </button>
            <span>{t('alertCenter.pagination.page')} {page} / {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="p-1.5 rounded-lg border border-gray-800 hover:bg-gray-800/40 disabled:opacity-30">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Rules tab -----------------------------------------------------------

const EMPTY_RULE: AlertRuleInput = { name: '', type: 'watchlist_detection', enabled: true, severity: 'medium', params: {} };

const RulesTab: React.FC = () => {
  const t = useT();
  const qc = useQueryClient();
  const { data: rules = [] } = useQuery({ queryKey: ['ac-rules'], queryFn: alertsApi.rules.list });

  const ruleTypeLabel: Record<AlertRuleType, string> = {
    watchlist_detection: t('alertCenter.rules.type.watchlistDetection'),
    threat_class: t('alertCenter.rules.type.threatClass'),
    risk_threshold: t('alertCenter.rules.type.riskThreshold'),
  };
  const classLabel: Record<string, string> = {
    hostile: t('alertCenter.rules.class.hostile'),
    suspect: t('alertCenter.rules.class.suspect'),
    unknown: t('alertCenter.rules.class.unknown'),
    friendly: t('alertCenter.rules.class.friendly'),
  };

  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<AlertRule | null>(null);
  const [form, setForm] = useState<AlertRuleInput>(EMPTY_RULE);
  const [err, setErr] = useState('');

  const invalidate = () => qc.invalidateQueries({ queryKey: ['ac-rules'] });
  const createM = useMutation({ mutationFn: (i: AlertRuleInput) => alertsApi.rules.create(i), onSuccess: () => { invalidate(); close(); }, onError: (e) => setErr(apiErrorMessage(e, t('alertCenter.rules.createFailed'))) });
  const updateM = useMutation({ mutationFn: (v: { id: string; i: AlertRuleInput }) => alertsApi.rules.update(v.id, v.i), onSuccess: () => { invalidate(); close(); }, onError: (e) => setErr(apiErrorMessage(e, t('alertCenter.rules.updateFailed'))) });
  const deleteM = useMutation({ mutationFn: (id: string) => alertsApi.rules.remove(id), onSuccess: invalidate });
  const toggleM = useMutation({ mutationFn: (r: AlertRule) => alertsApi.rules.update(r.id, { name: r.name, type: r.type, enabled: !r.enabled, severity: r.severity, params: r.params }), onSuccess: invalidate });

  const open = (r?: AlertRule) => {
    setErr('');
    if (r) { setEditing(r); setForm({ name: r.name, type: r.type, enabled: r.enabled, severity: r.severity, params: r.params }); }
    else { setEditing(null); setForm(EMPTY_RULE); }
    setModal(true);
  };
  const close = () => { setModal(false); setEditing(null); };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) updateM.mutate({ id: editing.id, i: form });
    else createM.mutate(form);
  };
  const del = (r: AlertRule) => { if (confirm(`${t('alertCenter.rules.confirmDelete')} "${r.name}"?`)) deleteM.mutate(r.id); };

  const setType = (type: AlertRuleType) => {
    const params: AlertRuleInput['params'] = type === 'threat_class' ? { classes: [] } : type === 'risk_threshold' ? { min_score: 50 } : {};
    setForm({ ...form, type, params });
  };

  const toggleClass = (cls: string) => {
    const current = form.params.classes ?? [];
    const next = current.includes(cls) ? current.filter((c) => c !== cls) : [...current, cls];
    setForm({ ...form, params: { classes: next } });
  };

  const paramsSummary = (r: AlertRule): string => {
    if (r.type === 'threat_class') return (r.params.classes ?? []).join(', ') || '—';
    if (r.type === 'risk_threshold') return `min_score ${r.params.min_score ?? '—'}`;
    return '—';
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => open()} className="btn-primary px-4 py-2.5 rounded-xl font-semibold text-sm text-white flex items-center gap-2">
          <Plus size={16} /> {t('alertCenter.rules.newRule')}
        </button>
      </div>

      <div className="glass rounded-2xl border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-950/40 text-gray-400 text-xs font-semibold uppercase tracking-wider">
                <th className="p-4">{t('alertCenter.rules.table.name')}</th>
                <th className="p-4">{t('alertCenter.rules.table.type')}</th>
                <th className="p-4">{t('alertCenter.rules.table.severity')}</th>
                <th className="p-4">{t('alertCenter.rules.table.params')}</th>
                <th className="p-4">{t('alertCenter.rules.table.enabled')}</th>
                <th className="p-4 text-right">{t('alertCenter.rules.table.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {rules.map((r) => (
                <tr key={r.id} className="table-row-hover text-sm">
                  <td className="p-4 font-semibold text-gray-200">{r.name}</td>
                  <td className="p-4 text-gray-400">{ruleTypeLabel[r.type]}</td>
                  <td className="p-4"><SeverityBadge severity={r.severity} /></td>
                  <td className="p-4 text-gray-500 text-xs font-mono">{paramsSummary(r)}</td>
                  <td className="p-4">
                    <button
                      onClick={() => toggleM.mutate(r)}
                      disabled={toggleM.isPending}
                      className={`relative w-10 h-5 rounded-full transition-colors ${r.enabled ? 'bg-green-500/70' : 'bg-gray-700'}`}
                      title={r.enabled ? t('common.disable') : t('common.enable')}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${r.enabled ? 'left-5' : 'left-0.5'}`} />
                    </button>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => open(r)} title={t('common.edit')} className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20"><Edit2 size={14} /></button>
                      <button onClick={() => del(r)} title={t('common.delete')} className="p-1.5 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20"><Trash size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {rules.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-gray-600 text-sm">{t('alertCenter.rules.noRules')}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay p-4">
          <div className="glass w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-gray-800">
            <div className="p-6 border-b border-gray-800 bg-gray-950/50">
              <h3 className="text-lg font-bold text-white">{editing ? t('alertCenter.rules.editRule') : t('alertCenter.rules.newRule')}</h3>
            </div>
            <form onSubmit={submit} className="p-6 space-y-4">
              {err && <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{err}</div>}
              <div className="grid grid-cols-2 gap-4">
                <Field label={t('alertCenter.rules.fieldName')} span2>
                  <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="inp" />
                </Field>
                <Field label={t('alertCenter.rules.fieldType')}>
                  <select value={form.type} onChange={(e) => setType(e.target.value as AlertRuleType)} className="inp">
                    {RULE_TYPES.map((rt) => <option key={rt} value={rt}>{ruleTypeLabel[rt]}</option>)}
                  </select>
                </Field>
                <Field label={t('alertCenter.rules.fieldSeverity')}>
                  <select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value as AlertSeverity })} className="inp">
                    {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
                <Field label={t('alertCenter.rules.fieldEnabled')} span2>
                  <label className="flex items-center gap-2 text-sm text-gray-300">
                    <input type="checkbox" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} />
                    {form.enabled ? t('common.enable') : t('common.disable')}
                  </label>
                </Field>

                <div className="col-span-2 border-t border-gray-800 pt-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase mb-2">{t('alertCenter.rules.paramsLabel')}</p>
                  {form.type === 'watchlist_detection' && (
                    <p className="text-xs text-gray-500 bg-gray-950/40 border border-gray-800 rounded-lg px-3 py-2">{t('alertCenter.rules.paramsNote')}</p>
                  )}
                  {form.type === 'threat_class' && (
                    <div className="grid grid-cols-2 gap-2">
                      {CLASS_OPTIONS.map((cls) => (
                        <label key={cls} className="flex items-center gap-2 text-sm text-gray-300 capitalize">
                          <input type="checkbox" checked={(form.params.classes ?? []).includes(cls)} onChange={() => toggleClass(cls)} />
                          {classLabel[cls]}
                        </label>
                      ))}
                    </div>
                  )}
                  {form.type === 'risk_threshold' && (
                    <Field label={t('alertCenter.rules.minScoreLabel')}>
                      <input
                        type="number" min={0} max={100}
                        value={form.params.min_score ?? 0}
                        onChange={(e) => setForm({ ...form, params: { min_score: parseInt(e.target.value || '0') } })}
                        className="inp"
                      />
                    </Field>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                <button type="button" onClick={close} className="px-4 py-2 border border-gray-800 rounded-xl text-sm font-semibold text-gray-400 hover:bg-gray-800/30">{t('common.cancel')}</button>
                <button type="submit" disabled={createM.isPending || updateM.isPending} className="btn-primary px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50">{editing ? t('common.save') : t('alertCenter.rules.newRule')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Watchlist tab ---------------------------------------------------------

const EMPTY_WL: WatchlistInput = { entity_id: '', note: '' };

const WatchlistTab: React.FC = () => {
  const t = useT();
  const qc = useQueryClient();
  const { data: entries = [] } = useQuery({ queryKey: ['ac-watchlist'], queryFn: watchlistApi.list });

  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<WatchlistInput>(EMPTY_WL);
  const [err, setErr] = useState('');

  const invalidate = () => qc.invalidateQueries({ queryKey: ['ac-watchlist'] });
  const addM = useMutation({
    mutationFn: (i: WatchlistInput) => watchlistApi.add(i),
    onSuccess: () => { invalidate(); setModal(false); setForm(EMPTY_WL); },
    onError: (e) => {
      if (axios.isAxiosError(e) && e.response?.status === 409) setErr(t('alertCenter.watchlist.duplicateError'));
      else setErr(apiErrorMessage(e, t('alertCenter.watchlist.addFailed')));
    },
  });
  const removeM = useMutation({ mutationFn: (id: string) => watchlistApi.remove(id), onSuccess: invalidate });

  const open = () => { setErr(''); setForm(EMPTY_WL); setModal(true); };
  const submit = (e: React.FormEvent) => { e.preventDefault(); addM.mutate(form); };
  const del = (w: WatchlistEntry) => { if (confirm(`${t('alertCenter.watchlist.confirmRemove')} "${w.entity_label || w.entity_id}"?`)) removeM.mutate(w.id); };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={open} className="btn-primary px-4 py-2.5 rounded-xl font-semibold text-sm text-white flex items-center gap-2">
          <Plus size={16} /> {t('alertCenter.watchlist.addEntry')}
        </button>
      </div>

      <div className="glass rounded-2xl border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-950/40 text-gray-400 text-xs font-semibold uppercase tracking-wider">
                <th className="p-4">{t('alertCenter.watchlist.table.entity')}</th>
                <th className="p-4">{t('alertCenter.watchlist.table.note')}</th>
                <th className="p-4">{t('alertCenter.watchlist.table.addedBy')}</th>
                <th className="p-4">{t('alertCenter.watchlist.table.added')}</th>
                <th className="p-4 text-right">{t('alertCenter.watchlist.table.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {entries.map((w) => (
                <tr key={w.id} className="table-row-hover text-sm">
                  <td className="p-4">
                    <p className="font-semibold text-gray-200">{w.entity_label || w.entity_id}</p>
                    <p className="text-xs text-gray-500 font-mono">{w.entity_id}</p>
                  </td>
                  <td className="p-4 text-gray-400 max-w-sm truncate">{w.note || '—'}</td>
                  <td className="p-4 text-gray-400">{w.created_by}</td>
                  <td className="p-4 text-gray-400 text-xs">{new Date(w.created_at).toLocaleString()}</td>
                  <td className="p-4 text-right">
                    <button onClick={() => del(w)} title={t('common.delete')} className="p-1.5 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20"><Trash size={14} /></button>
                  </td>
                </tr>
              ))}
              {entries.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-gray-600 text-sm">{t('alertCenter.watchlist.noEntries')}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay p-4">
          <div className="glass w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-gray-800">
            <div className="p-6 border-b border-gray-800 bg-gray-950/50">
              <h3 className="text-lg font-bold text-white">{t('alertCenter.watchlist.addEntry')}</h3>
            </div>
            <form onSubmit={submit} className="p-6 space-y-4">
              {err && <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{err}</div>}
              <Field label={t('alertCenter.watchlist.fieldEntityId')}>
                <input required value={form.entity_id} onChange={(e) => setForm({ ...form, entity_id: e.target.value })} className="inp" placeholder={t('alertCenter.watchlist.entityIdPlaceholder')} />
              </Field>
              <Field label={t('alertCenter.watchlist.fieldNote')}>
                <textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className="inp" rows={3} placeholder={t('alertCenter.watchlist.notePlaceholder')} />
              </Field>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                <button type="button" onClick={() => setModal(false)} className="px-4 py-2 border border-gray-800 rounded-xl text-sm font-semibold text-gray-400 hover:bg-gray-800/30">{t('common.cancel')}</button>
                <button type="submit" disabled={addM.isPending} className="btn-primary px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50">{t('alertCenter.watchlist.addEntry')}</button>
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
