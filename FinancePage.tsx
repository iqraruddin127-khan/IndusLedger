import { Wallet, TrendingUp, TrendingDown, FileText, Clock, PieChart as PieIcon, Download } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { LineChart } from '@/components/charts/LineChart';
import { BarChart } from '@/components/charts/BarChart';
import { DonutChart } from '@/components/charts/DonutChart';
import { InvoiceEditorButton } from '@/components/editors/InvoiceEditor';
import { useWorkspaceData } from '@/lib/workspaceData';
import { downloadPdfReport, downloadExcel } from '@/lib/exportUtils';
import {
  demoTransactions,
  demoInvoices,
  demoCashFlow,
  demoCostBreakdown,
} from '@/data/demoData';
import type { FinanceTransaction, InvoiceRecord } from '@/types';

const txStatusConfig: Record<FinanceTransaction['status'], { label: string; badge: string }> = {
  completed: { label: 'Completed', badge: 'bg-success-50 text-success-300' },
  pending: { label: 'Pending', badge: 'bg-warning-50 text-warning-300' },
  overdue: { label: 'Overdue', badge: 'bg-danger-50 text-danger-300' },
};

const invoiceStatusConfig: Record<InvoiceRecord['status'], { label: string; badge: string }> = {
  paid: { label: 'Paid', badge: 'bg-success-50 text-success-300' },
  pending: { label: 'Pending', badge: 'bg-warning-50 text-warning-300' },
  overdue: { label: 'Overdue', badge: 'bg-danger-50 text-danger-300' },
};

