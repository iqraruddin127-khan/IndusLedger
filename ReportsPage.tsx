import { useState } from 'react';
import {
  FileBarChart, Download, FileSpreadsheet, FileText, Leaf, Zap, Package, Truck, Wallet,
} from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { useWorkspaceData } from '@/lib/workspaceData';
import { downloadPdfReport, downloadExcel } from '@/lib/exportUtils';

export function ReportsPage() {
  const { data, effectiveTariffSlots, kpis, can, attemptAction } = useWorkspaceData();
  const [feedback, setFeedback] = useState<string | null>(null);
  const canExport = can('reports.export');

  const buildSections = () => {
    const { inventory, suppliers, energyHourly, transactions } = data;
    const tariffSlots = effectiveTariffSlots;
    const totalKwh = energyHourly.reduce((s, d) => s + d.consumptionKwh, 0);
    const peakSlot = tariffSlots.find((t) => t.label === 'Peak');
    const peakKwh = energyHourly.filter((_, i) => i >= 9 && i < 18).reduce((s, d) => s + d.consumptionKwh, 0);
    const offPeakRate = tariffSlots.find((t) => t.label === 'Off-Peak')?.ratePerKwh ?? 3;

    return [
      {
        heading: 'Executive Overview',
        lines: [
          `Reporting period: ${new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' })}`,
          `Active machines: ${kpis.activeMachines}`,
          `Net profit: ₹${kpis.netProfit.toLocaleString()} (${kpis.profitMargin}% margin)`,
          `Total revenue: ₹${kpis.totalIncome.toLocaleString()}`,
          `Total expenses: ₹${kpis.totalExpense.toLocaleString()}`,
        ],
      },
      {
        heading: 'Monthly Energy Usage',
        lines: [
          `Total consumption (24h sample): ${totalKwh.toLocaleString()} kWh`,
          `Daily energy cost: ₹${kpis.energyDailyCost.toLocaleString()}`,
          `Peak-hour consumption (09–18): ${peakKwh.toLocaleString()} kWh at ₹${peakSlot?.ratePerKwh ?? '—'}/kWh`,
          `Estimated load-shift saving potential: ₹${kpis.potentialSavingsInr.toLocaleString()}/day`,
        ],
      },
      {
        heading: 'Carbon Ledger',
        lines: [
          `Carbon emitted (24h estimate): ${kpis.carbonDailyTons} tons CO₂`,
          `Emission factor in use: ${data.mode === 'demo' ? '0.71' : data.baselines.gridEmissionFactor} kg CO₂/kWh`,
          `Energy mix: grid ${Math.round((totalKwh * 0.8) / 100) / 10}k kWh, diesel and gas remainder (demo blend)`,
        ],
      },
      {
        heading: 'Inventory Valuation',
        lines: [
          `Total inventory value: ₹${kpis.inventoryValue.toLocaleString()}`,
          `SKUs tracked: ${inventory.length}`,
          `Items at or below reorder point: ${kpis.shortfalls}`,
          `Out-of-stock items: ${kpis.outOfStockCount}`,
        ],
      },
      {
        heading: 'Supplier Performance',
        lines: [
          `Active suppliers: ${suppliers.length}`,
          `Average on-time delivery: ${kpis.avgOnTimeRate}%`,
          `Average quality score: ${kpis.avgQuality}/100`,
          `High-risk suppliers: ${kpis.highRiskSuppliers}`,
          ...suppliers.slice(0, 5).map((s) => `${s.name}: on-time ${s.onTimeRate}%, quality ${s.qualityScore}/100, ${s.reliability} reliability`),
        ],
      },
      {
        heading: 'Financial Profit / Loss',
        lines: [
          `Income: ₹${kpis.totalIncome.toLocaleString()}`,
          `Expenses: ₹${kpis.totalExpense.toLocaleString()}`,
          `Net profit: ₹${kpis.netProfit.toLocaleString()}`,
          `Profit margin: ${kpis.profitMargin}%`,
          `Overdue invoices: ${kpis.overdueInvoices} worth ₹${Math.round(kpis.overdueInvoiceValue / 1000)}k`,
          ...transactions.slice(0, 4).map((t) => `${t.date} ${t.description}: ${t.type === 'income' ? '+' : '-'}₹${t.amountInr.toLocaleString()}`),
        ],
      },
    ];
  };

  const exportPdf = () => {
    if (!attemptAction('reports.export', { action: 'Exported executive summary (PDF)', resource: 'Reports', resourceId: 'executive-summary' })) {
      setFeedback('Your role does not permit exporting reports. This attempt has been recorded in the Audit Log.');
      setTimeout(() => setFeedback(null), 6000);
      return;
    }
    downloadPdfReport(
      'Executive Operations Summary',
      `IndusLedger AI · ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} · data mode: ${data.mode}`,
      buildSections(),
      'executive-summary'
    );
    setFeedback('Report generated — use your browser print dialog to save as PDF.');
    setTimeout(() => setFeedback(null), 6000);
  };

  const exportExcel = () => {
    if (!attemptAction('reports.export', { action: 'Exported executive summary (Excel)', resource: 'Reports', resourceId: 'executive-summary.xlsx' })) {
      setFeedback('Your role does not permit exporting reports. This attempt has been recorded in the Audit Log.');
      setTimeout(() => setFeedback(null), 6000);
      return;
    }
    downloadExcel(
      [
        { name: 'Overview', headers: ['Metric', 'Value'], rows: [
          ['Net profit (INR)', kpis.netProfit], ['Profit margin (%)', kpis.profitMargin],
          ['Daily energy cost (INR)', kpis.energyDailyCost], ['Carbon (t/day)', kpis.carbonDailyTons],
          ['Inventory value (INR)', kpis.inventoryValue], ['Avg on-time (%)', kpis.avgOnTimeRate],
        ] },
        { name: 'Inventory', headers: ['Item', 'Category', 'Stock', 'Reorder Pt', 'Unit Cost', 'Status'], rows: data.inventory.map((i) => [i.name, i.category, i.stock, i.reorderPoint, i.unitCostInr, i.status]) },
        { name: 'Suppliers', headers: ['Name', 'On-Time %', 'Quality', 'Avg Price', 'Reliability'], rows: data.suppliers.map((s) => [s.name, s.onTimeRate, s.qualityScore, s.avgPriceInr, s.reliability]) },
        { name: 'Transactions', headers: ['Date', 'Description', 'Type', 'Amount', 'Status'], rows: data.transactions.map((t) => [t.date, t.description, t.type, t.amountInr, t.status]) },
      ],
      'indusledger-executive-summary.xlsx'
    );
    setFeedback('Excel workbook downloaded.');
    setTimeout(() => setFeedback(null), 6000);
  };

  const moduleCards = [
    { icon: Zap, title: 'Energy & Tariff Analysis', detail: `₹${kpis.energyDailyCost.toLocaleString()}/day · ₹${kpis.potentialSavingsInr.toLocaleString()}/day saving potential` },
    { icon: Leaf, title: 'Carbon Compliance', detail: `${kpis.carbonDailyTons} t CO₂/day estimate · downloadable CSV log available in the module` },
    { icon: Package, title: 'Inventory Valuation', detail: `₹${Math.round(kpis.inventoryValue / 1000)}k on hand · ${kpis.shortfalls} items at reorder point` },
    { icon: Truck, title: 'Supplier Scorecard', detail: `${kpis.avgOnTimeRate}% avg on-time · ${kpis.highRiskSuppliers} high-risk vendors` },
    { icon: Wallet, title: 'Profit & Loss', detail: `₹${(kpis.netProfit / 100000).toFixed(1)}L net · ${kpis.profitMargin}% margin` },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
            <FileBarChart className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-ink-800">Reports</h1>
            <p className="text-sm text-ink-400">Executive summaries across energy, carbon, inventory, suppliers, and finance</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={exportExcel} className="inline-flex items-center gap-2 rounded-lg border border-ink-200 bg-ink-100 px-4 py-2.5 text-sm font-semibold text-ink-500 transition hover:border-primary-500 hover:text-primary-300">
            <FileSpreadsheet className="h-4 w-4" /> Excel
          </button>
          <button type="button" onClick={exportPdf} className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700">
            <FileText className="h-4 w-4" /> Export Report (PDF)
          </button>
        </div>
      </div>

      {feedback && (
        <div className={`rounded-xl border px-5 py-4 text-sm animate-fade-in ${feedback.includes('does not permit') ? 'border-danger-500/40 bg-danger-50 text-danger-300' : 'border-success-500/40 bg-success-50 text-success-300'}`}>
          {feedback}
        </div>
      )}

      <Card>
        <CardHeader title="Executive Summary Contents" subtitle="Every section below is included in the exported report" icon={<FileBarChart className="h-5 w-5" />} demo />
        <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2 lg:grid-cols-3">
          {moduleCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <div key={card.title} className="rounded-xl border border-ink-100 p-4 animate-fade-in-up" style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <h4 className="font-display text-sm font-semibold text-ink-800">{card.title}</h4>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-ink-500">{card.detail}</p>
              </div>
            );
          })}
          <div className="rounded-xl border border-dashed border-ink-200 p-4 text-center">
            <Download className="mx-auto h-5 w-5 text-ink-300" />
            <p className="mt-2 text-xs text-ink-400">Exports recalculate from your current data mode: {data.mode === 'demo' ? 'Demo' : data.mode === 'custom' ? 'Custom' : 'IoT'}</p>
          </div>
        </div>
      </Card>

      {!canExport && (
        <div className="rounded-xl border border-warning-200 bg-warning-50 px-5 py-4">
          <p className="text-sm text-warning-700">Your current role ({'{'}read-only{'}'}) cannot export reports. Contact an Owner or Admin.</p>
        </div>
      )}
    </div>
  );
}
