import { useState, useCallback, useEffect } from 'react';
import type { PageKey } from '@/types';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useWorkspaces } from '@/lib/useWorkspaces';
import { WorkspaceDataProvider } from '@/lib/workspaceData';
import { AppLayout } from '@/components/layout/AppLayout';
import { DashboardPage } from '@/pages/DashboardPage';
import { EnergyOptimizationPage } from '@/pages/EnergyOptimizationPage';
import { EnergyLedgerPage } from '@/pages/EnergyLedgerPage';
import { InventoryPage } from '@/pages/InventoryPage';
import { SuppliersPage } from '@/pages/SuppliersPage';
import { FinancePage } from '@/pages/FinancePage';
import { AuditLogPage } from '@/pages/AuditLogPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { AiAssistantPage } from '@/pages/AiAssistantPage';
import { SimulatorPage } from '@/pages/SimulatorPage';
import { MachineHealthPage } from '@/pages/MachineHealthPage';
import { PlaceholderPage } from '@/pages/PlaceholderPage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { SignupPage } from '@/pages/auth/SignupPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';
import { OnboardingPage } from '@/pages/OnboardingPage';
import { Loader2 } from 'lucide-react';

type AuthView = 'login' | 'signup' | 'forgot';

// Password recovery links land here with a recovery session in the URL
// fragment (e.g. #access_token=...&type=recovery). While it's active the
// user must set a new password before anything else.
function isRecoverySession(user: User | null): boolean {
  if (typeof window === 'undefined') return false;
  if (window.location.hash.includes('type=recovery')) return true;
  return user?.app_metadata?.provider === 'email' && sessionStorage.getItem('indusledger_recovery') === '1';
}

const ACTIVE_PAGE_KEY = 'indusledger_active_page';
const VALID_PAGE_KEYS: PageKey[] = [
  'dashboard', 'machine-health', 'energy-optimization', 'energy-ledger', 'inventory',
  'suppliers', 'finance', 'audit-log', 'ai-assistant', 'simulator', 'reports', 'settings',
];

function restoreActivePage(): PageKey {
  try {
    const stored = localStorage.getItem(ACTIVE_PAGE_KEY) as PageKey | null;
    if (stored && VALID_PAGE_KEYS.includes(stored)) return stored;
  } catch { /* storage unavailable */ }
  return 'dashboard';
}

function App() {
  const { user, loading, signOut } = useAuth();
  const { workspaces, activeWorkspace, loading: wsLoading, switchWorkspace } = useWorkspaces();
  // Active module persists across reloads — user returns to the view they left
  const [activePage, setActivePageState] = useState<PageKey>(restoreActivePage);
  const [authView, setAuthView] = useState<AuthView>('login');
  const [recoveryMode, setRecoveryMode] = useState(false);

  // ─── Consume session / recovery tokens from the URL fragment ─────────
  // Password-reset links land on the app with
  // #access_token=...&refresh_token=...&type=recovery. Supabase's built-in
  // URL detection usually consumes this itself, but if the link pointed at
  // a stale host (e.g. localhost:3000) and redirected here, the fragment
  // can survive into the app — handle it so the user never has to paste
  // tokens manually.
  useEffect(() => {
    const consumeHashTokens = () => {
      if (!window.location.hash.includes('access_token')) return;

      const params = new URLSearchParams(window.location.hash.slice(1));
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      const errorDescription = params.get('error_description');

      if (params.get('type') === 'recovery') {
        setRecoveryMode(true);
        try { sessionStorage.setItem('indusledger_recovery', '1'); } catch { /* storage unavailable */ }
      }

      // Wipe the fragment either way — tokens never belong in the URL bar.
      window.history.replaceState(null, '', window.location.pathname + window.location.search);

      if (errorDescription || !accessToken || !refreshToken) {
        console.warn('Auth link problem:', errorDescription ?? 'missing tokens in URL fragment');
        return;
      }

      supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
    };

    consumeHashTokens();
    window.addEventListener('hashchange', consumeHashTokens);
    return () => window.removeEventListener('hashchange', consumeHashTokens);
  }, []);

  // Supabase emits PASSWORD_RECOVERY when the user opens a recovery link
  // (the URL fragment carries the recovery session). React by showing the
  // new-password screen immediately.
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setRecoveryMode(true);
        try { sessionStorage.setItem('indusledger_recovery', '1'); } catch { /* storage unavailable */ }
      }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const setActivePage = useCallback((page: PageKey) => {
    setActivePageState(page);
    try { localStorage.setItem(ACTIVE_PAGE_KEY, page); } catch { /* storage unavailable */ }
  }, []);

  // ─── Loading screen ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-0">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary-400" />
          <p className="text-sm text-ink-400">Loading IndusLedger AI...</p>
        </div>
      </div>
    );
  }

  // ─── Password recovery — force new-password screen ──────────────────
  if (recoveryMode || isRecoverySession(user)) {
    return <ResetPasswordPage onDone={() => {
      setRecoveryMode(false);
      try { sessionStorage.removeItem('indusledger_recovery'); } catch { /* storage unavailable */ }
      signOut();
    }} />;
  }

  // ─── Not signed in — show auth screens ───────────────────────────────
  if (!user) {
    if (authView === 'signup') {
      return <SignupPage onNavigate={(p) => setAuthView(p)} />;
    }
    if (authView === 'forgot') {
      return <ForgotPasswordPage onNavigate={(p) => setAuthView(p)} />;
    }
    return <LoginPage onNavigate={(p) => setAuthView(p)} />;
  }

  // ─── Signed in but no workspace — show onboarding ────────────────────
  if (!wsLoading && workspaces.length === 0) {
    return <OnboardingPage onComplete={() => {}} />;
  }

  // ─── Loading workspace data ──────────────────────────────────────────
  if (wsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-0">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary-400" />
          <p className="text-sm text-ink-400">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  // ─── Main app — user is signed in with a workspace ───────────────────
  const userRole = (activeWorkspace?.role ?? 'viewer') as 'owner' | 'admin' | 'operator' | 'auditor' | 'viewer';
  const displayName = user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'You';

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <DashboardPage workspaceName={activeWorkspace?.name} userName={user.user_metadata?.full_name} onNavigate={setActivePage} />;
      case 'energy-optimization':
        return <EnergyOptimizationPage />;
      case 'energy-ledger':
        return <EnergyLedgerPage />;
      case 'inventory':
        return <InventoryPage />;
      case 'suppliers':
        return <SuppliersPage />;
      case 'finance':
        return <FinancePage />;
      case 'audit-log':
        return <AuditLogPage workspaceName={activeWorkspace?.name} />;
      case 'settings':
        return <SettingsPage />;
      case 'reports':
        return <ReportsPage />;
      case 'ai-assistant':
        return <AiAssistantPage />;
      case 'simulator':
        return <SimulatorPage />;
      case 'machine-health':
        return <MachineHealthPage />;
      default:
        return <PlaceholderPage pageKey={activePage} />;
    }
  };

  return (
    <WorkspaceDataProvider role={userRole} actorName={displayName}>
      <AppLayout
        activePage={activePage}
        onNavigate={setActivePage}
        user={user}
        activeWorkspace={activeWorkspace}
        workspaces={workspaces}
        onSwitchWorkspace={switchWorkspace}
        onSignOut={signOut}
      >
        {renderPage()}
      </AppLayout>
    </WorkspaceDataProvider>
  );
}

export default App;
