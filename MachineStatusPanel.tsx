import { Cpu, ChevronRight } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import type { MachineRecord, MachineStatus, RiskLevel } from '@/types';

const statusConfig: Record<MachineStatus, { label: string; dot: string; badge: string }> = {
  operational: { label: 'Operational', dot: 'bg-success-400', badge: 'bg-success-500/15 text-success-300' },
  warning: { label: 'Warning', dot: 'bg-warning-400', badge: 'bg-warning-500/15 text-warning-300' },
  maintenance: { label: 'Maintenance', dot: 'bg-primary-400', badge: 'bg-primary-500/15 text-primary-300' },
  offline: { label: 'Offline', dot: 'bg-ink-400', badge: 'bg-slate-700 text-slate-300' },
};

const riskConfig: Record<RiskLevel, { label: string; color: string }> = {
  low: { label: 'Low Risk', color: 'text-success-400' },
  medium: { label: 'Medium Risk', color: 'text-warning-400' },
  high: { label: 'High Risk', color: 'text-danger-400' },
  critical: { label: 'Critical', color: 'text-danger-400' },
};

interface MachineStatusPanelProps {
  machines: MachineRecord[];
}

export function MachineStatusPanel({ machines }: MachineStatusPanelProps) {
  return (
    <Card className="h-full">
      <CardHeader
        title="Machine Status Overview"
        subtitle="Health scores & risk classification"
        icon={<Cpu className="h-5 w-5" />}
        demo
      />
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
              <th className="px-4 py-3">Machine</th>
              <th className="px-4 py-3">Status</th>
              <th className="hidden px-4 py-3 sm:table-cell">Health</th>
              <th className="hidden px-4 py-3 md:table-cell">Risk</th>
              <th className="hidden px-4 py-3 lg:table-cell">Temp</th>
              <th className="hidden px-4 py-3 lg:table-cell">Uptime</th>
            </tr>
          </thead>
          <tbody>
            {machines.map((m, i) => {
              const sc = statusConfig[m.status];
              const rc = riskConfig[m.riskLevel];
              const healthColor =
                m.healthScore >= 80 ? 'bg-success-400'
                : m.healthScore >= 60 ? 'bg-warning-400'
                : m.healthScore >= 40 ? 'bg-accent-500'
                : 'bg-danger-500';

              return (
                <tr
                  key={m.id}
                  className="border-b border-slate-700/50 transition-colors hover:bg-slate-700/30 animate-fade-in"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  {/* Name + line */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 flex-shrink-0 rounded-full ${sc.dot} ${m.status === 'offline' ? '' : 'animate-pulse'}`} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-200">{m.name}</p>
                        <p className="truncate text-xs text-slate-400">{m.line}</p>
                      </div>
                    </div>
                  </td>

                  {/* Status badge */}
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${sc.badge}`}>
                      {sc.label}
                    </span>
                  </td>

                  {/* Health bar */}
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-700">
                        <div
                          className={`h-full rounded-full ${healthColor} transition-all duration-700`}
                          style={{ width: `${m.healthScore}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-slate-300">{m.healthScore}</span>
                    </div>
                  </td>

                  {/* Risk */}
                  <td className="hidden px-4 py-3 md:table-cell">
                    <span className={`text-xs font-semibold ${rc.color}`}>{rc.label}</span>
                  </td>

                  {/* Temperature */}
                  <td className="hidden px-4 py-3 lg:table-cell">
                    <span className="text-sm text-slate-300">
                      {m.temperatureC > 0 ? `${m.temperatureC}°C` : '—'}
                    </span>
                  </td>

                  {/* Uptime */}
                  <td className="hidden px-4 py-3 lg:table-cell">
                    <span className="text-sm text-slate-300">
                      {m.uptimeHours > 0 ? `${Math.floor(m.uptimeHours / 24)}d ${m.uptimeHours % 24}h` : '—'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="border-t border-slate-700 px-4 py-3">
        <button className="flex items-center gap-1 text-sm font-medium text-primary-300 hover:text-primary-200">
          Open Machine Health AI
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </Card>
  );
}
