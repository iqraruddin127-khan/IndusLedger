import type {
  KpiStat, MachineRecord, AlertRecord, EnergyPoint, IndustryDistributionItem, ProductionPoint,
  EnergyTariffSlot, EnergyShiftRecommendation, CarbonLedgerEntry,
  InventoryItem, MaterialRequirement,
  SupplierRecord, PriceComparison,
  FinanceTransaction, InvoiceRecord, CashFlowPoint, ManufacturingCostBreakdown,
  InventoryMovement, AuditLogRecord,
} from '@/types';

// ═══════════════════════════════════════════════════════════════════════════
//  DEMO DATA — All values below are synthetic and clearly labeled.
//  No live data, real telemetry, or actual financial figures are used.
// ═══════════════════════════════════════════════════════════════════════════

export const demoKpiStats: KpiStat[] = [
  {
    label: 'Active Machines',
    value: '47',
    change: 2.1,
    changeLabel: 'vs last week',
    trend: [42, 43, 44, 43, 45, 46, 47],
    icon: 'Cog',
    accent: 'primary',
  },
  {
    label: 'Energy Cost / hr',
    value: '4,820',
    unit: 'INR',
    change: -3.4,
    changeLabel: 'vs last week',
    trend: [5200, 5100, 5000, 4900, 4850, 4800, 4820],
    icon: 'Zap',
    accent: 'accent',
  },
  {
    label: 'OEE Score',
    value: '78.5',
    unit: '%',
    change: 1.2,
    changeLabel: 'vs last week',
    trend: [74, 75, 76, 75, 77, 78, 78.5],
    icon: 'Gauge',
    accent: 'success',
  },
  {
    label: 'Open Alerts',
    value: '5',
    change: -12.0,
    changeLabel: 'vs last week',
    trend: [9, 8, 7, 6, 6, 5, 5],
    icon: 'Bell',
    accent: 'warning',
  },
];

export const demoMachines: MachineRecord[] = [
  {
    id: 'M-001',
    name: 'CNC Lathe A-12',
    line: 'Line 1 — Machining',
    status: 'operational',
    healthScore: 92,
    riskLevel: 'low',
    temperatureC: 42.3,
    torqueNm: 38.5,
    rpm: 1450,
    uptimeHours: 1840,
    lastServiceDate: '2025-09-28',
  },
  {
    id: 'M-002',
    name: 'Press P-07',
    line: 'Line 2 — Stamping',
    status: 'warning',
    healthScore: 68,
    riskLevel: 'medium',
    temperatureC: 71.8,
    torqueNm: 52.1,
    rpm: 980,
    uptimeHours: 3120,
    lastServiceDate: '2025-08-15',
  },
  {
    id: 'M-003',
    name: 'Conveyor C-03',
    line: 'Line 1 — Assembly',
    status: 'operational',
    healthScore: 85,
    riskLevel: 'low',
    temperatureC: 38.1,
    torqueNm: 18.2,
    rpm: 220,
    uptimeHours: 2210,
    lastServiceDate: '2025-10-01',
  },
  {
    id: 'M-004',
    name: 'Boiler B-01',
    line: 'Utilities — Power',
    status: 'maintenance',
    healthScore: 45,
    riskLevel: 'high',
    temperatureC: 89.4,
    torqueNm: 0,
    rpm: 0,
    uptimeHours: 5400,
    lastServiceDate: '2025-07-20',
  },
  {
    id: 'M-005',
    name: 'Robot Arm R-22',
    line: 'Line 3 — Welding',
    status: 'operational',
    healthScore: 88,
    riskLevel: 'low',
    temperatureC: 44.6,
    torqueNm: 24.3,
    rpm: 180,
    uptimeHours: 1980,
    lastServiceDate: '2025-09-10',
  },
  {
    id: 'M-006',
    name: 'Compressor K-05',
    line: 'Utilities — Air',
    status: 'offline',
    healthScore: 22,
    riskLevel: 'critical',
    temperatureC: 0,
    torqueNm: 0,
    rpm: 0,
    uptimeHours: 0,
    lastServiceDate: '2025-10-11',
  },
];

