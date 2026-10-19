import {
  createContext, useContext, useState, useEffect, useMemo, useCallback, type ReactNode,
} from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import {
  demoInventory, demoSuppliers, demoEnergyHourly, demoTariffSlots,
  demoTransactions, demoInvoices, demoAuditLogs, demoInventoryMovements,
} from '@/data/demoData';
import { parseCsv, toCsv, downloadFile } from '@/lib/exportUtils';
import type {
  InventoryItem, SupplierRecord, FinanceTransaction, InvoiceRecord,
  AuditLogRecord, EnergyPoint, EnergyTariffSlot,
} from '@/types';

// ═══════════════════════════════════════════════════════════════════════════
//  Workspace data context — Stage 4
//  Holds the active workspace's operational dataset. Demo mode is the
//  persistent default; custom values and CSV uploads recalculate every
//  module's KPIs from the same source of truth.
// ═══════════════════════════════════════════════════════════════════════════

export type DataMode = 'demo' | 'custom' | 'iot';

// Label shown in every module badge — reflects the active data source
export function dataSourceLabel(mode: DataMode, iotConnected: boolean): string {
  if (mode === 'iot' && iotConnected) return 'Live Data';
  if (mode === 'custom') return 'Custom Data';
  if (mode === 'iot') return 'IoT (disconnected) — Demo Data';
  return 'Demo Data';
}

export type WorkspaceRole = 'owner' | 'admin' | 'operator' | 'auditor' | 'viewer';

export const ROLE_LABELS: Record<WorkspaceRole, string> = {
  owner: 'Owner', admin: 'Admin', operator: 'Operator', auditor: 'Auditor', viewer: 'Viewer',
};

export type Permission =
  | 'settings.manage'
  | 'team.invite'
  | 'inventory.edit'
  | 'suppliers.edit'
  | 'finance.edit'
  | 'finance.export'
  | 'reports.export'
  | 'ledger.export'
  | 'simulator.run';

const ROLE_PERMISSIONS: Record<WorkspaceRole, Permission[]> = {
  owner: ['settings.manage', 'team.invite', 'inventory.edit', 'suppliers.edit', 'finance.edit', 'finance.export', 'reports.export', 'ledger.export', 'simulator.run'],
  admin: ['settings.manage', 'team.invite', 'inventory.edit', 'suppliers.edit', 'finance.edit', 'finance.export', 'reports.export', 'ledger.export', 'simulator.run'],
  operator: ['inventory.edit', 'simulator.run'],
  auditor: ['finance.export', 'reports.export', 'ledger.export'],
  viewer: [],
};

export const DEMO_TEAM: { id: string; name: string; email: string; role: WorkspaceRole; status: 'active' | 'invited' }[] = [
  { id: 'TM-001', name: 'Anika Rao', email: 'anika@northwind.example', role: 'owner', status: 'active' },
  { id: 'TM-002', name: 'Priya Shah', email: 'priya@northwind.example', role: 'admin', status: 'active' },
  { id: 'TM-003', name: 'Ravi Kumar', email: 'ravi@northwind.example', role: 'operator', status: 'active' },
  { id: 'TM-004', name: 'Maya Singh', email: 'maya@northwind.example', role: 'operator', status: 'active' },
  { id: 'TM-005', name: 'Arjun Mehta', email: 'arjun@auditor.example', role: 'auditor', status: 'invited' },
];

export interface CustomBaselines {
  energyRatePerKwh: number;
  gridEmissionFactor: number;
  monthlyProductionUnits: number;
  avgSellingPriceInr: number;
}

const DEFAULT_BASELINES: CustomBaselines = {
  energyRatePerKwh: 6.5,
  gridEmissionFactor: 0.71,
  monthlyProductionUnits: 8400,
  avgSellingPriceInr: 420,
};

export interface WorkspaceData {
  mode: DataMode;
  baselines: CustomBaselines;
  inventory: InventoryItem[];
  suppliers: SupplierRecord[];
  energyHourly: EnergyPoint[];
  tariffSlots: EnergyTariffSlot[];
  transactions: FinanceTransaction[];
  invoices: InvoiceRecord[];
  movements: typeof demoInventoryMovements;
  auditLogs: AuditLogRecord[];
  iotConnected: boolean;
}

