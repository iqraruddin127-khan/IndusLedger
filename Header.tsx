import { useEffect, useRef, useState } from 'react';
import { Menu, Search, Bell, ChevronDown, Check, Building2, SlidersHorizontal } from 'lucide-react';
import type { PageKey } from '@/types';
import { navItems } from '@/config/navigation';
import type { WorkspaceWithRole } from '@/lib/useWorkspaces';
import { useWorkspaceData, dataSourceLabel } from '@/lib/workspaceData';
import { Modal } from '@/components/ui/Modal';

interface HeaderProps {
  activePage: PageKey;
  onMenuClick: () => void;
  activeWorkspace: WorkspaceWithRole | null;
  workspaces: WorkspaceWithRole[];
  onSwitchWorkspace: (ws: WorkspaceWithRole) => void;
}

// Inline baseline editor available from any page — no navigation required.
function QuickEditButton({ currentRole }: { currentRole: string }) {
  const { data, draftBaselines, setDraftBaselines, saveBaselines, can } = useWorkspaceData();
  const [open, setOpen] = useState(false);
  const canManage = can('settings.manage');

  const fields = [
    { key: 'energyRatePerKwh' as const, label: 'Energy Tariff (₹/kWh)', step: 0.1 },
    { key: 'gridEmissionFactor' as const, label: 'Grid Emission Factor (kg CO₂/kWh)', step: 0.01 },
    { key: 'monthlyProductionUnits' as const, label: 'Monthly Production (units)', step: 100 },
    { key: 'avgSellingPriceInr' as const, label: 'Avg Selling Price (₹/unit)', step: 10 },
  ];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Quick edit baselines"
        className="hidden items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-300 transition hover:border-primary-500 hover:text-primary-300 md:flex"
      >
        <SlidersHorizontal className="h-4 w-4" />
        <span className="hidden xl:inline">{dataSourceLabel(data.mode, data.iotConnected)}</span>
      </button>
      <Modal
        open={open}
        title="Quick Edit Baselines"
        subtitle={`Active data source: ${dataSourceLabel(data.mode, data.iotConnected)} · your role: ${currentRole}`}
        onClose={() => setOpen(false)}
        maxWidth="max-w-md"
        footer={
          <>
            <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700">
              Close
            </button>
            <button
              type="button"
              disabled={!canManage}
              onClick={() => { saveBaselines(); setOpen(false); }}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Save & Recalculate
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {fields.map((field) => (
            <div key={field.key}>
              <label className="text-xs font-medium text-slate-400">{field.label}</label>
              <input
                type="number"
                step={field.step}
                disabled={!canManage}
                value={draftBaselines[field.key]}
                onChange={(e) => setDraftBaselines({ [field.key]: Number(e.target.value) })}
                className="mt-1 h-10 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 text-sm text-slate-200 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 disabled:bg-slate-800 disabled:text-slate-500"
              />
            </div>
          ))}
          {!canManage && (
            <p className="text-xs text-warning-400">Your role can view but not modify baselines.</p>
          )}
          <p className="text-xs text-slate-400">Saving updates the global dataset and recalculates every module. Full settings live in the Settings page.</p>
        </div>
      </Modal>
    </>
  );
}

export function Header({ activePage, onMenuClick, activeWorkspace, workspaces, onSwitchWorkspace }: HeaderProps) {
  const [showWsMenu, setShowWsMenu] = useState(false);
  const wsMenuRef = useRef<HTMLDivElement>(null);

  const currentNav = navItems.find((item) => item.key === activePage);
  const pageTitle = currentNav?.label ?? 'Dashboard';

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wsMenuRef.current && !wsMenuRef.current.contains(e.target as Node)) {
        setShowWsMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-20 border-b border-slate-700 bg-slate-900/85 backdrop-blur-md">
      <div className="flex items-center justify-between gap-4 px-4 py-3.5 md:px-6">
        {/* Left: menu + title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200 md:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <h2 className="font-display text-lg font-semibold text-slate-100">{pageTitle}</h2>
            <p className="hidden text-xs text-slate-400 sm:block">{dateStr}</p>
          </div>
        </div>

        {/* Right: search + actions */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Search */}
          <div className="hidden items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 lg:flex">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search machines, alerts, reports..."
              className="w-48 bg-transparent text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none"
            />
            <kbd className="rounded border border-slate-600 bg-slate-900 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
              ⌘K
            </kbd>
          </div>

          {/* Notifications */}
          <button className="relative rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200">
            <Bell className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger-500 ring-2 ring-slate-900" />
          </button>

          <QuickEditButton currentRole={activeWorkspace?.role ?? 'viewer'} />

          {/* Workspace selector dropdown */}
          <div className="relative" ref={wsMenuRef}>
            <button
              onClick={() => setShowWsMenu((s) => !s)}
              className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-300 hover:border-slate-600 transition-colors"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded bg-primary-500/20 text-xs font-bold text-primary-300">
                {activeWorkspace?.name?.slice(0, 2).toUpperCase() ?? 'F1'}
              </span>
              <span className="hidden font-medium sm:inline">
                {activeWorkspace?.name ?? 'Select Factory'}
              </span>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </button>

            {showWsMenu && (
              <div className="absolute right-0 top-full mt-2 w-64 overflow-hidden rounded-xl border border-slate-700 bg-slate-800 shadow-lg shadow-black/40 animate-fade-in">
                <div className="border-b border-slate-700 px-4 py-2.5">
                  <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <Building2 className="h-3.5 w-3.5" />
                    Your Workspaces
                  </p>
                </div>
                <ul className="max-h-64 overflow-y-auto">
                  {workspaces.map((ws) => (
                    <li key={ws.id}>
                      <button
                        onClick={() => {
                          onSwitchWorkspace(ws);
                          setShowWsMenu(false);
                        }}
                        className={`
                          flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors
                          ${activeWorkspace?.id === ws.id
                            ? 'bg-primary-500/15 text-primary-300'
                            : 'text-slate-300 hover:bg-slate-700'
                          }
                        `}
                      >
                        <span className={`flex h-7 w-7 items-center justify-center rounded text-xs font-bold ${activeWorkspace?.id === ws.id ? 'bg-primary-500/30 text-primary-200' : 'bg-slate-700 text-slate-300'}`}>
                          {ws.name.slice(0, 2).toUpperCase()}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{ws.name}</p>
                          <p className="truncate text-xs capitalize text-slate-400">{ws.industry} · {ws.role}</p>
                        </div>
                        {activeWorkspace?.id === ws.id && <Check className="h-4 w-4 text-primary-400" />}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