export const demoAlerts: AlertRecord[] = [
  {
    id: 'AL-001',
    severity: 'danger',
    title: 'Compressor K-05 Offline',
    message: 'Emergency shutdown triggered. Pressure sensor fault detected.',
    source: 'Machine Health AI',
    timeAgo: '12 min ago',
  },
  {
    id: 'AL-002',
    severity: 'warning',
    title: 'Boiler B-01 Overdue Service',
    message: 'Maintenance window exceeded by 14 days. Schedule service immediately.',
    source: 'Maintenance Scheduler',
    timeAgo: '1 hr ago',
  },
  {
    id: 'AL-003',
    severity: 'warning',
    title: 'Press P-07 Temperature Rising',
    message: 'Temperature at 71.8°C, trending upward. Predicted failure risk: medium.',
    source: 'Machine Health AI',
    timeAgo: '3 hr ago',
  },
  {
    id: 'AL-004',
    severity: 'info',
    title: 'Inventory: Steel Sheets Low',
    message: 'Stock below reorder point (120 units). Estimated 2 days at current usage.',
    source: 'Inventory Tracker',
    timeAgo: '5 hr ago',
  },
  {
    id: 'AL-005',
    severity: 'info',
    title: 'Energy: Peak-Hour Surge Detected',
    message: 'Consumption spiked 18% during 14:00–15:00. Consider shifting flexible load.',
    source: 'Energy Optimizer',
    timeAgo: '6 hr ago',
  },
];

export const demoEnergyTrend: EnergyPoint[] = [
  { label: '00:00', consumptionKwh: 320, costInr: 960 },
  { label: '03:00', consumptionKwh: 280, costInr: 840 },
  { label: '06:00', consumptionKwh: 410, costInr: 1640 },
  { label: '09:00', consumptionKwh: 580, costInr: 3480 },
  { label: '12:00', consumptionKwh: 620, costInr: 3720 },
  { label: '15:00', consumptionKwh: 540, costInr: 3240 },
  { label: '18:00', consumptionKwh: 480, costInr: 1920 },
  { label: '21:00', consumptionKwh: 360, costInr: 1080 },
];

export const demoIndustryDistribution: IndustryDistributionItem[] = [
  { label: 'Textile', value: 28, color: '#0d9488' },
  { label: 'Automotive', value: 35, color: '#f59e0b' },
  { label: 'Food & Bev', value: 22, color: '#22c55e' },
  { label: 'Cement', value: 15, color: '#64748b' },
];

export const demoProductionTrend: ProductionPoint[] = [
  { label: 'Mon', units: 1240, target: 1300 },
  { label: 'Tue', units: 1380, target: 1300 },
  { label: 'Wed', units: 1190, target: 1300 },
  { label: 'Thu', units: 1420, target: 1300 },
  { label: 'Fri', units: 1510, target: 1300 },
  { label: 'Sat', units: 980, target: 1100 },
  { label: 'Sun', units: 460, target: 600 },
];

// ═══════════════════════════════════════════════════════════════════════════
//  STAGE 3 DEMO DATA — Energy, Inventory, Suppliers, Finance
//  All values are synthetic and clearly labeled. No live prices or real data.
// ═══════════════════════════════════════════════════════════════════════════

// ─── Energy Optimization ───────────────────────────────────────────────────

export const demoTariffSlots: EnergyTariffSlot[] = [
  { label: 'Off-Peak', hours: '22:00 – 06:00', ratePerKwh: 3.0, color: '#22c55e' },
  { label: 'Shoulder', hours: '06:00 – 09:00, 18:00 – 22:00', ratePerKwh: 6.0, color: '#f59e0b' },
  { label: 'Peak', hours: '09:00 – 18:00', ratePerKwh: 9.0, color: '#ef4444' },
];

export const demoEnergyHourly: EnergyPoint[] = [
  { label: '00', consumptionKwh: 280, costInr: 840 },
  { label: '01', consumptionKwh: 260, costInr: 780 },
  { label: '02', consumptionKwh: 240, costInr: 720 },
  { label: '03', consumptionKwh: 250, costInr: 750 },
  { label: '04', consumptionKwh: 270, costInr: 810 },
  { label: '05', consumptionKwh: 300, costInr: 900 },
  { label: '06', consumptionKwh: 380, costInr: 2280 },
  { label: '07', consumptionKwh: 420, costInr: 2520 },
  { label: '08', consumptionKwh: 460, costInr: 2760 },
  { label: '09', consumptionKwh: 560, costInr: 5040 },
  { label: '10', consumptionKwh: 600, costInr: 5400 },
  { label: '11', consumptionKwh: 620, costInr: 5580 },
  { label: '12', consumptionKwh: 640, costInr: 5760 },
  { label: '13', consumptionKwh: 600, costInr: 5400 },
  { label: '14', consumptionKwh: 580, costInr: 5220 },
  { label: '15', consumptionKwh: 540, costInr: 4860 },
  { label: '16', consumptionKwh: 520, costInr: 4680 },
  { label: '17', consumptionKwh: 500, costInr: 4500 },
  { label: '18', consumptionKwh: 480, costInr: 2880 },
  { label: '19', consumptionKwh: 440, costInr: 2640 },
  { label: '20', consumptionKwh: 400, costInr: 2400 },
  { label: '21', consumptionKwh: 360, costInr: 2160 },
  { label: '22', consumptionKwh: 340, costInr: 1020 },
  { label: '23', consumptionKwh: 300, costInr: 900 },
];

