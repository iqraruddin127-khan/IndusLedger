import { Zap, TrendingUp, Cpu, Clock } from 'lucide-react';
import { HeroBanner } from '@/components/dashboard/HeroBanner';
import { StatCardGrid } from '@/components/dashboard/StatCard';
import { AiAlertBanners } from '@/components/dashboard/AiAlertBanners';
import { AlertsPanel } from '@/components/dashboard/AlertsPanel';
import { useWorkspaceData } from '@/lib/workspaceData';
import { MachineStatusPanel } from '@/components/dashboard/MachineStatusPanel';
import { Card, CardHeader } from '@/components/ui/Card';
import { LineChart } from '@/components/charts/LineChart';
import { BarChart } from '@/components/charts/BarChart';
import { DonutChart } from '@/components/charts/DonutChart';
import { demoMachines, demoEnergyTrend, demoIndustryDistribution, demoProductionTrend } from '@/data/demoData';
import type { KpiStat, PageKey } from '@/types';

interface DashboardPageProps {
  workspaceName?: string;
  userName?: string;
  onNavigate: (page: PageKey) => void;
}

export function DashboardPage({ workspaceName, userName, onNavigate }: DashboardPageProps) {
  const { data, kpis } = useWorkspaceData();

  const liveKpiStats: KpiStat[] = [
    {
      label: 'Active Machines',
      value: String(kpis.activeMachines),
      change: 2.1,
      changeLabel: 'vs last week',
      trend: [42, 43, 44, 43, 45, 46, 47],
      icon: 'Cog',
      accent: 'primary',
    },
    {
      label: 'Energy Cost / hr',
      value: kpis.energyCostPerHour.toLocaleString(),
      unit: 'INR',
      change: -3.4,
      changeLabel: 'vs last week',
      trend: [5200, 5100, 5000, 4900, 4850, 4800, kpis.energyCostPerHour],
      icon: 'Zap',
      accent: 'accent',
    },
    {
      label: 'Inventory Value',
      value: `${Math.round(kpis.inventoryValue / 1000).toLocaleString()}k`,
      unit: 'INR',
      change: kpis.shortfalls > 0 ? -1.8 : 0.6,
      changeLabel: kpis.shortfalls > 0 ? `${kpis.shortfalls} at reorder pt` : 'healthy stock',
      trend: [310, 315, 320, 318, 322, 325, Math.round(kpis.inventoryValue / 1000)],
      icon: 'Package',
      accent: kpis.shortfalls > 0 ? 'warning' : 'success',
    },
    {
      label: 'Net Profit',
      value: `${(kpis.netProfit / 100000).toFixed(1)}L`,
      unit: 'INR',
      change: kpis.profitMargin,
      changeLabel: `${kpis.profitMargin}% margin`,
      trend: [180, 195, 210, 205, 220, 228, Math.round(kpis.netProfit / 10000)],
      icon: 'Wallet',
      accent: kpis.netProfit >= 0 ? 'success' : 'danger',
    },
  ];
  // Convert demo data to chart-friendly shapes
  const energyChartData = demoEnergyTrend.map((d) => ({ label: d.label, value: d.costInr }));
  const productionChartData = demoProductionTrend.map((d) => ({
    label: d.label,
    value: d.units,
    color: d.units >= d.target ? '#22c55e' : '#f97316',
  }));
  const productionTargetSeries = demoProductionTrend.map((d) => ({ label: d.label, value: d.target }));

  return (
    <div className="space-y-6">
      {/* Hero banner with animated visuals */}
      <HeroBanner workspaceName={workspaceName} userName={userName} />

      {/* AI insight banners — recalculated from live workspace data */}
      <AiAlertBanners onNavigate={onNavigate} />

      {/* KPI stat cards — recalculated from the active data mode */}
      <StatCardGrid stats={liveKpiStats} />

      {/* Charts row: energy + production */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Energy cost trend — 2 cols */}
        <Card className="xl:col-span-2">
          <CardHeader
            title="Energy Cost Trend (24h)"
            subtitle="Hourly electricity cost — INR"
            icon={<Zap className="h-5 w-5" />}
            demo
          />
          <div className="p-5">
            <LineChart
              data={energyChartData}
              height={240}
              color="#2dd4bf"
              unit="INR"
              yFormatter={(v) => `₹${Math.round(v)}`}
            />
          </div>
        </Card>

        {/* Industry distribution donut — 1 col */}
        <Card>
          <CardHeader
            title="Production by Industry"
            subtitle="Share of total output"
            icon={<TrendingUp className="h-5 w-5" />}
            demo
          />
          <div className="flex items-center justify-center p-5">
            <DonutChart
              data={demoIndustryDistribution}
              centerValue="100%"
              centerLabel="Total Output"
            />
          </div>
        </Card>
      </div>

      {/* Production + Alerts row */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Weekly production bar chart — 2 cols */}
        <Card className="xl:col-span-2">
          <CardHeader
            title="Weekly Production vs Target"
            subtitle="Units produced per day"
            icon={<Cpu className="h-5 w-5" />}
            demo
          />
          <div className="p-5">
            <BarChart data={productionChartData} height={240} unit="units" />
            <div className="mt-3 flex items-center gap-4 px-12">
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-sm bg-success-400" />
                <span className="text-xs text-slate-400">Met Target</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-sm bg-warning-400" />
                <span className="text-xs text-slate-400">Below Target</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Alerts panel — 1 col */}
        <AlertsPanel alerts={data.auditLogs.slice(0, 5).map((log, i) => ({
          id: log.id,
          severity: log.status === 'failed' ? 'danger' : log.status === 'warning' ? 'warning' : 'info',
          title: log.action,
          message: `${log.actor} (${log.actorRole}) · ${log.resource} · ${log.resourceId}`,
          source: 'Audit Trail',
          timeAgo: i === 0 ? 'just now' : 'recently',
        }))} />
      </div>

      {/* Machine status table — full width */}
      <MachineStatusPanel machines={demoMachines} />

      {/* Production trend line chart with target overlay */}
      <Card>
        <CardHeader
          title="Production Trend with Target Line"
          subtitle="Daily output vs target — last 7 days"
          icon={<Clock className="h-5 w-5" />}
          demo
        />
        <div className="p-5">
          <LineChart
            data={demoProductionTrend.map((d) => ({ label: d.label, value: d.units }))}
            secondSeries={productionTargetSeries}
            height={240}
            color="#2dd4bf"
            secondColor="#fbbf24"
            unit="units"
          />
        </div>
      </Card>

      {/* Footer note */}
      <div className="rounded-xl border border-primary-500/30 bg-primary-500/10 px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary-500/20 text-primary-300">
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-medium text-primary-200">
              Data mode: {data.mode === 'demo' ? 'Demo Data' : data.mode === 'custom' ? 'Custom Data' : 'IoT / Smart Meter'}
            </p>
            <p className="mt-1 text-xs text-primary-200/70">
              {data.mode === 'demo'
                ? 'You are viewing the built-in demo dataset. Switch to Custom or IoT mode in Settings to use your own figures.'
                : 'Module KPIs are recalculated from your configured data source. Visit Settings to adjust.'}
            </p>
          </div>
        </div>
      </div>

      <footer className="mt-8 border-t border-slate-700 pt-4 text-center">
        <p className="text-xs italic text-slate-400 font-serif tracking-wide">
          "Powered by Machine Learning models for Machine Health AI predictions."
        </p>
      </footer>
    </div>
  );
}
