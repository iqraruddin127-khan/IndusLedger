import { Leaf, TrendingDown, Factory, Flame, Zap, Download } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { BarChart } from '@/components/charts/BarChart';
import { LineChart } from '@/components/charts/LineChart';
import { useWorkspaceData } from '@/lib/workspaceData';
import { demoCarbonLedger as staticCarbonLedger } from '@/data/demoData';

type CarbonEntry = (typeof staticCarbonLedger)[number];

// Recompute the ledger from the global emission factor: carbon = kWh × factor.
// Non-grid sources keep their relative intensity vs the grid factor.
function deriveCarbonLedger(
  staticLedger: CarbonEntry[],
  gridFactor: number,
  tariffRepricedKwh: number
): CarbonEntry[] {
  const demoGridKwh = staticLedger.filter((e) => e.source === 'Grid Electricity').reduce((s, e) => s + e.energyKwh, 0);
  const scale = demoGridKwh > 0 ? tariffRepricedKwh / demoGridKwh : 1;
  return staticLedger.map((entry) => {
    // Grid entries reprice to the user's factor; diesel/gas keep physical constants.
    // kWh scales with the live hourly series so imports and baselines flow through.
    const sourceFactor = entry.source === 'Grid Electricity' ? gridFactor : entry.emissionFactor;
    const energyKwh = Math.round(entry.energyKwh * scale);
    return { ...entry, energyKwh, emissionFactor: sourceFactor, carbonKg: Math.round(energyKwh * sourceFactor) };
  });
}

function downloadCarbonCsv(ledger: CarbonEntry[]): void {
  const headers = ['Date', 'Source', 'Energy (kWh)', 'Emission Factor (kg CO2/kWh)', 'Carbon (kg CO2)'];
  const rows = ledger.map((entry) => [entry.date, entry.source, entry.energyKwh, entry.emissionFactor, entry.carbonKg]);
  const csv = [headers, ...rows].map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'indusledger-carbon-compliance-log.csv';
  anchor.click();
  URL.revokeObjectURL(url);
}