export const demoShiftRecommendations: EnergyShiftRecommendation[] = [
  {
    id: 'SR-001',
    operation: 'Batch Mixing — Line 2',
    currentSlot: 'Peak (09:00–18:00)',
    suggestedSlot: 'Off-Peak (22:00–06:00)',
    kwhShifted: 180,
    potentialSavingInr: 1080,
    feasibility: 'easy',
  },
  {
    id: 'SR-002',
    operation: 'Water Heating — Boiler B-01',
    currentSlot: 'Peak (09:00–18:00)',
    suggestedSlot: 'Shoulder (06:00–09:00)',
    kwhShifted: 120,
    potentialSavingInr: 360,
    feasibility: 'moderate',
  },
  {
    id: 'SR-003',
    operation: 'Compressed Air Charging',
    currentSlot: 'Peak (14:00–17:00)',
    suggestedSlot: 'Off-Peak (22:00–02:00)',
    kwhShifted: 90,
    potentialSavingInr: 540,
    feasibility: 'easy',
  },
  {
    id: 'SR-004',
    operation: 'CNC Finishing Pass — Line 1',
    currentSlot: 'Peak (11:00–15:00)',
    suggestedSlot: 'Off-Peak (02:00–06:00)',
    kwhShifted: 220,
    potentialSavingInr: 1320,
    feasibility: 'difficult',
  },
];

// ─── Carbon Ledger ──────────────────────────────────────────────────────────

export const demoCarbonLedger: CarbonLedgerEntry[] = [
  { id: 'C-001', date: '2026-10-14', source: 'Grid Electricity', energyKwh: 8400, emissionFactor: 0.71, carbonKg: 5964 },
  { id: 'C-002', date: '2026-10-14', source: 'Diesel Generator', energyKwh: 1200, emissionFactor: 2.68, carbonKg: 3216 },
  { id: 'C-003', date: '2026-10-13', source: 'Grid Electricity', energyKwh: 8200, emissionFactor: 0.71, carbonKg: 5822 },
  { id: 'C-004', date: '2026-10-13', source: 'Natural Gas — Furnace', energyKwh: 2400, emissionFactor: 1.89, carbonKg: 4536 },
  { id: 'C-005', date: '2026-10-12', source: 'Grid Electricity', energyKwh: 8800, emissionFactor: 0.71, carbonKg: 6248 },
  { id: 'C-006', date: '2026-10-12', source: 'Diesel Generator', energyKwh: 800, emissionFactor: 2.68, carbonKg: 2144 },
  { id: 'C-007', date: '2026-10-11', source: 'Grid Electricity', energyKwh: 8600, emissionFactor: 0.71, carbonKg: 6106 },
];

// ─── Inventory ──────────────────────────────────────────────────────────────

