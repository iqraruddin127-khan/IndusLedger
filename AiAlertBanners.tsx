import { useMemo } from 'react';
import { Sparkles, AlertTriangle, XCircle, Info, PackageX, Zap, FileText, Truck } from 'lucide-react';
import { useWorkspaceData } from '@/lib/workspaceData';
import type { PageKey } from '@/types';

export interface AiNotification {
  id: string;
  severity: 'danger' | 'warning' | 'info';
  category: string;
  title: string;
  message: string;
  navigateTo?: PageKey;
}

const severityStyles = {
  danger: { icon: XCircle, bg: 'bg-danger-500/10', border: 'border-danger-500/40', text: 'text-danger-300', iconBg: 'bg-danger-500/20 text-danger-300' },
  warning: { icon: AlertTriangle, bg: 'bg-warning-500/10', border: 'border-warning-500/40', text: 'text-warning-300', iconBg: 'bg-warning-500/20 text-warning-300' },
  info: { icon: Info, bg: 'bg-primary-500/10', border: 'border-primary-500/40', text: 'text-primary-300', iconBg: 'bg-primary-500/20 text-primary-300' },
};

export function useAiNotifications(): AiNotification[] {
  const { data, kpis } = useWorkspaceData();

  return useMemo(() => {
    const notifications: AiNotification[] = [];

    // Critical inventory shortfalls
    const zeroStock = data.inventory.filter((i) => i.status === 'out-of-stock');
    if (zeroStock.length > 0) {
      notifications.push({
        id: 'inv-out',
        severity: 'danger',
        category: 'Inventory',
        title: `${zeroStock.length} item${zeroStock.length === 1 ? '' : 's'} out of stock`,
        message: `${zeroStock.slice(0, 2).map((i) => i.name).join(', ')}${zeroStock.length > 2 ? ` and ${zeroStock.length - 2} more` : ''} — production risk. Reorder recommended today.`,
        navigateTo: 'inventory',
      });
    }
    if (kpis.shortfalls > 0 && zeroStock.length === 0) {
      notifications.push({
        id: 'inv-low',
        severity: 'warning',
        category: 'Inventory',
        title: `${kpis.shortfalls} item${kpis.shortfalls === 1 ? ' is' : 's are'} at or below reorder point`,
        message: 'AI suggests consolidating purchase orders to hit free-shipping thresholds.',
        navigateTo: 'inventory',
      });
    }

    // Peak-hour energy spikes
    if (kpis.energySpikeKwh > 0) {
      notifications.push({
        id: 'energy-spike',
        severity: 'warning',
        category: 'Energy',
        title: `Peak-hour spike detected — ${kpis.energySpikeKwh} kWh`,
        message: `Consumption during 09:00–18:00 peak tariff is high. Shifting flexible load to off-peak could save about ₹${kpis.potentialSavingsInr.toLocaleString()}/day.`,
        navigateTo: 'energy-optimization',
      });
    }

    // Overdue invoices
    if (kpis.overdueInvoices > 0) {
      notifications.push({
        id: 'finance-overdue',
        severity: 'danger',
        category: 'Finance',
        title: `${kpis.overdueInvoices} invoice${kpis.overdueInvoices === 1 ? '' : 's'} overdue — ₹${Math.round(kpis.overdueInvoiceValue / 1000)}k outstanding`,
        message: 'Collections risk to cash flow. Send reminders and consider late-payment terms review.',
        navigateTo: 'finance',
      });
    }

    // High-risk supplier delays
    const risky = data.suppliers.filter((s) => s.reliability === 'low' || s.onTimeRate < 70);
    if (risky.length > 0) {
      notifications.push({
        id: 'supplier-risk',
        severity: 'warning',
        category: 'Suppliers',
        title: `${risky.length} supplier${risky.length === 1 ? '' : 's'} with high delay risk`,
        message: `${risky[0].name} on-time rate is ${risky[0].onTimeRate}%. AI recommends dual-sourcing critical materials.`,
        navigateTo: 'suppliers',
      });
    }

    if (notifications.length === 0) {
      notifications.push({
        id: 'all-clear',
        severity: 'info',
        category: 'AI',
        title: 'All clear — no critical findings',
        message: 'Inventory, energy, finance, and supplier signals are within normal operating ranges.',
      });
    }

    return notifications;
  }, [data, kpis]);
}

export function AiAlertBanners({ onNavigate }: { onNavigate: (page: PageKey) => void }) {
  const notifications = useAiNotifications();
  const categoryIcons: Record<string, typeof Zap> = {
    Inventory: PackageX, Energy: Zap, Finance: FileText, Suppliers: Truck, AI: Sparkles,
  };

  return (
    <div className="space-y-3">
      {notifications.map((notification, i) => {
        const styles = severityStyles[notification.severity];
        const Icon = styles.icon;
        const CategoryIcon = categoryIcons[notification.category] ?? Sparkles;
        return (
          <div
            key={notification.id}
            className={`flex items-start gap-3 rounded-xl border ${styles.border} ${styles.bg} px-4 py-3.5 animate-fade-in-up`}
            style={{ animationDelay: `${i * 0.06}s` }}
          >
            <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${styles.iconBg}`}>
              <Icon className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 rounded-full bg-slate-900/60 px-2 py-0.5 text-xs font-semibold ${styles.text}`}>
                  <CategoryIcon className="h-3 w-3" />
                  {notification.category}
                </span>
                <span className="text-xs font-medium text-slate-400">AI Insight</span>
              </div>
              <h4 className={`mt-1 text-sm font-semibold ${styles.text}`}>{notification.title}</h4>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-300">{notification.message}</p>
            </div>
            {notification.navigateTo && (
              <button
                type="button"
                onClick={() => onNavigate(notification.navigateTo!)}
                className="flex-shrink-0 self-center rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-primary-400 hover:text-primary-300"
              >
                Review
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
