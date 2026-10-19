import { useState, useRef } from 'react';
import {
  Settings, Database, UploadCloud, Users, SlidersHorizontal, Check, Radio,
  FileSpreadsheet, ShieldCheck, X, UserPlus, Download, AlertTriangle, Save,
} from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { useWorkspaceData, type DataMode, type WorkspaceRole, ROLE_LABELS } from '@/lib/workspaceData';
import { downloadFile, toCsv } from '@/lib/exportUtils';

type Tab = 'data-mode' | 'baselines' | 'import' | 'team';

const MODES: { key: DataMode; label: string; description: string; icon: typeof Database }[] = [
  { key: 'demo', label: 'Demo Data', description: 'Fully populated sample dataset — the persistent default. Best for exploring every module.', icon: Database },
  { key: 'custom', label: 'Custom Data', description: 'Manual baseline metrics, unit prices, and energy tariffs you enter below.', icon: SlidersHorizontal },
  { key: 'iot', label: 'IoT / Smart Meter', description: 'Simulated real-time streaming feed. Readings refresh automatically while connected.', icon: Radio },
];

const CSV_TEMPLATES: Record<string, { file: string; headers: string[]; sample: string[][] }> = {
  inventory: {
    file: 'inventory-template.csv',
    headers: ['name', 'category', 'unit', 'stock', 'reorder_point', 'daily_usage', 'unit_cost', 'supplier'],
    sample: [['Steel Rods 8mm', 'Raw Material', 'kg', '500', '150', '25', '62', 'MetalCorp']],
  },
  suppliers: {
    file: 'suppliers-template.csv',
    headers: ['name', 'category', 'on_time', 'quality', 'price', 'orders', 'payment_terms'],
    sample: [['QuickSteel Ltd', 'Raw Materials', '91', '88', '810', '45', 'Net 30']],
  },
  energy: {
    file: 'energy-template.csv',
    headers: ['hour', 'consumption'],
    sample: [['0', '280'], ['9', '610'], ['17', '540']],
  },
};

interface ImportState {
  kind: keyof typeof CSV_TEMPLATES | null;
  message: string | null;
  error: string | null;
}

