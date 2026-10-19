import { useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import type { PageKey } from '@/types';
import type { WorkspaceWithRole } from '@/lib/useWorkspaces';
import { ToastViewport } from '@/lib/workspaceData';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface AppLayoutProps {
  activePage: PageKey;
  onNavigate: (page: PageKey) => void;
  children: ReactNode;
  user: User;
  activeWorkspace: WorkspaceWithRole | null;
  workspaces: WorkspaceWithRole[];
  onSwitchWorkspace: (ws: WorkspaceWithRole) => void;
  onSignOut: () => Promise<void>;
}

export function AppLayout({
  activePage,
  onNavigate,
  children,
  user,
  activeWorkspace,
  workspaces,
  onSwitchWorkspace,
  onSignOut,
}: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleNavigate = (page: PageKey) => {
    onNavigate(page);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-ink-0">
      <ToastViewport />
      <Sidebar
        activePage={activePage}
        onNavigate={handleNavigate}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
        activeWorkspace={activeWorkspace}
        onSignOut={onSignOut}
      />

      <div className="md:pl-72">
        <Header
          activePage={activePage}
          onMenuClick={() => setSidebarOpen(true)}
          activeWorkspace={activeWorkspace}
          workspaces={workspaces}
          onSwitchWorkspace={onSwitchWorkspace}
        />
        <main className="px-4 py-6 md:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