export function EnergyLedgerPage() {
  const { data, pricedEnergyHourly } = useWorkspaceData();
  const totalHourlyKwh = pricedEnergyHourly.reduce((s, d) => s + d.consumptionKwh, 0);
  const demoCarbonLedger = deriveCarbonLedger(
    staticCarbonLedger,
    data.baselines.gridEmissionFactor,
    totalHourlyKwh
  );
  const totalKwh = demoCarbonLedger.reduce((s, e) => s + e.energyKwh, 0);
  const totalCarbon = demoCarbonLedger.reduce((s, e) => s + e.carbonKg, 0);
  const totalCarbonTons = (totalCarbon / 1000).toFixed(2);

  // Group by source for chart
  const sourceMap: Record<string, { kwh: number; carbon: number }> = {};
  demoCarbonLedger.forEach((e) => {
    if (!sourceMap[e.source]) sourceMap[e.source] = { kwh: 0, carbon: 0 };
    sourceMap[e.source].kwh += e.energyKwh;
    sourceMap[e.source].carbon += e.carbonKg;
  });
  const sourceColors: Record<string, string> = {
    'Grid Electricity': '#0d9488',
    'Diesel Generator': '#f97316',
    'Natural Gas — Furnace': '#64748b',
  };
  const sourceChartData = Object.entries(sourceMap).map(([name, data]) => ({
    label: name.split(' ')[0],
    value: data.carbon,
    color: sourceColors[name] ?? '#94a3b8',
  }));

  // Daily trend
  const dailyMap: Record<string, { kwh: number; carbon: number }> = {};
  [...demoCarbonLedger].reverse().forEach((e) => {
    if (!dailyMap[e.date]) dailyMap[e.date] = { kwh: 0, carbon: 0 };
    dailyMap[e.date].kwh += e.energyKwh;
    dailyMap[e.date].carbon += e.carbonKg;
  });
  const dailyLineData = Object.entries(dailyMap).map(([date, data]) => ({
    label: date.slice(5),
    value: data.carbon,
  }));

  const sourceIconMap: Record<string, typeof Zap> = {
    'Grid Electricity': Zap,
    'Diesel Generator': Factory,
    'Natural Gas — Furnace': Flame,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 animate-fade-in">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-success-50 text-success-300">
          <Leaf className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-display text-xl font-bold text-ink-800">Energy & Carbon Ledger</h1>
          <p className="text-sm text-ink-400">Track energy usage and estimated carbon emissions over time</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: 'Total Energy (7d)', value: `${totalKwh.toLocaleString()}`, unit: 'kWh', icon: Zap, color: 'bg-primary-50 text-primary-300' },
          { label: 'Carbon Emitted (7d)', value: totalCarbonTons, unit: 'tons CO₂', icon: Leaf, color: 'bg-success-50 text-success-300' },
          { label: 'Avg Emission Factor', value: String(data.baselines.gridEmissionFactor), unit: 'kg CO₂/kWh (grid)', icon: TrendingDown, color: 'bg-accent-50 text-accent-300' },
        ].map((stat) => {
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
            </Card>
          );
        })}
      </div>

      {/* Daily carbon trend */}
      <Card>
        <CardHeader
          title="Daily Carbon Emissions"
          subtitle="Estimated CO₂ output per day — last 7 days"
          icon={<Leaf className="h-5 w-5" />}
          demo
        />
        <div className="p-5">
          <LineChart data={dailyLineData} height={220} color="#22c55e" unit="kg CO₂" yFormatter={(v) => `${Math.round(v)}`} />
        </div>
      </Card>

      {/* Emissions by source */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Emissions by Source" subtitle="Carbon output broken down by energy source" icon={<Factory className="h-5 w-5" />} demo />
          <div className="p-5">
            <BarChart data={sourceChartData} height={220} unit="kg CO₂" />
          </div>
        </Card>

        <Card>
          <CardHeader title="Source Breakdown" subtitle="Energy mix and emission factors" icon={<Zap className="h-5 w-5" />} demo />
          <div className="p-5 space-y-3">
            {Object.entries(sourceMap).map(([source, data]) => {
              const Icon = sourceIconMap[source] ?? Zap;
              const share = ((data.carbon / totalCarbon) * 100).toFixed(0);
              return (
                <div key={source} className="rounded-lg border border-ink-100 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-50 text-ink-500">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-ink-700">{source}</p>
                      <p className="text-xs text-ink-400">{data.kwh.toLocaleString()} kWh · {share}% of emissions</p>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-sm font-bold text-ink-800">{(data.carbon / 1000).toFixed(2)} t</p>
                      <p className="text-xs text-ink-400">CO₂</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Ledger table */}
      <Card>
        <CardHeader
          title="Carbon Ledger Entries"
          subtitle="Recorded energy usage and estimated emissions"
          icon={<Leaf className="h-5 w-5" />}
          demo
          action={
            <button
              type="button"
              onClick={() => downloadCarbonCsv(demoCarbonLedger)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 px-3 py-2 text-xs font-semibold text-ink-600 transition hover:border-primary-500 hover:bg-primary-50 hover:text-primary-300"
            >
              <Download className="h-3.5 w-3.5" />
              Download CSV
            </button>
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-ink-100 text-left text-xs font-semibold uppercase tracking-wider text-ink-400">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Energy (kWh)</th>
                <th className="hidden px-4 py-3 md:table-cell">Emission Factor</th>
                <th className="px-4 py-3">CO₂ (kg)</th>
              </tr>
            </thead>
            <tbody>
              {demoCarbonLedger.map((entry, i) => (
                <tr key={entry.id} className="border-b border-ink-50 hover:bg-ink-50 transition-colors animate-fade-in" style={{ animationDelay: `${i * 0.04}s` }}>
                  <td className="px-4 py-3 text-sm text-ink-600">{entry.date}</td>
                  <td className="px-4 py-3 text-sm font-medium text-ink-700">{entry.source}</td>
                  <td className="px-4 py-3 text-sm text-ink-600">{entry.energyKwh.toLocaleString()}</td>
                  <td className="hidden px-4 py-3 text-sm text-ink-500 md:table-cell">{entry.emissionFactor} kg/kWh</td>
                  <td className="px-4 py-3 text-sm font-semibold text-ink-700">{entry.carbonKg.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-ink-100 px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-ink-700">Total (7 days)</span>
          <div className="text-right">
            <span className="font-display text-lg font-bold text-ink-800">{totalKwh.toLocaleString()} kWh</span>
            <span className="ml-3 font-display text-lg font-bold text-success-300">{totalCarbonTons} t CO₂</span>
          </div>
        </div>
      </Card>

      {/* Disclaimer */}
      <div className="rounded-xl border border-accent-500/40 bg-accent-50 px-5 py-4">
        <div className="flex items-start gap-3">
          <Leaf className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent-300" />
          <div className="text-xs text-accent-300 space-y-1">
            <p>Grid entries use your configured emission factor ({data.baselines.gridEmissionFactor} kg CO₂/kWh — editable in Settings). Diesel: 2.68, Natural Gas: 1.89 kg CO₂/kWh (physical constants).</p>
            <p>Carbon figures are estimates, not verified measurements. For compliance reporting, use government-published emission factors.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
