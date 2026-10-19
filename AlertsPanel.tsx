import { AlertTriangle, Info, XCircle, ChevronRight } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import type { AlertRecord } from '@/types';

const severityConfig: Record<
  AlertRecord['severity'],
  { icon: typeof Info; bg: string; text: string; border: string; dot: string }
> = {
  info: { icon: Info, bg: 'bg-primary-500/15', text: 'text-primary-300', border: 'border-l-primary-400', dot: 'bg-primary-400' },
  warning: { icon: AlertTriangle, bg: 'bg-warning-500/15', text: 'text-warning-300', border: 'border-l-warning-400', dot: 'bg-warning-400' },
  danger: { icon: XCircle, bg: 'bg-danger-500/15', text: 'text-danger-300', border: 'border-l-danger-500', dot: 'bg-danger-500' },
};

interface AlertsPanelProps {
  alerts: AlertRecord[];
}

export function AlertsPanel({ alerts }: AlertsPanelProps) {
  return (
    <Card className="h-full">
      <CardHeader
        title="Active Alerts"
        subtitle={`${alerts.length} items requiring attention`}
        icon={<AlertTriangle className="h-5 w-5" />}
        demo
      />
      <div className="max-h-[420px] overflow-y-auto">
        {alerts.map((alert, i) => {
          const cfg = severityConfig[alert.severity];
          const Icon = cfg.icon;

          return (
            <div
              key={alert.id}
              className={`flex items-start gap-3 border-l-2 ${cfg.border} px-4 py-3 transition-colors hover:bg-slate-700/30 animate-slide-in-left ${i > 0 ? 'border-t border-slate-700' : ''}`}
              style={{ animationDelay: `${i * 0.06}s` }}
            >
              <div className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${cfg.bg} ${cfg.text}`}>
                <Icon className="h-4 w-4" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-semibold text-slate-200">{alert.title}</h4>
                  <span className="flex-shrink-0 text-xs text-slate-400">{alert.timeAgo}</span>
                </div>
                <p className="mt-0.5 text-xs text-slate-400">{alert.message}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                  <span className="text-xs font-medium text-slate-400">{alert.source}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="border-t border-slate-700 px-4 py-3">
        <button className="flex items-center gap-1 text-sm font-medium text-primary-300 hover:text-primary-200">
          View all alerts
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </Card>
  );
}