export function FinancePage() {
  const { data, kpis, can, attemptAction } = useWorkspaceData();
  const demoTransactions = data.transactions;
  const demoInvoices = data.invoices;
  const canEdit = can('finance.edit');

  const totalIncome = kpis.totalIncome;
  const totalExpense = kpis.totalExpense;
  const netProfit = kpis.netProfit;
  const margin = kpis.profitMargin.toFixed(1);

  const pendingInvoices = demoInvoices.filter((i) => i.status === 'pending').reduce((s, i) => s + i.amountInr, 0);
  const overdueInvoices = kpis.overdueInvoiceValue;

  const exportPnl = () => {
    if (!attemptAction('finance.export', { action: 'Exported P&L statement', resource: 'Finance', resourceId: 'pnl-statement' })) return;
    downloadPdfReport(
      'Profit & Loss Statement',
      `Period totals from the active workspace dataset · margin ${margin}%`,
      [
        { heading: 'Income', lines: [`Total revenue: ₹${totalIncome.toLocaleString()}`, `Invoices outstanding (pending): ₹${Math.round(pendingInvoices / 1000)}k`, `Invoices overdue: ₹${Math.round(overdueInvoices / 1000)}k`] },
        { heading: 'Expenses', lines: [`Total expenses: ₹${totalExpense.toLocaleString()}`, ...demoTransactions.filter((t) => t.type === 'expense').slice(0, 6).map((t) => `${t.description} (${t.date}): ₹${t.amountInr.toLocaleString()}`)] },
        { heading: 'Profit', lines: [`Net profit: ₹${netProfit.toLocaleString()}`, `Profit margin: ${margin}%`] },
      ],
      'profit-loss-statement'
    );
  };

  const exportExcel = () => {
    if (!attemptAction('finance.export', { action: 'Exported transactions workbook', resource: 'Finance', resourceId: 'transactions.xlsx' })) return;
    downloadExcel(
      [
        { name: 'Transactions', headers: ['Date', 'Description', 'Category', 'Type', 'Amount (INR)', 'Status'], rows: demoTransactions.map((t) => [t.date, t.description, t.category, t.type, t.amountInr, t.status]) },
        { name: 'Invoices', headers: ['Invoice #', 'Client', 'Issued', 'Due', 'Amount (INR)', 'Status'], rows: demoInvoices.map((i) => [i.invoiceNo, i.client, i.issueDate, i.dueDate, i.amountInr, i.status]) },
      ],
      'indusledger-finance.xlsx'
    );
  };

  const cashFlowLineData = demoCashFlow.map((d) => ({ label: d.label, value: d.net }));
  const cashFlowBarData = demoCashFlow.map((d) => ({
    label: d.label,
    value: d.inflow,
    color: '#22c55e',
  }));

  const totalCost = demoCostBreakdown.reduce((s, c) => s + c.amountInr, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 animate-fade-in">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-300">
          <Wallet className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-display text-xl font-bold text-ink-800">Finance</h1>
          <p className="text-sm text-ink-400">Expenses, invoices, cash-flow forecasts, and manufacturing costs</p>
        </div>
      </div>

      {/* Financial summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Revenue', value: `₹${(totalIncome / 1000).toFixed(0)}k`, unit: 'this period', icon: TrendingUp, color: 'bg-success-50 text-success-300' },
          { label: 'Total Expenses', value: `₹${(totalExpense / 1000).toFixed(0)}k`, unit: 'this period', icon: TrendingDown, color: 'bg-danger-50 text-danger-300' },
          { label: 'Net Profit', value: `₹${(netProfit / 1000).toFixed(0)}k`, unit: `${margin}% margin`, icon: Wallet, color: netProfit >= 0 ? 'bg-primary-50 text-primary-300' : 'bg-warning-50 text-warning-300' },
          { label: 'Outstanding', value: `₹${((pendingInvoices + overdueInvoices) / 1000).toFixed(0)}k`, unit: 'pending + overdue', icon: Clock, color: 'bg-accent-50 text-accent-300' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} hover className="p-5 animate-fade-in-up">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="mt-3 text-xs font-medium text-ink-400">{stat.label}</p>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="font-display text-2xl font-bold text-ink-800">{stat.value}</span>
                <span className="text-xs text-ink-400">{stat.unit}</span>
              </div>
              <div style={{ animationDelay: `${i * 0.05}s` }} />
            </Card>
          );
        })}
      </div>

      {/* Cash flow */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Cash Flow Forecast" subtitle="Weekly inflow, outflow, and net — incl. 2-week forecast" icon={<TrendingUp className="h-5 w-5" />} demo />
          <div className="p-5">
            <LineChart data={cashFlowLineData} height={220} color="#0d9488" unit="INR" yFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
          </div>
        </Card>

        <Card>
          <CardHeader title="Weekly Inflow" subtitle="Revenue inflow by week" icon={<TrendingUp className="h-5 w-5" />} demo />
          <div className="p-5">
            <BarChart data={cashFlowBarData} height={220} unit="INR" />
          </div>
        </Card>
      </div>

      {/* Cost breakdown */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Manufacturing Cost Breakdown" subtitle="Where your production money goes" icon={<PieIcon className="h-5 w-5" />} demo />
          <div className="flex items-center justify-center p-5">
            <DonutChart
              data={demoCostBreakdown.map((c) => ({ label: c.category, value: c.percentage, color: c.color }))}
              centerValue={`₹${(totalCost / 100000).toFixed(1)}L`}
              centerLabel="Total Cost"
            />
          </div>
        </Card>

        <Card>
          <CardHeader title="Cost Category Detail" subtitle="Amount and share by category" icon={<Wallet className="h-5 w-5" />} demo />
          <div className="p-5 space-y-3">
            {demoCostBreakdown.map((c) => (
              <div key={c.category} className="rounded-lg border border-ink-100 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-sm" style={{ background: c.color }} />
                    <span className="text-sm font-medium text-ink-700">{c.category}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-display text-sm font-bold text-ink-800">₹{(c.amountInr / 1000).toFixed(0)}k</span>
                    <span className="ml-2 text-xs text-ink-400">{c.percentage}%</span>
                  </div>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-100">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${c.percentage}%`, background: c.color }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent transactions */}
      <Card>
        <CardHeader
          title="Recent Transactions"
          subtitle="Expense and income records"
          icon={<Wallet className="h-5 w-5" />}
          demo
        />
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-ink-100 text-left text-xs font-semibold uppercase tracking-wider text-ink-400">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Description</th>
                <th className="hidden px-4 py-3 sm:table-cell">Category</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Amount</th>
                <th className="hidden px-4 py-3 md:table-cell">Status</th>
              </tr>
            </thead>
            <tbody>
              {demoTransactions.map((tx, i) => {
                const sc = txStatusConfig[tx.status];
                return (
                  <tr key={tx.id} className="border-b border-ink-50 hover:bg-ink-50 transition-colors animate-fade-in" style={{ animationDelay: `${i * 0.03}s` }}>
                    <td className="px-4 py-3 text-sm text-ink-500">{tx.date}</td>
                    <td className="px-4 py-3 text-sm font-medium text-ink-700">{tx.description}</td>
                    <td className="hidden px-4 py-3 text-sm text-ink-500 sm:table-cell">{tx.category}</td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-medium ${tx.type === 'income' ? 'text-success-300' : 'text-danger-500'}`}>
                        {tx.type === 'income' ? '+' : '−'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-ink-700">
                      {tx.type === 'income' ? '+' : '−'}₹{tx.amountInr.toLocaleString()}
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${sc.badge}`}>{sc.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Invoices */}
      <Card>
        <CardHeader
          title="Invoice Management"
          subtitle="Outstanding and paid invoices"
          icon={<FileText className="h-5 w-5" />}
          demo
          action={
            <div className="flex items-center gap-2">
              <button type="button" onClick={exportExcel} className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 px-3 py-2 text-xs font-semibold text-ink-600 transition hover:border-primary-500 hover:bg-primary-50 hover:text-primary-300">
                <Download className="h-3.5 w-3.5" /> Excel
              </button>
              <button type="button" onClick={exportPnl} className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 px-3 py-2 text-xs font-semibold text-ink-600 transition hover:border-primary-500 hover:bg-primary-50 hover:text-primary-300">
                <Download className="h-3.5 w-3.5" /> P&L PDF
              </button>
              {canEdit && <InvoiceEditorButton mode="add" />}
            </div>
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-ink-100 text-left text-xs font-semibold uppercase tracking-wider text-ink-400">
                <th className="px-4 py-3">Invoice #</th>
                <th className="px-4 py-3">Client</th>
                <th className="hidden px-4 py-3 sm:table-cell">Issued</th>
                <th className="hidden px-4 py-3 md:table-cell">Due Date</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {demoInvoices.map((inv, i) => {
                const sc = invoiceStatusConfig[inv.status];
                return (
                  <tr key={inv.id} className="border-b border-ink-50 hover:bg-ink-50 transition-colors animate-fade-in" style={{ animationDelay: `${i * 0.04}s` }}>
                    <td className="px-4 py-3 text-sm font-mono text-ink-700">{inv.invoiceNo}</td>
                    <td className="px-4 py-3 text-sm font-medium text-ink-700">{inv.client}</td>
                    <td className="hidden px-4 py-3 text-sm text-ink-500 sm:table-cell">{inv.issueDate}</td>
                    <td className="hidden px-4 py-3 text-sm text-ink-500 md:table-cell">
                      <span className={`flex items-center gap-1 ${inv.status === 'overdue' ? 'text-danger-300 font-medium' : ''}`}>
                        {inv.status === 'overdue' && <Clock className="h-3 w-3" />}
                        {inv.dueDate}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-ink-700">₹{inv.amountInr.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${sc.badge}`}>{sc.label}</span>
                        {canEdit && (inv.status === 'pending' || inv.status === 'paid') && <InvoiceEditorButton invoice={inv} mode="toggle" />}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Disclaimer */}
      <div className="rounded-xl border border-accent-500/40 bg-accent-50 px-5 py-4">
        <div className="flex items-start gap-3">
          <Clock className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent-300" />
          <div className="text-xs text-accent-300 space-y-1">
            <p>All financial figures are synthetic demo data. No real transactions, balances, or invoices are shown.</p>
            <p>Cash-flow forecasts are based on assumed patterns and do not represent actual financial projections.</p>
            <p>Consequential financial actions (payments, approvals) require human review — no automated financial operations are implemented.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