export const demoInventory: InventoryItem[] = [
  { id: 'I-001', name: 'Steel Sheets (2mm)', category: 'Raw Material', unit: 'sheets', stock: 80, reorderPoint: 120, avgDailyUsage: 40, unitCostInr: 850, supplier: 'Tata Steel Supplies', status: 'low-stock' },
  { id: 'I-002', name: 'Aluminium Ingots', category: 'Raw Material', unit: 'kg', stock: 2400, reorderPoint: 800, avgDailyUsage: 120, unitCostInr: 210, supplier: 'MetalCore Traders', status: 'in-stock' },
  { id: 'I-003', name: 'Copper Wire (4mm)', category: 'Electrical', unit: 'meters', stock: 0, reorderPoint: 500, avgDailyUsage: 80, unitCostInr: 45, supplier: 'WireWorks Ltd', status: 'out-of-stock' },
  { id: 'I-004', name: 'Hydraulic Oil', category: 'Consumables', unit: 'liters', stock: 1500, reorderPoint: 200, avgDailyUsage: 15, unitCostInr: 320, supplier: 'LubricantCo', status: 'overstock' },
  { id: 'I-005', name: 'Cement Bags (50kg)', category: 'Raw Material', unit: 'bags', stock: 180, reorderPoint: 100, avgDailyUsage: 25, unitCostInr: 380, supplier: 'BuildMaterials Inc', status: 'in-stock' },
  { id: 'I-006', name: 'Welding Rods', category: 'Consumables', unit: 'boxes', stock: 45, reorderPoint: 50, avgDailyUsage: 8, unitCostInr: 1200, supplier: 'WeldPro Supplies', status: 'low-stock' },
  { id: 'I-007', name: 'Bearings (6204-2RS)', category: 'Spare Parts', unit: 'units', stock: 320, reorderPoint: 60, avgDailyUsage: 4, unitCostInr: 180, supplier: 'BearingHub', status: 'in-stock' },
  { id: 'I-008', name: 'Rubber Gaskets', category: 'Spare Parts', unit: 'units', stock: 15, reorderPoint: 80, avgDailyUsage: 12, unitCostInr: 25, supplier: 'SealRight Mfg', status: 'low-stock' },
];

export const demoMaterialRequirements: MaterialRequirement[] = [
  { id: 'MR-001', material: 'Steel Sheets (2mm)', requiredQty: 200, availableQty: 80, shortfall: 120, productionLine: 'Line 2 — Stamping', dueDate: '2026-10-18' },
  { id: 'MR-002', material: 'Copper Wire (4mm)', requiredQty: 320, availableQty: 0, shortfall: 320, productionLine: 'Line 1 — Assembly', dueDate: '2026-10-17' },
  { id: 'MR-003', material: 'Welding Rods', requiredQty: 24, availableQty: 45, shortfall: 0, productionLine: 'Line 3 — Welding', dueDate: '2026-10-19' },
  { id: 'MR-004', material: 'Rubber Gaskets', requiredQty: 48, availableQty: 15, shortfall: 33, productionLine: 'Line 1 — Assembly', dueDate: '2026-10-18' },
];

// ─── Suppliers ──────────────────────────────────────────────────────────────

export const demoSuppliers: SupplierRecord[] = [
  { id: 'S-001', name: 'Tata Steel Supplies', category: 'Raw Materials', onTimeRate: 88, qualityScore: 92, avgPriceInr: 850, totalOrders: 142, activeOrders: 3, reliability: 'high', paymentTerms: 'Net 30' },
  { id: 'S-002', name: 'MetalCore Traders', category: 'Raw Materials', onTimeRate: 72, qualityScore: 78, avgPriceInr: 210, totalOrders: 88, activeOrders: 1, reliability: 'medium', paymentTerms: 'Net 15' },
  { id: 'S-003', name: 'WireWorks Ltd', category: 'Electrical', onTimeRate: 94, qualityScore: 89, avgPriceInr: 45, totalOrders: 210, activeOrders: 2, reliability: 'high', paymentTerms: 'Net 45' },
  { id: 'S-004', name: 'LubricantCo', category: 'Consumables', onTimeRate: 81, qualityScore: 85, avgPriceInr: 320, totalOrders: 56, activeOrders: 0, reliability: 'medium', paymentTerms: 'Net 30' },
  { id: 'S-005', name: 'BuildMaterials Inc', category: 'Construction', onTimeRate: 65, qualityScore: 70, avgPriceInr: 380, totalOrders: 34, activeOrders: 1, reliability: 'low', paymentTerms: 'Net 60' },
  { id: 'S-006', name: 'WeldPro Supplies', category: 'Consumables', onTimeRate: 90, qualityScore: 87, avgPriceInr: 1200, totalOrders: 67, activeOrders: 2, reliability: 'high', paymentTerms: 'Net 30' },
];

export const demoPriceComparison: PriceComparison[] = [
  {
    material: 'Steel Sheets (2mm)',
    suppliers: [
      { name: 'Tata Steel Supplies', priceInr: 850, leadTimeDays: 7 },
      { name: 'JSW Metal Hub', priceInr: 820, leadTimeDays: 12 },
      { name: 'SteelDirect', priceInr: 790, leadTimeDays: 18 },
    ],
    bestPriceInr: 790,
  },
  {
    material: 'Aluminium Ingots',
    suppliers: [
      { name: 'MetalCore Traders', priceInr: 210, leadTimeDays: 5 },
      { name: 'AluminiumMart', priceInr: 195, leadTimeDays: 10 },
      { name: 'Hindalco Supply', priceInr: 205, leadTimeDays: 4 },
    ],
    bestPriceInr: 195,
  },
  {
    material: 'Copper Wire (4mm)',
    suppliers: [
      { name: 'WireWorks Ltd', priceInr: 45, leadTimeDays: 3 },
      { name: 'CableWorld', priceInr: 42, leadTimeDays: 8 },
      { name: 'ElectriSupply', priceInr: 48, leadTimeDays: 2 },
    ],
    bestPriceInr: 42,
  },
];

