import { useMemo, useState } from 'react';
import { Download, Filter, Search, ShieldCheck, UserRound, AlertTriangle, XCircle, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { useWorkspaceData } from '@/lib/workspaceData';
import type { AuditLogRecord } from '@/types';

const statusConfig: Record<AuditLogRecord['status'], { label: string; badge: string; icon: typeof CheckCircle2 }> = {
  success: { label: 'Success', badge: 'bg-success-50 text-success-300', icon: CheckCircle2 },
  warning: { label: 'Review', badge: 'bg-warning-50 text-warning-300', icon: AlertTriangle },
  failed: { label: 'Failed', badge: 'bg-danger-50 text-danger-300', icon: XCircle },
};

interface AuditLogPageProps {
  workspaceName?: string;
}

export function AuditLogPage({ workspaceName = 'North wind textile plant' }: AuditLogPageProps) {
  const { data: wsData, can, exportAuditCsv } = useWorkspaceData();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'all' | AuditLogRecord['status']>('all');
  const [resource, setResource] = useState('all');
  const allLogs = wsData.auditLogs;

  const resources = useMemo(() => Array.from(new Set(allLogs.map((record) => record.resource))), [allLogs]);
  const filteredLogs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return allLogs.filter((record) => {
      const matchesQuery = normalizedQuery.length === 0 || [record.actor, record.action, record.resource, record.resourceId].some((value) => value.toLowerCase().includes(normalizedQuery));
      const matchesStatus = status === 'all' || record.status === status;
      const matchesResource = resource === 'all' || record.resource === resource;
      return matchesQuery && matchesStatus && matchesResource;
    });
  }, [allLogs, query, resource, status]);

  const failedCount = allLogs.filter((record) => record.status === 'failed').length;
  const reviewCount = allLogs.filter((record) => record.status === 'warning').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-300">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-ink-800">Audit Log</h1>
            <p className="text-sm text-ink-400">Searchable history of activity in {workspaceName}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            if (!can('ledger.export')) return;
            exportAuditCsv();
          }}
          title={can('ledger.export') ? 'Export filtered events' : 'Requires Auditor, Admin, or Owner role'}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: 'Events in view', value: filteredLogs.length, detail: 'matching current filters', color: 'bg-primary-50 text-primary-300' },
          { label: 'Needs review', value: reviewCount, detail: 'flagged events', color: 'bg-warning-50 text-warning-300' },
          { label: 'Failed actions', value: failedCount, detail: 'requires attention', color: 'bg-danger-50 text-danger-300' },
        ].map((stat) => (
          <Card key={stat.label} className="p-5">
            <div className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ${stat.color}`}>{stat.label}</div>
            <p className="mt-3 font-display text-2xl font-bold text-ink-800">{stat.value}</p>
            <p className="mt-1 text-xs text-ink-400">{stat.detail}</p>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader title="Workspace activity" subtitle="Demo events shown for the active workspace" icon={<Filter className="h-5 w-5" />} demo />
        <div className="flex flex-col gap-3 border-b border-ink-100 p-5 lg:flex-row">
          <label className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search actor, action, resource, or ID"
              className="h-10 w-full rounded-lg border border-ink-200 bg-ink-100 pl-9 pr-3 text-sm text-ink-500 outline-none transition placeholder:text-ink-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
            />
          </label>
          <select value={resource} onChange={(event) => setResource(event.target.value)} className="h-10 rounded-lg border border-ink-200 bg-ink-100 px-3 text-sm text-ink-500 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20">
            <option value="all">All resources</option>
            {resources.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select value={status} onChange={(event) => setStatus(event.target.value as 'all' | AuditLogRecord['status'])} className="h-10 rounded-lg border border-ink-200 bg-ink-100 px-3 text-sm text-ink-500 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20">
            <option value="all">All statuses</option>
            <option value="success">Success</option>
            <option value="warning">Review</option>
            <option value="failed">Failed</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-ink-100 text-left text-xs font-semibold uppercase tracking-wider text-ink-400">
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Action</th>
                <th className="hidden px-4 py-3 sm:table-cell">Resource</th>
                <th className="hidden px-4 py-3 lg:table-cell">IP Address</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((record, index) => {
                const config = statusConfig[record.status];
                const Icon = config.icon;
                return (
                  <tr key={record.id} className="border-b border-ink-50 transition-colors hover:bg-ink-50 animate-fade-in" style={{ animationDelay: `${index * 0.03}s` }}>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-ink-500">{record.timestamp}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-ink-100 text-ink-500"><UserRound className="h-3.5 w-3.5" /></div>
                        <div>
                          <p className="text-sm font-medium text-ink-700">{record.actor}</p>
                          <p className="text-xs text-ink-400">{record.actorRole}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-ink-700">{record.action}</p>
                      <p className="text-xs text-ink-400">{record.resourceId}</p>
                    </td>
                    <td className="hidden px-4 py-3 text-sm text-ink-500 sm:table-cell">{record.resource}</td>
                    <td className="hidden px-4 py-3 font-mono text-xs text-ink-500 lg:table-cell">{record.ipAddress}</td>
                    <td className="px-4 py-3"><span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${config.badge}`}><Icon className="h-3 w-3" />{config.label}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredLogs.length === 0 && <div className="px-5 py-12 text-center text-sm text-ink-400">No audit events match the selected filters.</div>}
        </div>
      </Card>

      <div className="rounded-xl border border-accent-500/40 bg-accent-50 px-5 py-4 text-xs text-accent-300">
        Audit records are synthetic demo data. In production, logs should be written server-side and retained according to your compliance policy.
      </div>
    </div>
  );
}