const DEMO_DATASET: WorkspaceData = {
  mode: 'demo',
  baselines: DEFAULT_BASELINES,
  inventory: demoInventory,
  suppliers: demoSuppliers,
  energyHourly: demoEnergyHourly,
  tariffSlots: demoTariffSlots,
  transactions: demoTransactions,
  invoices: demoInvoices,
  movements: demoInventoryMovements,
  auditLogs: demoAuditLogs,
  iotConnected: false,
};

function deriveAudit(
  logs: AuditLogRecord[],
  entry: { actor: string; actorRole: string; action: string; resource: string; resourceId: string; status: AuditLogRecord['status'] }
): AuditLogRecord[] {
  const next: AuditLogRecord = {
    id: `AUD-${String(logs.length + 1).padStart(3, '0')}`,
    timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
    actor: entry.actor,
    actorRole: entry.actorRole,
    action: entry.action,
    resource: entry.resource,
    resourceId: entry.resourceId,
    status: entry.status,
    ipAddress: 'this-session',
  };
  return [next, ...logs].slice(0, 200);
}

interface ToastState {
  message: string;
  tone: 'success' | 'error';
}

interface WorkspaceDataContextValue {
  data: WorkspaceData;
  pricedEnergyHourly: EnergyPoint[];
  effectiveTariffSlots: EnergyTariffSlot[];
  draftBaselines: CustomBaselines;
  setDraftBaselines: (patch: Partial<CustomBaselines>) => void;
  saveBaselines: () => void;
  toast: ToastState | null;
  showToast: (message: string, tone?: 'success' | 'error') => void;
  role: WorkspaceRole;
  team: typeof DEMO_TEAM;
  can: (permission: Permission) => boolean;
  setMode: (mode: DataMode) => void;
  setIotConnected: (connected: boolean) => void;
  updateBaselines: (patch: Partial<CustomBaselines>) => void;
  upsertInventoryItem: (item: InventoryItem) => void;
  upsertSupplier: (supplier: SupplierRecord) => void;
  upsertTransaction: (tx: FinanceTransaction) => void;
  upsertInvoice: (invoice: InvoiceRecord) => void;
  importCsv: (kind: 'inventory' | 'suppliers' | 'energy', csvText: string) => { count: number; error: string | null };
  logAction: (entry: { action: string; resource: string; resourceId: string; status: AuditLogRecord['status'] }) => void;
  attemptAction: (permission: Permission, entry: { action: string; resource: string; resourceId: string }) => boolean;
  inviteMember: (name: string, email: string, role: WorkspaceRole) => void;
  updateMemberRole: (memberId: string, role: WorkspaceRole) => void;
  exportAuditCsv: () => void;
  kpis: {
    activeMachines: number;
    energyCostPerHour: number;
    energyDailyCost: number;
    peakHourCost: number;
    potentialSavingsInr: number;
    carbonDailyTons: number;
    inventoryValue: number;
    lowStockCount: number;
    outOfStockCount: number;
    shortfalls: number;
    avgOnTimeRate: number;
    avgQuality: number;
    highRiskSuppliers: number;
    totalIncome: number;
    totalExpense: number;
    netProfit: number;
    profitMargin: number;
    overdueInvoices: number;
    overdueInvoiceValue: number;
    energySpikeKwh: number;
  };
}

const WorkspaceDataContext = createContext<WorkspaceDataContextValue | null>(null);

// Tariff-slot pricing: Peak 09–18, Off-Peak 22–06, Shoulder otherwise.
// Falls back to multipliers of the global baseline tariff when slots are absent.
function rateForHour(label: string, tariffSlots: EnergyTariffSlot[], baseRate: number): number {
  const hour = parseInt(label, 10);
  if (Number.isNaN(hour)) return baseRate;
  if (hour >= 9 && hour < 18) return tariffSlots.find((t) => t.label === 'Peak')?.ratePerKwh ?? baseRate * 1.4;
  if (hour < 6 || hour >= 22) return tariffSlots.find((t) => t.label === 'Off-Peak')?.ratePerKwh ?? baseRate * 0.5;
  return tariffSlots.find((t) => t.label === 'Shoulder')?.ratePerKwh ?? baseRate;
}

// Blended rate of the demo slot structure (weighted 8h peak / 8h shoulder / 8h off-peak)
const DEMO_BLENDED_RATE =
  demoTariffSlots.reduce((s, t) => s + t.ratePerKwh, 0) / demoTariffSlots.length;