// ─── Finance ────────────────────────────────────────────────────────────────

export const demoTransactions: FinanceTransaction[] = [
  { id: 'T-001', date: '2026-10-14', description: 'Steel Sheets Purchase', category: 'Raw Material', type: 'expense', amountInr: 68000, status: 'completed' },
  { id: 'T-002', date: '2026-10-14', description: 'Electricity Bill — October', category: 'Utilities', type: 'expense', amountInr: 168000, status: 'completed' },
  { id: 'T-003', date: '2026-10-13', description: 'Product Sale — Order #4471', category: 'Sales Revenue', type: 'income', amountInr: 340000, status: 'completed' },
  { id: 'T-004', date: '2026-10-12', description: 'Equipment Maintenance — Boiler B-01', category: 'Maintenance', type: 'expense', amountInr: 24000, status: 'completed' },
  { id: 'T-005', date: '2026-10-11', description: 'Salary — October (Partial)', category: 'Payroll', type: 'expense', amountInr: 420000, status: 'pending' },
  { id: 'T-006', date: '2026-10-10', description: 'Product Sale — Order #4468', category: 'Sales Revenue', type: 'income', amountInr: 285000, status: 'completed' },
  { id: 'T-007', date: '2026-10-09', description: 'Hydraulic Oil Restock', category: 'Consumables', type: 'expense', amountInr: 48000, status: 'completed' },
  { id: 'T-008', date: '2026-10-08', description: 'Product Sale — Order #4462', category: 'Sales Revenue', type: 'income', amountInr: 395000, status: 'overdue' },
];

export const demoInvoices: InvoiceRecord[] = [
  { id: 'INV-001', invoiceNo: 'INV-2026-04471', client: 'AutoComp Industries', issueDate: '2026-10-13', dueDate: '2026-10-28', amountInr: 340000, status: 'paid' },
  { id: 'INV-002', invoiceNo: 'INV-2026-04468', client: 'TextileHub Pvt Ltd', issueDate: '2026-10-10', dueDate: '2026-10-25', amountInr: 285000, status: 'pending' },
  { id: 'INV-003', invoiceNo: 'INV-2026-04462', client: 'CementCorp India', issueDate: '2026-10-08', dueDate: '2026-10-23', amountInr: 395000, status: 'overdue' },
  { id: 'INV-004', invoiceNo: 'INV-2026-04455', client: 'FoodPro Mfg', issueDate: '2026-10-05', dueDate: '2026-10-20', amountInr: 192000, status: 'paid' },
  { id: 'INV-005', invoiceNo: 'INV-2026-04450', client: 'AutoComp Industries', issueDate: '2026-10-02', dueDate: '2026-10-17', amountInr: 218000, status: 'pending' },
];

export const demoCashFlow: CashFlowPoint[] = [
  { label: 'Wk 1', inflow: 620000, outflow: 480000, net: 140000 },
  { label: 'Wk 2', inflow: 740000, outflow: 590000, net: 150000 },
  { label: 'Wk 3', inflow: 580000, outflow: 650000, net: -70000 },
  { label: 'Wk 4', inflow: 890000, outflow: 520000, net: 370000 },
  { label: 'Wk 5 (f)', inflow: 720000, outflow: 560000, net: 160000 },
  { label: 'Wk 6 (f)', inflow: 650000, outflow: 510000, net: 140000 },
];

export const demoCostBreakdown: ManufacturingCostBreakdown[] = [
  { category: 'Raw Materials', amountInr: 980000, percentage: 42, color: '#0d9488' },
  { category: 'Energy', amountInr: 420000, percentage: 18, color: '#f59e0b' },
  { category: 'Payroll', amountInr: 520000, percentage: 22, color: '#22c55e' },
  { category: 'Maintenance', amountInr: 180000, percentage: 8, color: '#64748b' },
  { category: 'Logistics', amountInr: 140000, percentage: 6, color: '#f97316' },
  { category: 'Other', amountInr: 100000, percentage: 4, color: '#94a3b8' },
];

