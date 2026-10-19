import { Truck, Award, Clock, CheckCircle2, AlertCircle, Download } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { BarChart } from '@/components/charts/BarChart';
import { SupplierEditorButton } from '@/components/editors/SupplierEditor';
import { useWorkspaceData } from '@/lib/workspaceData';
import { downloadPdfReport } from '@/lib/exportUtils';
import { demoSuppliers, demoPriceComparison } from '@/data/demoData';
import type { SupplierRecord } from '@/types';

const reliabilityConfig: Record<SupplierRecord['reliability'], { label: string; badge: string }> = {
  high: { label: 'High', badge: 'bg-success-50 text-success-700' },
  medium: { label: 'Medium', badge: 'bg-warning-50 text-warning-700' },
  low: { label: 'Low', badge: 'bg-danger-50 text-danger-700' },
};

export function SuppliersPage() {
  const { data, can, attemptAction } = useWorkspaceData();
  const demoSuppliers = data.suppliers;
  const canEdit = can('suppliers.edit');

  const exportReport = () => {
    if (!attemptAction('reports.export', { action: 'Exported supplier performance report', resource: 'Suppliers', resourceId: 'supplier-report' })) return;
    downloadPdfReport(
      'Supplier Performance Report',
      `${demoSuppliers.length} suppliers · generated from the active workspace dataset`,
      [
        {
          heading: 'Supplier Summary',
          lines: demoSuppliers.map((s) => `${s.name} (${s.category}): on-time ${s.onTimeRate}%, quality ${s.qualityScore}/100, avg ₹${s.avgPriceInr}, ${s.reliability} reliability`),
        },
        { heading: 'Overall', lines: [`Average on-time rate: ${Math.round(demoSuppliers.reduce((s, x) => s + x.onTimeRate, 0) / Math.max(1, demoSuppliers.length))}%`, `High-risk suppliers: ${demoSuppliers.filter((s) => s.reliability === 'low').length}`] },
      ],
      'supplier-performance-report'
    );
  };

  const avgOnTime = Math.round(demoSuppliers.reduce((s, sup) => s + sup.onTimeRate, 0) / demoSuppliers.length);
  const avgQuality = Math.round(demoSuppliers.reduce((s, sup) => s + sup.qualityScore, 0) / demoSuppliers.length);
  const activeOrders = demoSuppliers.reduce((s, sup) => s + sup.activeOrders, 0);

  const onTimeBarData = demoSuppliers.map((s) => ({
    label: s.name.split(' ')[0].slice(0, 8),
    value: s.onTimeRate,
    color: s.onTimeRate >= 85 ? '#22c55e' : s.onTimeRate >= 70 ? '#f59e0b' : '#ef4444',
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 animate-fade-in">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
          <Truck className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-display text-xl font-bold text-ink-800">Supplier Intelligence</h1>
          <p className="text-sm text-ink-400">Compare prices, delivery performance, and supplier reliability</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Active Suppliers', value: `${demoSuppliers.length}`, unit: 'partners', icon: Truck, color: 'bg-primary-50 text-primary-600' },
          { label: 'Avg On-Time Rate', value: `${avgOnTime}%`, unit: 'all suppliers', icon: Clock, color: 'bg-success-50 text-success-600' },
          { label: 'Avg Quality Score', value: `${avgQuality}`, unit: 'out of 100', icon: Award, color: 'bg-accent-50 text-accent-600' },
          { label: 'Active Orders', value: `${activeOrders}`, unit: 'in transit', icon: CheckCircle2, color: 'bg-warning-50 text-warning-600' },
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

      {/* On-time performance chart */}
      <Card>
        <CardHeader title="On-Time Delivery Performance" subtitle="Percentage of orders delivered on time" icon={<Clock className="h-5 w-5" />} demo />
        <div className="p-5">
          <BarChart data={onTimeBarData} height={220} unit="%" />
        </div>
      </Card>

      {/* Supplier comparison table */}
      <Card>
        <CardHeader
          title="Supplier Comparison"
          subtitle="Delivery performance, quality scores, and reliability ratings"
          icon={<Award className="h-5 w-5" />}
          demo
          action={
            <div className="flex items-center gap-2">
              <button type="button" onClick={exportReport} className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 px-3 py-2 text-xs font-semibold text-ink-600 transition hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700">
                <Download className="h-3.5 w-3.5" /> Export Report
              </button>
              <SupplierEditorButton label="Add Supplier" />
            </div>
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-ink-100 text-left text-xs font-semibold uppercase tracking-wider text-ink-400">
                <th className="px-4 py-3">Supplier</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">On-Time</th>
                <th className="hidden px-4 py-3 sm:table-cell">Quality</th>
                <th className="hidden px-4 py-3 md:table-cell">Avg Price</th>
                <th className="hidden px-4 py-3 lg:table-cell">Orders</th>
                <th className="hidden px-4 py-3 lg:table-cell">Terms</th>
                <th className="px-4 py-3">Reliability</th>
              </tr>
            </thead>
            <tbody>
              {demoSuppliers.map((sup, i) => {
                const rc = reliabilityConfig[sup.reliability];
                return (
                  <tr key={sup.id} className="border-b border-ink-50 hover:bg-ink-50 transition-colors animate-fade-in" style={{ animationDelay: `${i * 0.03}s` }}>
                    <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-ink-700">{sup.name}</p>
                            <p className="text-xs text-ink-400">{sup.activeOrders} active orders</p>
                          </div>
                          <SupplierEditorButton supplier={sup} />
                        </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-ink-500">{sup.category}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-ink-100">
                          <div
                            className={`h-full rounded-full ${sup.onTimeRate >= 85 ? 'bg-success-400' : sup.onTimeRate >= 70 ? 'bg-warning-400' : 'bg-danger-500'}`}
                            style={{ width: `${sup.onTimeRate}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-ink-700">{sup.onTimeRate}%</span>
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 text-sm text-ink-600 sm:table-cell">{sup.qualityScore}/100</td>
                    <td className="hidden px-4 py-3 text-sm text-ink-600 md:table-cell">₹{sup.avgPriceInr}</td>
                    <td className="hidden px-4 py-3 text-sm text-ink-500 lg:table-cell">{sup.totalOrders}</td>
                    <td className="hidden px-4 py-3 text-sm text-ink-500 lg:table-cell">{sup.paymentTerms}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${rc.badge}`}>{rc.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Price comparison cards */}
      <Card>
        <CardHeader
          title="Price Comparison by Material"
          subtitle="Best available price and lead time across suppliers"
          icon={<Truck className="h-5 w-5" />}
          demo
        />
        <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2 lg:grid-cols-3">
          {demoPriceComparison.map((pc) => (
            <div key={pc.material} className="rounded-xl border border-ink-100 p-4">
              <h4 className="text-sm font-semibold text-ink-700">{pc.material}</h4>
              <div className="mt-3 space-y-2">
                {pc.suppliers.map((s) => {
                  const isBest = s.priceInr === pc.bestPriceInr;
                  return (
                    <div key={s.name} className={`flex items-center justify-between rounded-lg p-2.5 ${isBest ? 'bg-success-50 border border-success-200' : 'bg-ink-50'}`}>
                      <div>
                        <p className="text-sm font-medium text-ink-700">{s.name}</p>
                        <p className="text-xs text-ink-400">{s.leadTimeDays} days lead</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {isBest && <CheckCircle2 className="h-4 w-4 text-success-500" />}
                        <span className={`text-sm font-bold ${isBest ? 'text-success-700' : 'text-ink-700'}`}>₹{s.priceInr}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Disclaimer */}
      <div className="rounded-xl border border-accent-200 bg-accent-50 px-5 py-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent-600" />
          <div className="text-xs text-accent-700 space-y-1">
            <p>Supplier data shown is synthetic demo data for layout and comparison. Real supplier performance tracking requires integration with your procurement system.</p>
            <p>Prices are sample values and do not reflect current market rates. Always confirm pricing directly with suppliers before ordering.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
