import { useMemo, useState } from 'react';
import { FlaskConical, Zap, Package, TrendingUp, Play, RotateCcw } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { BarChart } from '@/components/charts/BarChart';
import { useWorkspaceData } from '@/lib/workspaceData';

interface Scenario {
  peakShiftPercent: number;
  tariffChange: number;
  productionChange: number;
  materialPriceChange: number;
}

const DEFAULT_SCENARIO: Scenario = { peakShiftPercent: 0, tariffChange: 0, productionChange: 0, materialPriceChange: 0 };

export function SimulatorPage() {
  const { data, kpis, can, logAction } = useWorkspaceData();
  const [scenario, setScenario] = useState<Scenario>(DEFAULT_SCENARIO);
  const [ran, setRan] = useState(false);
  const canRun = can('simulator.run');

  const result = useMemo(() => {
    const { peakShiftPercent, tariffChange, productionChange, materialPriceChange } = scenario;
    const mult = 1 + productionChange / 100;

    // Energy: shifting X% of peak load to off-peak, plus tariff change on the blended rate
    const baseSavings = kpis.potentialSavingsInr * (peakShiftPercent / 30);
    const tariffEffect = kpis.energyDailyCost * (tariffChange / 100);
    const energyDailyCost = Math.max(0, Math.round((kpis.energyDailyCost + tariffEffect) * mult - baseSavings));
    const monthlySaving = Math.round(baseSavings * 30);

    // Material cost scales with production and price change
    const materialShare = 0.42;
    const materialBase = kpis.totalExpense * materialShare;
    const materialCost = materialBase * mult * (1 + materialPriceChange / 100);
    const otherExpense = kpis.totalExpense * (1 - materialShare);
    const totalExpense = Math.round(materialCost + otherExpense);

    // Revenue scales with production
    const revenue = Math.round(kpis.totalIncome * mult);
    const netProfit = revenue - totalExpense;
    const margin = revenue > 0 ? Number(((netProfit / revenue) * 100).toFixed(1)) : 0;

    // Carbon moves with grid use
    const carbon = Number((kpis.carbonDailyTons * mult * (1 - peakShiftPercent / 100 * 0.15)).toFixed(2));

    // Stock cover shortens if production rises
    const coverDays = data.inventory
      .filter((i) => i.avgDailyUsage > 0)
      .map((i) => ({ name: i.name, days: Math.floor((i.stock / (i.avgDailyUsage * mult))) }))
      .sort((a, b) => a.days - b.days)
      .slice(0, 6);

    return { energyDailyCost, monthlySaving, totalExpense, revenue, netProfit, margin, carbon, coverDays };
  }, [scenario, kpis, data.inventory]);

  const run = () => {
    if (!canRun) {
      logAction({ action: 'Ran what-if simulation — denied (insufficient role)', resource: 'Simulator', resourceId: 'scenario', status: 'failed' });
      return;
    }
    setRan(true);
    logAction({ action: 'Ran what-if simulation', resource: 'Simulator', resourceId: `shift${scenario.peakShiftPercent}-tariff${scenario.tariffChange}-prod${scenario.productionChange}`, status: 'success' });
  };

  const reset = () => { setScenario(DEFAULT_SCENARIO); setRan(false); };

  const deltas = ran ? [
    { label: 'Daily Energy Cost', before: kpis.energyDailyCost, after: result.energyDailyCost, format: (v: number) => `₹${v.toLocaleString()}`, icon: Zap },
    { label: 'Net Profit / period', before: kpis.netProfit, after: result.netProfit, format: (v: number) => `₹${(v / 100000).toFixed(1)}L`, icon: TrendingUp },
    { label: 'Total Expenses', before: kpis.totalExpense, after: result.totalExpense, format: (v: number) => `₹${(v / 100000).toFixed(1)}L`, icon: Package },
    { label: 'Carbon / day (t)', before: kpis.carbonDailyTons, after: result.carbon, format: (v: number) => `${v.toFixed(2)} t`, icon: FlaskConical },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 animate-fade-in">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
          <FlaskConical className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-display text-xl font-bold text-ink-800">What-if Simulator</h1>
          <p className="text-sm text-ink-400">Model tariff, load-shifting, production, and price scenarios before committing</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Scenario controls */}
        <Card className="lg:col-span-2">
          <CardHeader title="Scenario Inputs" subtitle="Adjust the levers and run the simulation" icon={<FlaskConical className="h-5 w-5" />} />
          <div className="space-y-6 p-5">
            {([
              { key: 'peakShiftPercent', label: 'Peak load shifted to off-peak', min: 0, max: 60, step: 5, suffix: '%', hint: 'Portion of 09:00–18:00 load moved to cheaper hours' },
              { key: 'tariffChange', label: 'Energy tariff change', min: -30, max: 50, step: 5, suffix: '%', hint: 'Provider rate revision — negative means cheaper' },
              { key: 'productionChange', label: 'Production volume change', min: -40, max: 60, step: 5, suffix: '%', hint: 'Planned ramp up or down' },
              { key: 'materialPriceChange', label: 'Material price change', min: -30, max: 50, step: 5, suffix: '%', hint: 'Raw material cost movement' },
            ] as const).map((lever) => (
              <div key={lever.key}>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-ink-700">{lever.label}</label>
                  <span className="rounded-md bg-ink-100 px-2 py-0.5 text-xs font-bold text-ink-700">
                    {scenario[lever.key] > 0 ? '+' : ''}{scenario[lever.key]}{lever.suffix}
                  </span>
                </div>
                <input
                  type="range"
                  min={lever.min}
                  max={lever.max}
                  step={lever.step}
                  value={scenario[lever.key]}
                  disabled={!canRun}
                  onChange={(e) => { setScenario((s) => ({ ...s, [lever.key]: Number(e.target.value) })); setRan(false); }}
                  className="mt-2 w-full accent-primary-600 disabled:opacity-50"
                />
                <p className="mt-1 text-xs text-ink-400">{lever.hint}</p>
              </div>
            ))}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={run}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Play className="h-4 w-4" /> Run Simulation
              </button>
              <button type="button" onClick={reset} className="inline-flex items-center gap-1.5 rounded-xl border border-ink-200 px-4 py-2.5 text-sm font-medium text-ink-600 hover:bg-ink-50">
                <RotateCcw className="h-4 w-4" /> Reset
              </button>
            </div>
            {!canRun && (
              <p className="text-xs text-warning-600">Your role ({'{'}operator or above needed{'}'}) cannot run simulations — attempts are logged.</p>
            )}
          </div>
        </Card>

        {/* Results */}
        <div className="space-y-6 lg:col-span-3">
          <Card>
            <CardHeader
              title={ran ? 'Simulated Impact' : 'Awaiting Simulation'}
              subtitle={ran ? 'Compared against your current live figures' : 'Set your levers, then press Run Simulation'}
              icon={<TrendingUp className="h-5 w-5" />}
              demo
            />
            {!ran ? (
              <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
                <FlaskConical className="h-10 w-10 text-ink-200" />
                <p className="mt-3 text-sm text-ink-400">Run the simulation to see projected energy cost, profit, expenses, and carbon impact.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
                {deltas.map((delta) => {
                  const Icon = delta.icon;
                  const diff = delta.after - delta.before;
                  const pct = delta.before !== 0 ? Math.round((diff / Math.abs(delta.before)) * 100) : 0;
                  const good = delta.label.includes('Profit') ? diff >= 0 : diff <= 0;
                  return (
                    <div key={delta.label} className="rounded-xl border border-ink-100 p-4">
                      <div className="flex items-center gap-2 text-xs font-medium text-ink-400">
                        <Icon className="h-3.5 w-3.5" /> {delta.label}
                      </div>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-xs text-ink-400 line-through">{delta.format(delta.before)}</span>
                        <span className="text-ink-300">→</span>
                        <span className="font-display text-lg font-bold text-ink-800">{delta.format(delta.after)}</span>
                      </div>
                      <span className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${diff === 0 ? 'bg-ink-100 text-ink-500' : good ? 'bg-success-50 text-success-700' : 'bg-danger-50 text-danger-700'}`}>
                        {diff > 0 ? '+' : ''}{pct}% ({diff > 0 ? '+' : ''}{delta.format(diff)})
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {ran && (
            <Card>
              <CardHeader title="Stock Cover Under New Production" subtitle="Days of material remaining at simulated usage rate" icon={<Package className="h-5 w-5" />} demo />
              <div className="p-5">
                <BarChart
                  data={result.coverDays.map((c) => ({
                    label: c.name.split(' ')[0].slice(0, 8),
                    value: c.days,
                    color: c.days <= 3 ? '#ef4444' : c.days <= 7 ? '#f97316' : '#22c55e',
                  }))}
                  height={200}
                  unit="days"
                />
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