export function SettingsPage() {
  const {
    data, can, setMode, setIotConnected, draftBaselines, setDraftBaselines, saveBaselines,
    importCsv, logAction, team, inviteMember, updateMemberRole, showToast,
  } = useWorkspaceData();
  const [tab, setTab] = useState<Tab>('data-mode');
  const [importState, setImportState] = useState<ImportState>({ kind: null, message: null, error: null });
  const [dragActive, setDragActive] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', role: 'operator' as WorkspaceRole });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canManage = can('settings.manage');

  const handleFile = (file: File, kind: keyof typeof CSV_TEMPLATES) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = importCsv(kind as 'inventory' | 'suppliers' | 'energy', String(reader.result));
      if (result.error) {
        setImportState({ kind, message: null, error: result.error });
        logAction({ action: `Imported ${kind} CSV — failed validation`, resource: 'Settings', resourceId: kind, status: 'failed' });
      } else {
        setImportState({ kind, message: `Imported ${result.count} row${result.count === 1 ? '' : 's'} — all module KPIs recalculated.`, error: null });
        logAction({ action: `Imported ${kind} CSV`, resource: 'Settings', resourceId: `${kind} (${result.count} rows)`, status: 'success' });
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (event: React.DragEvent, kind: keyof typeof CSV_TEMPLATES) => {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (file) handleFile(file, kind);
  };

  const tabs: { key: Tab; label: string; icon: typeof Database; permission?: boolean }[] = [
    { key: 'data-mode', label: 'Data Mode', icon: Database },
    { key: 'baselines', label: 'Manual Baselines', icon: SlidersHorizontal },
    { key: 'import', label: 'CSV Import', icon: UploadCloud },
    { key: 'team', label: 'Team & Permissions', icon: Users },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 animate-fade-in">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
          <Settings className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-display text-xl font-bold text-ink-800">Factory Settings & Data Input</h1>
          <p className="text-sm text-ink-400">Choose your data source, enter baseline metrics, and manage team access</p>
        </div>
      </div>

      {!canManage && (
        <div className="flex items-center gap-3 rounded-xl border border-warning-500/40 bg-warning-50 px-5 py-4">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 text-warning-300" />
          <p className="text-sm text-warning-300">You have view-only access to settings. Contact an Owner or Admin to make changes.</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-xl border border-ink-200 bg-ink-100 p-1.5">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`flex flex-shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                active ? 'bg-primary-600 text-white shadow-sm' : 'text-ink-500 hover:bg-ink-50 hover:text-ink-700'
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ── Data Mode ─────────────────────────────────────────────────── */}
      {tab === 'data-mode' && (
        <Card>
          <CardHeader title="Data Mode Switch" subtitle="Choose where module data comes from — Demo is the default" icon={<Database className="h-5 w-5" />} />
          <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-3">
            {MODES.map((mode) => {
              const Icon = mode.icon;
              const active = data.mode === mode.key;
              const disabled = mode.key === 'iot' ? false : !canManage;
              return (
                <button
                  key={mode.key}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    if (mode.key === 'iot') { setIotConnected(!data.iotConnected); return; }
                    setMode(mode.key);
                    logAction({ action: `Switched data mode to ${mode.label}`, resource: 'Settings', resourceId: mode.key, status: 'success' });
                  }}
                  className={`relative rounded-2xl border-2 p-5 text-left transition ${
                    active ? 'border-primary-500 bg-primary-50/50' : 'border-ink-200 bg-ink-100 hover:border-ink-300'
                  } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                >
                  {active && (
                    <span className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-primary-600 text-white">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                  )}
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${active ? 'bg-primary-100 text-primary-600' : 'bg-ink-100 text-ink-500'}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-3 font-display text-sm font-bold text-ink-800">{mode.label}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-ink-400">{mode.description}</p>
                  {mode.key === 'demo' && <span className="mt-2 inline-block rounded-full bg-success-50 px-2 py-0.5 text-xs font-medium text-success-300">Active Default</span>}
                  {mode.key === 'iot' && data.iotConnected && data.mode !== 'iot' && (
                    <span className="mt-2 inline-block rounded-full bg-danger-50 px-2 py-0.5 text-xs font-medium text-danger-300">Feed active — click to disconnect</span>
                  )}
                  {mode.key === 'iot' && !data.iotConnected && (
                    <span className="mt-2 inline-block rounded-full bg-ink-100 px-2 py-0.5 text-xs font-medium text-ink-500">Click to connect simulated feed</span>
                  )}
                </button>
              );
            })}
          </div>
          {data.mode === 'iot' && (
            <div className="border-t border-ink-100 px-5 py-4">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success-400 opacity-75" /><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success-500" /></span>
                <p className="text-sm text-ink-600">Simulated smart-meter feed connected — energy readings refresh every few seconds.</p>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* ── Manual Baselines ──────────────────────────────────────────── */}
      {tab === 'baselines' && (
        <Card>
          <CardHeader
            title="Custom Baseline Metrics"
            subtitle="Edit freely, then press Save — KPIs recalculate across all modules"
            icon={<SlidersHorizontal className="h-5 w-5" />}
            demo={data.mode === 'demo'}
          />
          <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2">
            {([
              { key: 'energyRatePerKwh', label: 'Energy Tariff (₹/kWh)', min: 1, max: 20, step: 0.1, hint: 'Blended average rate used across energy modules' },
              { key: 'gridEmissionFactor', label: 'Grid Emission Factor (kg CO₂/kWh)', min: 0.1, max: 1.5, step: 0.01, hint: 'Use your regional grid factor for accurate carbon estimates' },
              { key: 'monthlyProductionUnits', label: 'Monthly Production (units)', min: 100, max: 100000, step: 100, hint: 'Revenue = production × selling price' },
              { key: 'avgSellingPriceInr', label: 'Average Selling Price (₹/unit)', min: 10, max: 10000, step: 10, hint: 'Used for revenue and margin estimates' },
            ] as const).map((field) => (
              <div key={field.key}>
                <label className="text-sm font-medium text-ink-700">{field.label}</label>
                <input
                  type="number"
                  min={field.min}
                  max={field.max}
                  step={field.step}
                  disabled={!canManage}
                  value={draftBaselines[field.key]}
                  onChange={(e) => setDraftBaselines({ [field.key]: Number(e.target.value) })}
                  className="mt-1.5 h-10 w-full rounded-lg border border-ink-200 bg-ink-0 px-3 text-sm text-ink-500 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 disabled:bg-ink-100 disabled:text-ink-400"
                />
                <p className="mt-1 text-xs text-ink-400">{field.hint}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-3 border-t border-ink-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-ink-400">Values persist in this browser — refreshing keeps your baselines.</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setDraftBaselines({
                    energyRatePerKwh: data.baselines.energyRatePerKwh,
                    gridEmissionFactor: data.baselines.gridEmissionFactor,
                    monthlyProductionUnits: data.baselines.monthlyProductionUnits,
                    avgSellingPriceInr: data.baselines.avgSellingPriceInr,
                  });
                  showToast('Edits discarded — baseline values restored.');
                }}
                className="rounded-lg border border-ink-200 px-4 py-2 text-sm font-medium text-ink-600 transition hover:bg-ink-50"
              >
                Discard Edits
              </button>
              <button
                type="button"
                disabled={!canManage}
                onClick={() => {
                  saveBaselines();
                  logAction({ action: 'Saved baseline changes', resource: 'Settings', resourceId: 'baselines', status: 'success' });
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                Save Baseline Changes
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* ── CSV Import ────────────────────────────────────────────────── */}
      {tab === 'import' && (
        <Card>
          <CardHeader
            title="CSV Bulk Import"
            subtitle="Drag and drop a file, or click to browse. Uploaded data recalculates every module instantly."
            icon={<UploadCloud className="h-5 w-5" />}
          />
          <div className="grid grid-cols-1 gap-4 p-5 lg:grid-cols-3">
            {(Object.keys(CSV_TEMPLATES) as (keyof typeof CSV_TEMPLATES)[]).map((kind) => {
              const template = CSV_TEMPLATES[kind];
              const active = importState.kind === kind;
              return (
                <div key={kind} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-sm font-semibold capitalize text-ink-700">{kind === 'energy' ? 'Utility / Energy Log' : kind === 'suppliers' ? 'Supplier Directory' : 'Inventory Items'}</h3>
                    <button
                      type="button"
                      onClick={() => downloadFile(
                        toCsv(template.headers, template.sample),
                        template.file,
                        'text/csv;charset=utf-8;'
                      )}
                      className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700"
                    >
                      <Download className="h-3 w-3" /> Template
                    </button>
                  </div>
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={(e) => handleDrop(e, kind)}
                    onClick={() => { fileInputRef.current?.click(); setImportState((s) => ({ ...s, kind })); }}
                    className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition ${
                      dragActive && active ? 'border-primary-400 bg-primary-50' : 'border-ink-200 bg-ink-50/50 hover:border-primary-300 hover:bg-primary-50/30'
                    }`}
                  >
                    <UploadCloud className="h-7 w-7 text-ink-400" />
                    <p className="mt-2 text-xs font-medium text-ink-600">Drop CSV here or click</p>
                    <p className="mt-1 text-xs text-ink-400">Columns: {template.headers.join(', ')}</p>
                  </div>
                  {active && importState.message && (
                    <p className="flex items-center gap-1.5 rounded-lg bg-success-50 px-3 py-2 text-xs font-medium text-success-300">
                      <Check className="h-3.5 w-3.5" /> {importState.message}
                    </p>
                  )}
                  {active && importState.error && (
                    <p className="flex items-center gap-1.5 rounded-lg bg-danger-50 px-3 py-2 text-xs font-medium text-danger-300">
                      <X className="h-3.5 w-3.5" /> {importState.error}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file && importState.kind) handleFile(file, importState.kind);
              e.target.value = '';
            }}
          />
          <div className="border-t border-ink-100 px-5 py-3">
            <p className="flex items-center gap-2 text-xs text-ink-400">
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Downloads below replace nothing — imported rows are appended, and Demo Mode always restores original data.
            </p>
          </div>
        </Card>
      )}

      {/* ── Team & Permissions ────────────────────────────────────────── */}
      {tab === 'team' && (
        <div className="space-y-6">
          {can('team.invite') && (
            <Card>
              <CardHeader title="Invite Team Member" subtitle="Members receive their role permissions immediately in demo mode" icon={<UserPlus className="h-5 w-5" />} />
              <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-4">
                <input
                  value={inviteForm.name}
                  onChange={(e) => setInviteForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Full name"
                  className="h-10 rounded-lg border border-ink-200 bg-ink-0 px-3 text-sm text-slate-900 outline-none placeholder:text-ink-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                />
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="work email"
                  className="h-10 rounded-lg border border-ink-200 bg-ink-0 px-3 text-sm text-slate-900 outline-none placeholder:text-ink-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                />
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm((f) => ({ ...f, role: e.target.value as WorkspaceRole }))}
                  className="h-10 rounded-lg border border-ink-200 bg-ink-0 px-3 text-sm text-ink-500 outline-none focus:border-primary-500"
                >
                  {(Object.keys(ROLE_LABELS) as WorkspaceRole[]).map((r) => (
                    <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    if (!inviteForm.name || !inviteForm.email) return;
                    inviteMember(inviteForm.name, inviteForm.email, inviteForm.role);
                    logAction({ action: `Invited ${inviteForm.name} as ${ROLE_LABELS[inviteForm.role]}`, resource: 'Team', resourceId: inviteForm.email, status: 'success' });
                    setInviteForm({ name: '', email: '', role: 'operator' });
                  }}
                  className="h-10 rounded-lg bg-primary-600 px-4 text-sm font-semibold text-white transition hover:bg-primary-700"
                >
                  Send Invite
                </button>
              </div>
            </Card>
          )}

          <Card>
            <CardHeader title="Team Members" subtitle="Role determines which actions are permitted across the workspace" icon={<ShieldCheck className="h-5 w-5" />} />
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-ink-100 text-left text-xs font-semibold uppercase tracking-wider text-ink-400">
                    <th className="px-4 py-3">Member</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="hidden px-4 py-3 sm:table-cell">Status</th>
                    <th className="px-4 py-3">Key Permissions</th>
                  </tr>
                </thead>
                <tbody>
                  {team.map((member) => (
                    <tr key={member.id} className="border-b border-ink-50 hover:bg-ink-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-ink-700">{member.name}</p>
                        <p className="text-xs text-ink-400">{member.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        {can('team.invite') && member.role !== 'owner' ? (
                          <select
                            value={member.role}
                            onChange={(e) => {
                              updateMemberRole(member.id, e.target.value as WorkspaceRole);
                              logAction({ action: `Changed ${member.name}'s role to ${ROLE_LABELS[e.target.value as WorkspaceRole]}`, resource: 'Team', resourceId: member.id, status: 'success' });
                            }}
                            className="h-8 rounded-lg border border-ink-200 bg-white px-2 text-xs text-slate-900 outline-none focus:border-primary-500"
                          >
                            {(Object.keys(ROLE_LABELS) as WorkspaceRole[]).filter((r) => r !== 'owner').map((r) => (
                              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-semibold text-primary-300">{ROLE_LABELS[member.role]}</span>
                        )}
                      </td>
                      <td className="hidden px-4 py-3 sm:table-cell">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${member.status === 'active' ? 'bg-success-50 text-success-300' : 'bg-ink-100 text-ink-500'}`}>
                          {member.status === 'active' ? 'Active' : 'Invited'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-ink-500">
                        {member.role === 'owner' && 'Full control including billing and deletion'}
                        {member.role === 'admin' && 'Manage settings, team, and all module data'}
                        {member.role === 'operator' && 'Edit inventory and run simulations'}
                        {member.role === 'auditor' && 'Export finance, ledger, and reports (read-only)'}
                        {member.role === 'viewer' && 'View-only access to all modules'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
