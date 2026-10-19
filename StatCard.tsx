import { Activity, TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react';
import { Sparkline } from '@/components/charts/Sparkline';
import type { KpiStat } from '@/types';

const accentMap: Record<
  KpiStat['accent'],
  { bg: string; text: string; ring: string; chart: string }
> = {
  primary: { bg: 'bg-primary-500/15', text: 'text-primary-300', ring: 'ring-primary-500/30', chart: '#2dd4bf' },
  accent: { bg: 'bg-accent-500/15', text: 'text-accent-300', ring: 'ring-accent-500/30', chart: '#fbbf24' },
  success: { bg: 'bg-success-500/15', text: 'text-success-300', ring: 'ring-success-500/30', chart: '#4ade80' },
  warning: { bg: 'bg-warning-500/15', text: 'text-warning-300', ring: 'ring-warning-500/30', chart: '#fb923c' },
  danger: { bg: 'bg-danger-500/15', text: 'text-danger-300', ring: 'ring-danger-500/30', chart: '#f87171' },
};

interface StatCardProps {
  stat: KpiStat;
  delay?: number;
}

export function StatCard({ stat, delay = 0 }: StatCardProps) {
  const a = accentMap[stat.accent];
  const isPositive = stat.change >= 0;

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-slate-700/70 bg-slate-800 p-5 shadow-sm shadow-black/20 ring-1 transition-all duration-300 hover:shadow-md hover:border-slate-600 animate-fade-in-up ${a.ring}`}
      style={{ animationDelay: `${delay}s` }}
    >
      {/* Top row: icon + label */}
      <div className="flex items-center justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${a.bg} ${a.text}`}>
          <Activity className="h-5 w-5" />
        </div>
        <span className={`flex items-center gap-0.5 text-xs font-semibold ${isPositive ? 'text-success-400' : 'text-danger-400'}`}>
          {isPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
          {Math.abs(stat.change)}%
        </span>
      </div>

      {/* Value */}
      <div className="mt-4">
        <p className="text-xs font-medium text-slate-400">{stat.label}</p>
        <div className="mt-1 flex items-baseline gap-1">
          <span className="font-display text-2xl font-bold text-slate-100">{stat.value}</span>
          {stat.unit && <span className="text-sm font-medium text-slate-400">{stat.unit}</span>}
        </div>
        <p className="mt-0.5 text-xs text-slate-400">{stat.changeLabel}</p>
      </div>

      {/* Sparkline */}
      <div className="mt-3">
        <Sparkline data={stat.trend} color={a.chart} width={200} height={36} className="w-full" />
      </div>
    </div>
  );
}

export function StatCardGrid({ stats }: { stats: KpiStat[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat, i) => (
        <StatCard key={stat.label} stat={stat} delay={i * 0.08} />
      ))}
    </div>
  );
}
