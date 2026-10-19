import { type ComponentType, useState, useRef, useEffect } from 'react';
import { Factory, ChevronRight, X, LogOut, User as UserIcon, KeyRound } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import type { PageKey } from '@/types';
import { navItems, navGroups, type NavItem } from '@/config/navigation';
import type { WorkspaceWithRole } from '@/lib/useWorkspaces';
import { ChangePasswordModal } from '@/components/auth/ChangePasswordModal';

interface SidebarProps {
  activePage: PageKey;
  onNavigate: (page: PageKey) => void;
  isOpen: boolean;
  onClose: () => void;
  user: User;
  activeWorkspace: WorkspaceWithRole | null;
  onSignOut: () => Promise<void>;
}

const groupOrder: NavItem['group'][] = ['overview', 'operations', 'intelligence', 'admin'];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0]?.slice(0, 2).toUpperCase() ?? 'U';
}

export function Sidebar({ activePage, onNavigate, isOpen, onClose, user, activeWorkspace, onSignOut }: SidebarProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const displayName = user.user_metadata?.full_name ?? user.email ?? 'User';
  const initials = getInitials(displayName);
  const role = activeWorkspace?.role ?? 'viewer';

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setShowUserMenu(false);
    await onSignOut();
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-950/60 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed left-0 top-0 z-40 flex h-screen w-72 flex-col
          border-r border-slate-700 bg-slate-900
          transition-transform duration-300 ease-out
          md:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-800 px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-lg shadow-primary-900/40">
              <Factory className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-display text-base font-bold text-white">IndusLedger</h1>
              <p className="text-xs text-ink-400">Industrial Intelligence</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          {groupOrder.map((group) => {
            const items = navItems.filter((item) => item.group === group);
            if (items.length === 0) return null;

            return (
              <div key={group} className="mb-6">
                <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {navGroups[group]}
                </p>
                <ul className="space-y-1">
                  {items.map((item) => {
                    const Icon = item.icon as ComponentType<{ className?: string }>;
                    const isActive = activePage === item.key;

                    return (
                      <li key={item.key}>
                        <button
                          onClick={() => onNavigate(item.key)}
                          className={`
                            group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200
                            ${isActive
                              ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-md shadow-primary-900/30'
                              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                            }
                          `}
                        >
                          <Icon className={`h-[18px] w-[18px] flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-primary-400'}`} />
                          <span className="flex-1 text-left">{item.label}</span>
                          {item.badge && (
                            <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-primary-500/20 text-primary-300'}`}>
                              {item.badge}
                            </span>
                          )}
                          {isActive && <ChevronRight className="h-4 w-4 text-white/60" />}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>

        {/* Footer — user profile + sign out */}
        <div className="border-t border-slate-800 px-5 py-4" ref={menuRef}>
          <button
            onClick={() => setShowUserMenu((s) => !s)}
            className="flex w-full items-center gap-3 rounded-lg bg-slate-800/50 p-3 transition-colors hover:bg-slate-800"
          >
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-accent-500 text-xs font-bold text-white">
              {initials}
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p className="truncate text-sm font-medium text-white">{displayName}</p>
              <p className="truncate text-xs capitalize text-slate-400">{role}</p>
            </div>
            <span className="h-2 w-2 rounded-full bg-success-400" title="Online" />
          </button>

          {showUserMenu && (
            <div className="mt-2 overflow-hidden rounded-lg border border-slate-700 bg-slate-800 animate-fade-in">
              <div className="px-4 py-3 border-b border-slate-700">
                <p className="text-xs text-slate-400">Signed in as</p>
                <p className="truncate text-sm font-medium text-white">{user.email}</p>
              </div>
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  setShowChangePassword(true);
                }}
                className="flex w-full items-center gap-2.5 px-5 py-3 text-sm text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
              >
                <KeyRound className="h-4 w-4" />
                Change password
              </button>
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-2.5 px-5 py-3 text-sm text-slate-300 transition-colors hover:bg-slate-700 hover:text-danger-400"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          )}
          <p className="mt-3 text-center text-xs text-slate-500">
            {activeWorkspace ? activeWorkspace.name : 'No workspace'}
          </p>
        </div>
      </aside>

      <ChangePasswordModal open={showChangePassword} onClose={() => setShowChangePassword(false)} />
    </>
  );
}