export const demoInventoryMovements: InventoryMovement[] = [
  { id: 'MV-001', date: '2026-10-16 09:42', item: 'Aluminium Ingots', type: 'received', quantity: 1200, reference: 'PO-2026-118', by: 'Priya Shah' },
  { id: 'MV-002', date: '2026-10-16 08:15', item: 'Steel Sheets (2mm)', type: 'issued', quantity: 40, reference: 'Line 2 — Batch 447', by: 'Ravi Kumar' },
  { id: 'MV-003', date: '2026-10-15 17:30', item: 'Welding Rods', type: 'issued', quantity: 8, reference: 'Line 3 — Batch 446', by: 'Maya Singh' },
  { id: 'MV-004', date: '2026-10-15 14:05', item: 'Copper Wire (4mm)', type: 'adjusted', quantity: 25, reference: 'Cycle Count #39', by: 'Arjun Mehta' },
  { id: 'MV-005', date: '2026-10-14 11:20', item: 'Hydraulic Oil', type: 'received', quantity: 500, reference: 'PO-2026-113', by: 'Priya Shah' },
  { id: 'MV-006', date: '2026-10-14 09:10', item: 'Rubber Gaskets', type: 'returned', quantity: 12, reference: 'Return — Line 1', by: 'Ravi Kumar' },
  { id: 'MV-007', date: '2026-10-13 16:45', item: 'Steel Sheets (2mm)', type: 'issued', quantity: 80, reference: 'Line 2 — Batch 445', by: 'Ravi Kumar' },
];

export const demoAuditLogs: AuditLogRecord[] = [
  { id: 'AUD-001', timestamp: '2026-10-17 10:42:18', actor: 'Anika Rao', actorRole: 'Owner', action: 'Updated workspace settings', resource: 'Workspace', resourceId: 'WS-NWT-001', status: 'success', ipAddress: '192.168.1.24' },
  { id: 'AUD-002', timestamp: '2026-10-17 10:31:05', actor: 'Priya Shah', actorRole: 'Admin', action: 'Created purchase order', resource: 'Purchase Order', resourceId: 'PO-2026-118', status: 'success', ipAddress: '192.168.1.31' },
  { id: 'AUD-003', timestamp: '2026-10-17 09:58:44', actor: 'Ravi Kumar', actorRole: 'Operator', action: 'Issued inventory material', resource: 'Inventory', resourceId: 'MV-002', status: 'success', ipAddress: '192.168.1.48' },
  { id: 'AUD-004', timestamp: '2026-10-17 09:21:12', actor: 'Maya Singh', actorRole: 'Operator', action: 'Acknowledged machine alert', resource: 'Alert', resourceId: 'AL-003', status: 'success', ipAddress: '192.168.1.52' },
  { id: 'AUD-005', timestamp: '2026-10-16 18:04:33', actor: 'Arjun Mehta', actorRole: 'Viewer', action: 'Exported carbon ledger', resource: 'Carbon Ledger', resourceId: 'LEDGER-2026-10', status: 'success', ipAddress: '192.168.1.67' },
  { id: 'AUD-006', timestamp: '2026-10-16 16:47:09', actor: 'Priya Shah', actorRole: 'Admin', action: 'Changed supplier status', resource: 'Supplier', resourceId: 'S-005', status: 'warning', ipAddress: '192.168.1.31' },
  { id: 'AUD-007', timestamp: '2026-10-16 15:12:26', actor: 'Unknown session', actorRole: 'Unverified', action: 'Failed sign-in attempt', resource: 'Authentication', resourceId: 'AUTH-8842', status: 'failed', ipAddress: '203.0.113.42' },
  { id: 'AUD-008', timestamp: '2026-10-16 13:38:51', actor: 'Anika Rao', actorRole: 'Owner', action: 'Added workspace member', resource: 'Membership', resourceId: 'MEM-009', status: 'success', ipAddress: '192.168.1.24' },
  { id: 'AUD-009', timestamp: '2026-10-16 11:07:14', actor: 'Ravi Kumar', actorRole: 'Operator', action: 'Updated machine note', resource: 'Machine', resourceId: 'M-002', status: 'success', ipAddress: '192.168.1.48' },
  { id: 'AUD-010', timestamp: '2026-10-15 17:55:40', actor: 'Maya Singh', actorRole: 'Operator', action: 'Attempted restricted export', resource: 'Finance', resourceId: 'FIN-2026-10', status: 'failed', ipAddress: '192.168.1.52' },
];
