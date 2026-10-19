import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, type FactoryRow, type FactoryMemberRow } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

export interface WorkspaceWithRole extends FactoryRow {
  role: FactoryMemberRow['role'];
}

const ACTIVE_WS_KEY = 'indusledger_active_factory_id';

export function useWorkspaces() {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<WorkspaceWithRole[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceWithRole | null>(null);
  const [loading, setLoading] = useState(true);
  // Track user id (string) instead of the user object — token refreshes create
  // a new user object identity but the same id, and must NOT trigger a refetch
  // (that refetch loop was kicking users back to onboarding after idle).
  const fetchedForUserId = useRef<string | null>(null);
  const hasLoadedRef = useRef(false);

  const fetchWorkspaces = useCallback(async () => {
    if (!user) {
      fetchedForUserId.current = null;
      setWorkspaces([]);
      setActiveWorkspace(null);
      setLoading(false);
      return;
    }

    // Keep existing data visible during background refetches
    if (hasLoadedRef.current) setLoading(false);
    else setLoading(true);

    const { data: memberships, error: mErr } = await supabase
      .from('factory_members')
      .select('factory_id, role')
      .eq('user_id', user.id);

    // On transient errors (network blip after idle), keep the current view
    // instead of wiping state and forcing the user back to onboarding.
    if (mErr) {
      if (!hasLoadedRef.current) setLoading(false);
      return;
    }
    if (!memberships || memberships.length === 0) {
      if (!hasLoadedRef.current) {
        setWorkspaces([]);
        setActiveWorkspace(null);
        setLoading(false);
      }
      return;
    }

    const factoryIds = memberships.map((m) => m.factory_id);
    const { data: factories, error: fErr } = await supabase
      .from('factories')
      .select('*')
      .in('id', factoryIds);

    if (fErr || !factories) {
      if (!hasLoadedRef.current) setLoading(false);
      return;
    }

    // Merge factory data with role
    const merged: WorkspaceWithRole[] = factories.map((f: FactoryRow) => {
      const membership = memberships.find((m) => m.factory_id === f.id);
      return { ...f, role: membership?.role ?? 'viewer' };
    });

    setWorkspaces(merged);

    // Restore active workspace from localStorage or default to first.
    // Only auto-select when nothing is selected yet — never clobber the
    // workspace the user is currently viewing.
    if (!hasLoadedRef.current) {
      const storedId = localStorage.getItem(ACTIVE_WS_KEY);
      const stored = storedId ? merged.find((w) => w.id === storedId) : null;
      setActiveWorkspace(stored ?? merged[0] ?? null);
    } else {
      setActiveWorkspace((current) => {
        if (current && merged.some((w) => w.id === current.id)) return current;
        const storedId = localStorage.getItem(ACTIVE_WS_KEY);
        const stored = storedId ? merged.find((w) => w.id === storedId) : null;
        return stored ?? merged[0] ?? null;
      });
    }

    fetchedForUserId.current = user.id;
    hasLoadedRef.current = true;
    setLoading(false);
  }, [user]);

  useEffect(() => {
    // Skip the refetch when only the object identity changed (token refresh)
    if (user && fetchedForUserId.current === user.id) return;
    fetchWorkspaces();
  }, [user, fetchWorkspaces]);

  const switchWorkspace = useCallback((workspace: WorkspaceWithRole) => {
    localStorage.setItem(ACTIVE_WS_KEY, workspace.id);
    setActiveWorkspace(workspace);
  }, []);

  const createWorkspace = useCallback(
    async (name: string, industry: string): Promise<{ error: string | null }> => {
      if (!user) return { error: 'Not authenticated' };

      // Insert factory row — owner_id defaults to auth.uid()
      const { data: factory, error: fErr } = await supabase
        .from('factories')
        .insert({ name, industry })
        .select()
        .single();

      if (fErr || !factory) return { error: fErr?.message ?? 'Failed to create factory' };

      // Add the creator as owner in factory_members
      const { error: mErr } = await supabase.from('factory_members').insert({
        factory_id: factory.id,
        user_id: user.id,
        role: 'owner',
      });

      if (mErr) return { error: mErr.message };

      // Refresh workspaces
      await fetchWorkspaces();

      // Switch to the new workspace
      const newWs: WorkspaceWithRole = { ...factory, role: 'owner' };
      localStorage.setItem(ACTIVE_WS_KEY, factory.id);
      setActiveWorkspace(newWs);

      return { error: null };
    },
    [user, fetchWorkspaces]
  );

  return {
    workspaces,
    activeWorkspace,
    loading,
    switchWorkspace,
    createWorkspace,
    refresh: fetchWorkspaces,
  };
}