// Slot rates that honor the baseline tariff: in demo mode the raw demo slots are
// used; in custom/IoT modes the demo ratios (peak/shoulder/off-peak) are scaled
// so the blended rate equals the user's baseline ₹/kWh. Rates are rounded to 2dp.
function deriveEffectiveTariffSlots(mode: DataMode, slots: EnergyTariffSlot[], baselineRate: number): EnergyTariffSlot[] {
  if (mode === 'demo') return slots;
  const factor = DEMO_BLENDED_RATE > 0 ? baselineRate / DEMO_BLENDED_RATE : 1;
  return slots.map((s) => ({
    ...s,
    ratePerKwh: Math.round(s.ratePerKwh * factor * 100) / 100,
  }));
}

const STORAGE_KEY = 'indusledger_custom_dataset_v1';

function loadPersisted(): Partial<WorkspaceData> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Partial<WorkspaceData>) : null;
  } catch {
    return null;
  }
}

export function WorkspaceDataProvider({
  role = 'owner',
  actorName = 'You',
  children,
}: {
  role?: WorkspaceRole;
  actorName?: string;
  children: ReactNode;
}) {
  const persisted = useMemo(loadPersisted, []);
  const [data, setData] = useState<WorkspaceData>(() => ({
    ...DEMO_DATASET,
    ...persisted,
    // Demo mode is the persistent default for brand-new sessions
    mode: persisted?.mode ?? 'demo',
  }));
  const [team, setTeam] = useState(DEMO_TEAM);
  const [toast, setToast] = useState<ToastState | null>(null);
  // Draft copy of baselines — edits stay local until "Save Baseline Changes"
  const [draftBaselines, setDraftBaselinesState] = useState<CustomBaselines>(
    () => ({ ...DEMO_DATASET.baselines, ...persisted?.baselines })
  );

  const showToast = useCallback((message: string, tone: 'success' | 'error' = 'success') => {
    setToast({ message, tone });
    window.setTimeout(() => setToast(null), 4000);
  }, []);

  // Keep the draft in sync if a mode switch restores demo defaults
  useEffect(() => {
    setDraftBaselinesState({ ...data.baselines });
  }, [data.baselines]);

  const setDraftBaselines = useCallback((patch: Partial<CustomBaselines>) => {
    setDraftBaselinesState((prev) => ({ ...prev, ...patch }));
  }, []);

  const saveBaselines = useCallback(() => {
    setData((prev) => ({ ...prev, baselines: { ...draftBaselines } }));
    showToast('Baseline changes saved — all modules recalculated.');
  }, [draftBaselines, showToast]);

  useEffect(() => {
    const { auditLogs: _logs, ...persistable } = data;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(persistable)); } catch { /* storage full — non-fatal */ }
  }, [data]);

  const logAction = useCallback((entry: { action: string; resource: string; resourceId: string; status: AuditLogRecord['status'] }) => {
    setData((prev) => ({
      ...prev,
      auditLogs: deriveAudit(prev.auditLogs, { ...entry, actor: actorName, actorRole: ROLE_LABELS[role] }),
    }));
  }, [actorName, role]);

  const can = useCallback(
    (permission: Permission) => ROLE_PERMISSIONS[role]?.includes(permission) ?? false,
    [role]
  );

  const attemptAction = useCallback(
    (permission: Permission, entry: { action: string; resource: string; resourceId: string }) => {
      const allowed = can(permission);
      logAction({
        action: allowed ? entry.action : `${entry.action} — denied (insufficient role)`,
        resource: entry.resource,
        resourceId: entry.resourceId,
        status: allowed ? 'success' : 'failed',
      });
      return allowed;
    },
    [can, logAction]
  );

  const setMode = useCallback((mode: DataMode) => {
    setData((prev) => ({
      ...prev,
      mode,
      // Switching to demo restores the pristine demo dataset
      ...(mode === 'demo' ? { ...DEMO_DATASET, mode } : {}),
    }));
  }, []);

  const setIotConnected = useCallback((connected: boolean) => {
    setData((prev) => ({ ...prev, iotConnected: connected }));
  }, []);

  const updateBaselines = useCallback((patch: Partial<CustomBaselines>) => {
    setData((prev) => ({ ...prev, baselines: { ...prev.baselines, ...patch } }));
  }, []);

  const upsertInventoryItem = useCallback((item: InventoryItem) => {
    setData((prev) => {
      const exists = prev.inventory.some((i) => i.id === item.id);
      const inventory = exists
        ? prev.inventory.map((i) => (i.id === item.id ? item : i))
        : [item, ...prev.inventory];
      return { ...prev, inventory };
    });
  }, []);

  const upsertSupplier = useCallback((supplier: SupplierRecord) => {
    setData((prev) => {
      const exists = prev.suppliers.some((s) => s.id === supplier.id);
      const suppliers = exists
        ? prev.suppliers.map((s) => (s.id === supplier.id ? supplier : s))
        : [supplier, ...prev.suppliers];
      return { ...prev, suppliers };
    });
  }, []);

  const upsertTransaction = useCallback((tx: FinanceTransaction) => {
    setData((prev) => {
      const exists = prev.transactions.some((t) => t.id === tx.id);
      const transactions = exists
        ? prev.transactions.map((t) => (t.id === tx.id ? tx : t))
        : [tx, ...prev.transactions];
      return { ...prev, transactions };
    });
  }, []);

  const upsertInvoice = useCallback((invoice: InvoiceRecord) => {
    setData((prev) => {
      const exists = prev.invoices.some((i) => i.id === invoice.id);
      const invoices = exists
        ? prev.invoices.map((i) => (i.id === invoice.id ? invoice : i))
        : [invoice, ...prev.invoices];
      return { ...prev, invoices };
    });
  }, []);

  const importCsv = useCallback((kind: 'inventory' | 'suppliers' | 'energy', csvText: string) => {
    const { headers, rows } = parseCsv(csvText);
    if (rows.length === 0) return { count: 0, error: 'No data rows found in the file.' };

    if (kind === 'inventory') {
      const required = ['name', 'stock'];
      const missing = required.filter((r) => !headers.includes(r));
      if (missing.length > 0) return { count: 0, error: `Missing required column(s): ${missing.join(', ')}` };
      setData((prev) => {
        const imported: InventoryItem[] = rows.map((row, i) => {
          const stock = Number(row.stock) || 0;
          const reorderPoint = Number(row.reorder_point ?? row.reorderpoint) || Math.round(stock * 0.3);
          const unitCostInr = Number(row.unit_cost ?? row.cost) || 0;
          return {
            id: `I-IMP-${String(i + 1).padStart(3, '0')}`,
            name: row.name,
            category: row.category ?? 'Imported',
            unit: row.unit ?? 'units',
            stock,
            reorderPoint,
            avgDailyUsage: Number(row.daily_usage ?? row.usage) || Math.max(1, Math.round(stock / 30)),
            unitCostInr,
            supplier: row.supplier ?? 'Unassigned',
            status: stock === 0 ? 'out-of-stock' : stock <= reorderPoint ? 'low-stock' : 'in-stock',
          };
        });
        return { ...prev, inventory: [...imported, ...prev.inventory] };
      });
      return { count: rows.length, error: null };
    }

    if (kind === 'suppliers') {
      const required = ['name'];
      const missing = required.filter((r) => !headers.includes(r));
      if (missing.length > 0) return { count: 0, error: `Missing required column(s): ${missing.join(', ')}` };
      setData((prev) => {
        const imported: SupplierRecord[] = rows.map((row, i) => {
          const onTimeRate = Number(row.on_time ?? row.ontime) || 75;
          return {
            id: `S-IMP-${String(i + 1).padStart(3, '0')}`,
            name: row.name,
            category: row.category ?? 'Imported',
            onTimeRate,
            qualityScore: Number(row.quality) || 75,
            avgPriceInr: Number(row.price) || 0,
            totalOrders: Number(row.orders) || 0,
            activeOrders: Number(row.active_orders) || 0,
            reliability: onTimeRate >= 85 ? 'high' : onTimeRate >= 70 ? 'medium' : 'low',
            paymentTerms: row.payment_terms ?? 'Net 30',
          };
        });
        return { ...prev, suppliers: [...imported, ...prev.suppliers] };
      });
      return { count: rows.length, error: null };
    }

    // energy
    const required = ['consumption'];
    const missing = required.filter((r) => !headers.includes(r));
    if (missing.length > 0) return { count: 0, error: `Missing required column(s): ${missing.join(', ')}` };
    setData((prev) => {
      const rate = prev.baselines.energyRatePerKwh;
      const imported: EnergyPoint[] = rows.map((row, i) => {
        const consumptionKwh = Number(row.consumption ?? row.kwh) || 0;
        const hour = Number(row.hour ?? row.label) || i;
        const isPeak = hour >= 9 && hour < 18;
        const slotRate = isPeak ? rate * 1.4 : isPeak === false && hour < 6 ? rate * 0.5 : rate;
        return { label: String(row.hour ?? row.label ?? i), consumptionKwh, costInr: Math.round(consumptionKwh * slotRate) };
      });
      return { ...prev, energyHourly: imported };
    });
    return { count: rows.length, error: null };
  }, []);

  const inviteMember = useCallback((name: string, email: string, memberRole: WorkspaceRole) => {
    setTeam((prev) => [
      { id: `TM-${String(prev.length + 1).padStart(3, '0')}`, name, email, role: memberRole, status: 'invited' as const },
      ...prev,
    ]);
  }, []);

  const updateMemberRole = useCallback((memberId: string, memberRole: WorkspaceRole) => {
    setTeam((prev) => prev.map((m) => (m.id === memberId ? { ...m, role: memberRole } : m)));
  }, []);

  const exportAuditCsv = useCallback(() => {
    const headers = ['Timestamp', 'Actor', 'Role', 'Action', 'Resource', 'Resource ID', 'Status', 'IP'];
    const rows = data.auditLogs.map((log) => [log.timestamp, log.actor, log.actorRole, log.action, log.resource, log.resourceId, log.status, log.ipAddress]);
    downloadFile(toCsv(headers, rows), 'indusledger-audit-log.csv', 'text/csv;charset=utf-8;');
  }, [data.auditLogs]);

  // ─── Derived KPIs — recalculated from whatever dataset is active ────────

  // Tariff slots with rates scaled from the baseline tariff in custom/IoT modes
  const effectiveTariffSlots = useMemo(
    () => deriveEffectiveTariffSlots(data.mode, data.tariffSlots, data.baselines.energyRatePerKwh),
    [data.mode, data.tariffSlots, data.baselines.energyRatePerKwh]
  );

  const kpis = useMemo(() => {
    const { inventory, suppliers, energyHourly, transactions, invoices, baselines } = data;
    const tariffSlots = effectiveTariffSlots;

    // Energy costs are always derived: Tariff × kWh, priced per tariff slot
    const priced: EnergyPoint[] = energyHourly.map((d) => ({ ...d, costInr: Math.round(d.consumptionKwh * rateForHour(d.label, tariffSlots, baselines.energyRatePerKwh)) }));

    const activeMachines = 47;
    const hoursPerDay = 24;
    const totalKwh = priced.reduce((s, d) => s + d.consumptionKwh, 0);
    const energyDailyCost = priced.reduce((s, d) => s + d.costInr, 0);
    const energyCostPerHour = Math.round(energyDailyCost / hoursPerDay);

    const peakSlot = tariffSlots.find((t) => t.label === 'Peak');
    const peakRate = peakSlot?.ratePerKwh ?? baselines.energyRatePerKwh * 1.4;
    const offPeakSlot = tariffSlots.find((t) => t.label === 'Off-Peak');
    const offPeakRate = offPeakSlot?.ratePerKwh ?? baselines.energyRatePerKwh * 0.5;
    const peakKwh = energyHourly.filter((_, i) => i >= 9 && i < 18).reduce((s, d) => s + d.consumptionKwh, 0);
    const offPeakKwh = energyHourly.filter((_, i) => i < 6 || i >= 22).reduce((s, d) => s + d.consumptionKwh, 0);
    const potentialSavingsInr = Math.round(peakKwh * 0.3 * (peakRate - offPeakRate));

    // Carbon: baseline emission factor (kg CO₂/kWh) × consumption — always derived
    const emissionFactor = baselines.gridEmissionFactor;
    const carbonDailyTons = Number(((totalKwh * emissionFactor) / 1000).toFixed(2));

    const energySpike = energyHourly.slice(9, 18).reduce((max, d) => Math.max(max, d.consumptionKwh), 0);
    const energySpikeKwh = energySpike > 600 ? energySpike : 0;

    const inventoryValue = inventory.reduce((s, i) => s + i.stock * i.unitCostInr, 0);
    const lowStockCount = inventory.filter((i) => i.status === 'low-stock').length;
    const outOfStockCount = inventory.filter((i) => i.status === 'out-of-stock').length;
    const shortfalls = inventory.filter((i) => i.stock <= i.reorderPoint).length;

    const avgOnTimeRate = suppliers.length > 0 ? Math.round(suppliers.reduce((s, sup) => s + sup.onTimeRate, 0) / suppliers.length) : 0;
    const avgQuality = suppliers.length > 0 ? Math.round(suppliers.reduce((s, sup) => s + sup.qualityScore, 0) / suppliers.length) : 0;
    const highRiskSuppliers = suppliers.filter((sup) => sup.reliability === 'low').length;

    const totalIncome = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amountInr, 0);
    const totalExpense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amountInr, 0);
    // Dynamic financials: revenue scales with production volume × selling price;
    // expense includes tariff-repriced energy cost.
    const dynamicRevenue = baselines.monthlyProductionUnits * baselines.avgSellingPriceInr;
    const revenue = Math.max(totalIncome, Math.round(dynamicRevenue));
    const totalExpenseWithEnergy = Math.max(totalExpense, energyDailyCost * 30);
    const netProfit = revenue - totalExpenseWithEnergy;
    const profitMargin = revenue > 0 ? Number(((netProfit / revenue) * 100).toFixed(1)) : 0;

    const overdue = invoices.filter((i) => i.status === 'overdue');
    const overdueInvoices = overdue.length;
    const overdueInvoiceValue = overdue.reduce((s, i) => s + i.amountInr, 0);

    return {
      activeMachines, energyCostPerHour, energyDailyCost, peakHourCost: Math.round(peakKwh * peakRate),
      potentialSavingsInr, carbonDailyTons, inventoryValue, lowStockCount, outOfStockCount, shortfalls,
      avgOnTimeRate, avgQuality, highRiskSuppliers, totalIncome: revenue, totalExpense: totalExpenseWithEnergy, netProfit, profitMargin,
      overdueInvoices, overdueInvoiceValue, energySpikeKwh,
    };
  }, [data, effectiveTariffSlots]);

  // Tariff-repriced hourly series for the energy pages
  const pricedEnergyHourly = useMemo(
    () => data.energyHourly.map((d) => ({
      label: d.label,
      consumptionKwh: d.consumptionKwh,
      costInr: Math.round(d.consumptionKwh * rateForHour(d.label, effectiveTariffSlots, data.baselines.energyRatePerKwh)),
    })),
    [data.energyHourly, effectiveTariffSlots, data.baselines.energyRatePerKwh]
  );

  const value: WorkspaceDataContextValue = {
    data, pricedEnergyHourly, effectiveTariffSlots, draftBaselines, setDraftBaselines, saveBaselines, toast, showToast,
    role, team, can, setMode, setIotConnected, updateBaselines,
    upsertInventoryItem, upsertSupplier, upsertTransaction, upsertInvoice,
    importCsv, logAction, attemptAction, inviteMember, updateMemberRole, exportAuditCsv, kpis,
  };

  return <WorkspaceDataContext.Provider value={value}>{children}</WorkspaceDataContext.Provider>;
}

export function useWorkspaceData(): WorkspaceDataContextValue {
  const ctx = useContext(WorkspaceDataContext);
  if (!ctx) throw new Error('useWorkspaceData must be used inside WorkspaceDataProvider');
  return ctx;
}

// ─── Toast viewport — render once near the app root ──────────────────────

export function ToastViewport() {
  const { toast } = useWorkspaceData();
  if (!toast) return null;
  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-[60] animate-fade-in-up">
      <div
        className={`pointer-events-auto flex items-center gap-2.5 rounded-xl border px-4 py-3 shadow-lg ${
          toast.tone === 'error'
            ? 'border-danger-300 bg-danger-50 text-danger-700'
            : 'border-success-300 bg-success-50 text-success-700'
        }`}
        role="status"
      >
        {toast.tone === 'error' ? <XCircle className="h-4.5 w-4.5" /> : <CheckCircle2 className="h-4.5 w-4.5" />}
        <p className="text-sm font-medium">{toast.message}</p>
      </div>
    </div>
  );
}
