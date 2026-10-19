// ─── Shared domain types for IndusLedger AI ──────────────────────────────

export type IndustryType = 'textile' | 'food' | 'cement' | 'automotive';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type MachineStatus = 'operational' | 'warning' | 'maintenance' | 'offline';

export type PageKey =
  | 'dashboard'
  | 'machine-health'
  | 'energy-optimization'
  | 'energy-ledger'
  | 'inventory'
  | 'suppliers'
  | 'finance'
  | 'audit-log'
  | 'ai-assistant'
  | 'simulator'
  | 'reports'
  | 'settings';

export interface KpiStat {
  label: string;
  value: string;
  unit?: string;
  change: number;        // percentage delta, positive or negative
  changeLabel: string;   // e.g. "vs last week"
  trend: number[];       // sparkline data
  icon: string;          // lucide icon name
  accent: 'primary' | 'accent' | 'success' | 'warning' | 'danger';
}

export interface MachineRecord {
  id: string;
  name: string;
  line: string;
  status: MachineStatus;
  healthScore: number;   // 0–100
  riskLevel: RiskLevel;
  temperatureC: number;
  torqueNm: number;
  rpm: number;
  uptimeHours: number;
  lastServiceDate: string;
}

export interface AlertRecord {
  id: string;
  severity: 'info' | 'warning' | 'danger';
  title: string;
  message: string;
  source: string;
  timeAgo: string;
}

export interface EnergyPoint {
  label: string;         // e.g. "Mon", "00:00"
  consumptionKwh: number;
  costInr: number;
}

export interface IndustryDistributionItem {
  label: string;
  value: number;
  color: string;
}

export interface ProductionPoint {
  label: string;
  units: number;
  target: number;
}

// ─── Stage 3 types ────────────────────────────────────────────────────────

export interface EnergyTariffSlot {
  label: string;
  hours: string;
  ratePerKwh: number;
  color: string;
}

export interface EnergyShiftRecommendation {
  id: string;
  operation: string;
  currentSlot: string;
  suggestedSlot: string;
  kwhShifted: number;
  potentialSavingInr: number;
  feasibility: 'easy' | 'moderate' | 'difficult';
}

export interface CarbonLedgerEntry {
  id: string;
  date: string;
  source: string;
  energyKwh: number;
  emissionFactor: number;
  carbonKg: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  stock: number;
  reorderPoint: number;
  avgDailyUsage: number;
  unitCostInr: number;
  supplier: string;
  status: 'in-stock' | 'low-stock' | 'out-of-stock' | 'overstock';
}

export interface MaterialRequirement {
  id: string;
  material: string;
  requiredQty: number;
  availableQty: number;
  shortfall: number;
  productionLine: string;
  dueDate: string;
}

export interface SupplierRecord {
  id: string;
  name: string;
  category: string;
  onTimeRate: number;
  qualityScore: number;
  avgPriceInr: number;
  totalOrders: number;
  activeOrders: number;
  reliability: 'high' | 'medium' | 'low';
  paymentTerms: string;
}

export interface PriceComparison {
  material: string;
  suppliers: { name: string; priceInr: number; leadTimeDays: number }[];
  bestPriceInr: number;
}

export interface FinanceTransaction {
  id: string;
  date: string;
  description: string;
  category: string;
  type: 'income' | 'expense';
  amountInr: number;
  status: 'completed' | 'pending' | 'overdue';
}

export interface InvoiceRecord {
  id: string;
  invoiceNo: string;
  client: string;
  issueDate: string;
  dueDate: string;
  amountInr: number;
  status: 'paid' | 'pending' | 'overdue';
}

export interface CashFlowPoint {
  label: string;
  inflow: number;
  outflow: number;
  net: number;
}

export interface ManufacturingCostBreakdown {
  category: string;
  amountInr: number;
  percentage: number;
  color: string;
}

export interface InventoryMovement {
  id: string;
  date: string;
  item: string;
  type: 'received' | 'issued' | 'adjusted' | 'returned';
  quantity: number;
  reference: string;
  by: string;
}

export interface AuditLogRecord {
  id: string;
  timestamp: string;
  actor: string;
  actorRole: string;
  action: string;
  resource: string;
  resourceId: string;
  status: 'success' | 'warning' | 'failed';
  ipAddress: string;
}
