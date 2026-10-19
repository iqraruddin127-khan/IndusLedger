import { Zap, TrendingDown, ArrowRight, Info, Clock, IndianRupee, Download } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { BarChart } from '@/components/charts/BarChart';
import { LineChart } from '@/components/charts/LineChart';
import { useWorkspaceData } from '@/lib/workspaceData';
import { downloadPdfReport, downloadFile, toCsv } from '@/lib/exportUtils';
import type { EnergyShiftRecommendation } from '@/types';
import { demoShiftRecommendations as staticShiftRecommendations } from '@/data/demoData';

// Scale shift-recommendation savings proportionally when running on custom data
function scaleRecommendations(
  recs: EnergyShiftRecommendation[],
  currentDailyCost: number
): EnergyShiftRecommendation[] {
  const baselineDailyCost = 60_570; // demo dataset daily cost at default tariff
  const factor = baselineDailyCost > 0 ? currentDailyCost / baselineDailyCost : 1;
  return recs.map((r) => ({ ...r, potentialSavingInr: Math.max(1, Math.round(r.potentialSavingInr * factor)) }));
}

export function EnergyOptimizationPage() {
  // All figures derive from the global dataset + tariff-repriced hourly series
  const { data, pricedEnergyHourly, effectiveTariffSlots, kpis, can, attemptAction } = useWorkspaceData();
  // Slot rates follow the baseline tariff outside demo mode (scaled proportionally)
  const demoTariffSlots = effectiveTariffSlots;
  const demoShiftRecommendations = data.mode === 'demo'
    ? staticShiftRecommendations
    : scaleRecommendations(staticShiftRecommendations, kpis.energyDailyCost);

  const totalKwh = pricedEnergyHourly.reduce((s, d) => s + d.consumptionKwh, 0);
  const totalCost = pricedEnergyHourly.reduce((s, d) => s + d.costInr, 0);
  const peakKwh = pricedEnergyHourly.slice(9, 18).reduce((s, d) => s + d.consumptionKwh, 0);
  const offPeakKwh = pricedEnergyHourly.slice(0, 6).reduce((s, d) => s + d.consumptionKwh, 0) + pricedEnergyHourly.slice(22).reduce((s, d) => s + d.consumptionKwh, 0);
  const totalPotentialSavings = demoShiftRecommendations.reduce((s, r) => s + r.potentialSavingInr, 0);

  const exportAnalysis = () => {
    if (!attemptAction('ledger.export', { action: 'Exported energy optimization analysis', resource: 'Energy', resourceId: 'optimization-analysis' })) return;
    downloadPdfReport(
      'Energy Optimization Analysis',
      `Tariff ₹${data.baselines.energyRatePerKwh}/kWh · derived from the active dataset`,
      [
        { heading: 'Daily Totals', lines: [`Consumption: ${totalKwh.toLocaleString()} kWh`, `Cost: ₹${totalCost.toLocaleString()}`, `Peak usage (09–18h): ${peakKwh.toLocaleString()} kWh`, `Potential savings: ₹${totalPotentialSavings.toLocaleString()}/day`] },
        { heading: 'Tariff Structure', lines: demoTariffSlots.map((s) => `${s.label} (${s.hours}): ₹${s.ratePerKwh}/kWh`) },
        { heading: 'Load-Shift Opportunities', lines: demoShiftRecommendations.map((r) => `${r.operation}: shift ${r.kwhShifted} kWh → save ₹${r.potentialSavingInr}/day (${r.feasibility})`) },
      ],
      'energy-optimization-analysis'
    );
  };

  const exportHourlyCsv = () => {
    if (!attemptAction('ledger.export', { action: 'Exported hourly energy data (CSV)', resource: 'Energy', resourceId: 'hourly-consumption' })) return;
    downloadFile(
      toCsv(['Hour', 'Consumption (kWh)', 'Cost (INR)'], pricedEnergyHourly.map((d) => [d.label, d.consumptionKwh, d.costInr])),
      'indusledger-hourly-energy.csv',
      'text/csv;charset=utf-8;'
    );
  };

  const hourlyBarData = pricedEnergyHourly.map((d) => {
    const hour = parseInt(d.label);
    const isPeak = hour >= 9 && hour < 18;
    const isOffPeak = hour < 6 || hour >= 22;
    return {
      label: d.label,
      value: d.consumptionKwh,
      color: isPeak ? '#ef4444' : isOffPeak ? '#22c55e' : '#f59e0b',
    };
  });

  const costLineData = pricedEnergyHourly.map((d) => ({ label: d.label, value: d.costInr }));

  const feasibilityConfig: Record<EnergyShiftRecommendation['feasibility'], { label: string; color: string }> = {
    easy: { label: 'Easy', color: 'bg-success-50 text-success-300' },
    moderate: { label: 'Moderate', color: 'bg-warning-50 text-warning-300' },
    difficult: { label: 'Difficult', color: 'bg-danger-50 text-danger-300' },
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3 animate-fade-in">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-50 text-accent-300">
          <Zap className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-display text-xl font-bold text-ink-800">Energy Optimization</h1>
          <p className="text-sm text-ink-400">Analyze electricity costs and identify savings opportunities</p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Daily Consumption', value: `${totalKwh.toLocaleString()}`, unit: 'kWh', icon: Zap, accent: 'primary' },
          { label: 'Daily Cost', value: `₹${totalCost.toLocaleString()}`, unit: 'INR', icon: IndianRupee, accent: 'accent' },
          { label: 'Peak Usage', value: `${peakKwh.toLocaleString()}`, unit: 'kWh (09–18h)', icon: Clock, accent: 'danger' },
          { label: 'Potential Savings', value: `₹${totalPotentialSavings.toLocaleString()}`, unit: '/ day', icon: TrendingDown, accent: 'success' },
        ].map((stat, i) => {
          const colorMap: Record<string, string> = {
            primary: 'bg-primary-50 text-primary-300',
            accent: 'bg-accent-50 text-accent-300',
            danger: 'bg-danger-50 text-danger-300',
            success: 'bg-success-50 text-success-300',
          };
          const Icon = stat.icon;
          return (
            <Card key={stat.label} hover className="p-5 animate-fade-in-up" >
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colorMap[stat.accent]}`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="mt-3 text-xs font-medium text-ink-400">{stat.label}</p>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="font-display text-2xl font-bold text-ink-800">{stat.value}</span>
                {stat.unit && <span className="text-xs text-ink-400">{stat.unit}</span>}
              </div>
              <div style={{ animationDelay: `${i * 0.05}s` }} />
            </Card>
          );
        })}
      </div>

      {/* Tariff structure */}
      <Card>
        <CardHeader
          title="Electricity Tariff Structure"
          subtitle={`Blended rate ₹${totalKwh > 0 ? (totalCost / totalKwh).toFixed(2) : data.baselines.energyRatePerKwh}/kWh · ${
            data.mode === 'demo' ? 'sample industrial tariff — verify with your provider' : 'derived from your baseline tariff'
          }`}
          icon={<IndianRupee className="h-5 w-5" />}
          demo
          action={
            <div className="flex gap-2">
              <button type="button" onClick={exportHourlyCsv} className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 px-3 py-2 text-xs font-semibold text-ink-600 transition hover:border-primary-500 hover:bg-primary-50 hover:text-primary-300">
                <Download className="h-3.5 w-3.5" /> CSV
              </button>
              <button type="button" onClick={exportAnalysis} className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 px-3 py-2 text-xs font-semibold text-ink-600 transition hover:border-primary-500 hover:bg-primary-50 hover:text-primary-300">
                <Download className="h-3.5 w-3.5" /> Export Report
              </button>
            </div>
          }
        />
        <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-3">
          {demoTariffSlots.map((slot) => (
            <div key={slot.label} className="rounded-xl border border-ink-100 p-4">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ background: slot.color }} />
                <h4 className="text-sm font-semibold text-ink-700">{slot.label}</h4>
              </div>
              <p className="mt-2 text-xs text-ink-400">{slot.hours}</p>
              <p className="mt-3 font-display text-2xl font-bold" style={{ color: slot.color }}>
                ₹{slot.ratePerKwh}
              </p>
              <p className="text-xs text-ink-400">per kWh</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Hourly consumption bar chart */}
      <Card>
        <CardHeader
          title="Hourly Energy Consumption"
          subtitle="24-hour view — colored by tariff slot"
          icon={<Zap className="h-5 w-5" />}
          demo
        />
        <div className="p-5">
          <BarChart data={hourlyBarData} height={240} unit="kWh" />
          <div className="mt-3 flex items-center gap-4 px-12">
            <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-sm bg-danger-500" /><span className="text-xs text-ink-500">Peak (₹{demoTariffSlots.find((s) => s.label === 'Peak')?.ratePerKwh ?? 9}/kWh)</span></div>
            <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-sm bg-accent-500" /><span className="text-xs text-ink-500">Shoulder (₹{demoTariffSlots.find((s) => s.label === 'Shoulder')?.ratePerKwh ?? 6}/kWh)</span></div>
            <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-sm bg-success-500" /><span className="text-xs text-ink-500">Off-Peak (₹{demoTariffSlots.find((s) => s.label === 'Off-Peak')?.ratePerKwh ?? 3}/kWh)</span></div>
          </div>
        </div>
      </Card>

      {/* Hourly cost trend */}
      <Card>
        <CardHeader
          title="Hourly Cost Trend"
          subtitle="Electricity cost per hour — INR"
          icon={<TrendingDown className="h-5 w-5" />}
          demo
        />
        <div className="p-5">
          <LineChart data={costLineData} height={220} color="#f59e0b" unit="INR" yFormatter={(v) => `₹${Math.round(v)}`} />
        </div>
      </Card>

      {/* Peak vs Off-Peak comparison */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="font-display text-sm font-semibold text-ink-800">Peak vs Off-Peak Consumption</h3>
          <p className="mt-1 text-xs text-ink-400">Comparison of energy used during expensive vs cheap hours</p>
          <div className="mt-4 space-y-4">
            <div>
              <div className="flex justify-between text-sm">
                <span className="text-ink-600">Peak (09–18h)</span>
                <span className="font-semibold text-ink-800">{peakKwh} kWh</span>
              </div>
              <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-ink-100">
                <div className="h-full rounded-full bg-danger-500 transition-all duration-700" style={{ width: `${(peakKwh / totalKwh) * 100}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm">
                <span className="text-ink-600">Off-Peak (22–06h)</span>
                <span className="font-semibold text-ink-800">{offPeakKwh} kWh</span>
              </div>
              <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-ink-100">
                <div className="h-full rounded-full bg-success-500 transition-all duration-700" style={{ width: `${(offPeakKwh / totalKwh) * 100}%` }} />
              </div>
            </div>
          </div>
          <div className="mt-4 rounded-lg bg-ink-50 p-3">
            <p className="text-xs text-ink-500">
              Shifting 30% of peak load to off-peak could save approximately{' '}
              <span className="font-semibold text-success-300">₹{totalPotentialSavings.toLocaleString()}/day</span> based on sample tariff rates.
            </p>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-display text-sm font-semibold text-ink-800">Cost Split by Tariff</h3>
          <p className="mt-1 text-xs text-ink-400">How much you pay in each tariff band</p>
          <div className="mt-4 space-y-3">
            {demoTariffSlots.map((slot) => {
              const slotHours = slot.label === 'Peak' ? 9 : slot.label === 'Off-Peak' ? 8 : 7;
              const slotKwh = pricedEnergyHourly.filter((_, i) => {
                if (slot.label === 'Peak') return i >= 9 && i < 18;
                if (slot.label === 'Off-Peak') return i < 6 || i >= 22;
                return (i >= 6 && i < 9) || (i >= 18 && i < 22);
              }).reduce((s, d) => s + d.consumptionKwh, 0);
              const slotCost = slotKwh * slot.ratePerKwh;
              return (
                <div key={slot.label} className="flex items-center justify-between rounded-lg border border-ink-100 p-3">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ background: slot.color }} />
                    <div>
                      <p className="text-sm font-medium text-ink-700">{slot.label}</p>
                      <p className="text-xs text-ink-400">{slotKwh} kWh</p>
                    </div>
                  </div>
                  <span className="font-display text-sm font-bold text-ink-800">₹{slotCost.toLocaleString()}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Shift recommendations */}
      <Card>
        <CardHeader
          title="Load-Shifting Recommendations"
          subtitle="Move flexible operations to cheaper tariff periods"
          icon={<ArrowRight className="h-5 w-5" />}
          demo
        />
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-ink-100 text-left text-xs font-semibold uppercase tracking-wider text-ink-400">
                <th className="px-4 py-3">Operation</th>
                <th className="px-4 py-3">Current Slot</th>
                <th className="hidden px-4 py-3 md:table-cell">Suggested Slot</th>
                <th className="px-4 py-3">kWh Shifted</th>
                <th className="px-4 py-3">Saving</th>
                <th className="hidden px-4 py-3 sm:table-cell">Feasibility</th>
              </tr>
            </thead>
            <tbody>
              {demoShiftRecommendations.map((rec, i) => {
                const fc = feasibilityConfig[rec.feasibility];
                return (
                  <tr key={rec.id} className="border-b border-ink-50 hover:bg-ink-50 transition-colors animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
                    <td className="px-4 py-3 text-sm font-medium text-ink-700">{rec.operation}</td>
                    <td className="px-4 py-3 text-sm text-ink-500">{rec.currentSlot}</td>
                    <td className="hidden px-4 py-3 text-sm text-ink-500 md:table-cell">
                      <span className="flex items-center gap-1">
                        <ArrowRight className="h-3 w-3 text-success-500" />
                        {rec.suggestedSlot}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-ink-600">{rec.kwhShifted} kWh</td>
                    <td className="px-4 py-3 text-sm font-semibold text-success-300">₹{rec.potentialSavingInr.toLocaleString()}</td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${fc.color}`}>{fc.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="border-t border-ink-100 px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-ink-700">Total Daily Potential Savings</span>
          <span className="font-display text-lg font-bold text-success-300">₹{totalPotentialSavings.toLocaleString()}</span>
        </div>
      </Card>

      {/* Disclaimers */}
      <div className="rounded-xl border border-accent-500/40 bg-accent-50 px-5 py-4">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent-300" />
          <div className="text-xs text-accent-300 space-y-1">
            <p>Tariff rates shown are sample values for demonstration. Always verify actual rates with your electricity provider.</p>
            <p>Savings are estimates based on sample tariffs and assumed load-shifting volumes — not guaranteed savings.</p>
            <p>No automatic grid switching or machine control is implemented. All shifts require manual planning and human approval.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
