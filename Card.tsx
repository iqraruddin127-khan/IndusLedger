import { type ReactNode } from 'react';
import { useWorkspaceData, dataSourceLabel } from '@/lib/workspaceData';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className = '', hover = false }: CardProps) {
  return (
    <div
      className={`
        rounded-2xl border border-slate-700/70 bg-slate-800 shadow-sm shadow-black/20
        ${hover ? 'transition-all duration-300 hover:shadow-md hover:border-slate-600' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
  demo?: boolean;
}

export function CardHeader({ title, subtitle, icon, action, demo }: CardHeaderProps) {
  // Badge reflects the live global data source instead of a hardcoded "Demo Data"
  const { data } = useWorkspaceData();
  const badgeLabel = dataSourceLabel(data.mode, data.iotConnected);
  const badgeClass = data.mode === 'iot' && data.iotConnected
    ? 'demo-badge badge-live'
    : data.mode === 'custom'
      ? 'demo-badge badge-custom'
      : 'demo-badge';

  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-700 px-5 py-4">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-500/15 text-primary-300">
            {icon}
          </div>
        )}
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-display text-sm font-semibold text-slate-100">{title}</h3>
            {demo && <span className={badgeClass}>{badgeLabel}</span>}
          </div>
          {subtitle && <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}
