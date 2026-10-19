/*
# Fix: Infinite Recursion in factory_members RLS Policies

## Problem
The factory_members table's RLS policies query factory_members itself (aliased as `fm`)
to check if the current user is an owner/admin. This self-reference triggers RLS on
factory_members again, which queries factory_members again — infinite recursion.

This also affects the `factories` table policies, which query factory_members in their
USING clauses. When factory_members RLS fires, it re-enters the same recursive loop.

## Solution
Create a SECURITY DEFINER function `is_factory_member` that queries factory_members
with RLS bypassed (SECURITY DEFINER runs as the function owner). All policies on both
`factory_members` and `factories` are rewritten to call this function instead of
directly querying factory_members.

## Changes

### New Function
- `is_factory_member(p_factory_id uuid, p_user_id uuid, p_roles text DEFAULT NULL)`
  Returns true if the given user is a member of the given factory. If p_roles is
  provided, only returns true if the user's role is in the comma-separated list
  (e.g. 'owner,admin'). Runs as SECURITY DEFINER to bypass RLS.

### Updated Policies — factory_members
- SELECT: user_id = auth.uid() OR is_factory_member(factory_id, auth.uid(), 'owner,admin')
- INSERT: (user_id = auth.uid() AND role = 'owner') OR is_factory_member(factory_id, auth.uid(), 'owner,admin')
- UPDATE: is_factory_member(factory_id, auth.uid(), 'owner,admin')
- DELETE: user_id = auth.uid() OR is_factory_member(factory_id, auth.uid(), 'owner,admin')

### Updated Policies — factories
- SELECT: is_factory_member(id, auth.uid())
- UPDATE: is_factory_member(id, auth.uid(), 'owner,admin')
- DELETE: is_factory_member(id, auth.uid(), 'owner')

### Grants
- EXECUTE on is_factory_member granted to authenticated role

## Notes
1. The function is marked SECURITY DEFINER so it bypasses RLS when querying
   factory_members. This breaks the recursive loop.
2. The function is safe because it only performs a read-only check — it cannot
   be used to modify data.
3. All policies still use auth.uid() — the function receives it as a parameter.
*/
CREATE OR REPLACE FUNCTION is_factory_member(
  p_factory_id uuid,
  p_user_id uuid,
  p_roles text DEFAULT NULL
) RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM factory_members
    WHERE factory_members.factory_id = p_factory_id
    AND factory_members.user_id = p_user_id
    AND (
      p_roles IS NULL
      OR string_to_array(p_roles, ',') && ARRAY[factory_members.role]
    )
  )
$$;

GRANT EXECUTE ON FUNCTION is_factory_member(uuid, uuid, text) TO authenticated;

-- ─── Recreate factory_members policies ──────────────────────────────────

DROP POLICY IF EXISTS "select_own_memberships" ON factory_members;
CREATE POLICY "select_own_memberships"
  ON factory_members FOR SELECT TO authenticated
  USING (
    factory_members.user_id = auth.uid()
    OR is_factory_member(factory_members.factory_id, auth.uid(), 'owner,admin')
  );

DROP POLICY IF EXISTS "insert_memberships" ON factory_members;
CREATE POLICY "insert_memberships"
  ON factory_members FOR INSERT TO authenticated
  WITH CHECK (
    (factory_members.user_id = auth.uid() AND factory_members.role = 'owner')
    OR is_factory_member(factory_members.factory_id, auth.uid(), 'owner,admin')
  );

DROP POLICY IF EXISTS "update_memberships" ON factory_members;
CREATE POLICY "update_memberships"
  ON factory_members FOR UPDATE TO authenticated
  USING (
    is_factory_member(factory_members.factory_id, auth.uid(), 'owner,admin')
  )
  WITH CHECK (
    is_factory_member(factory_members.factory_id, auth.uid(), 'owner,admin')
  );

DROP POLICY IF EXISTS "delete_memberships" ON factory_members;
CREATE POLICY "delete_memberships"
  ON factory_members FOR DELETE TO authenticated
  USING (
    factory_members.user_id = auth.uid()
    OR is_factory_member(factory_members.factory_id, auth.uid(), 'owner,admin')
  );

-- ─── Recreate factories policies to use the function too ────────────────

DROP POLICY IF EXISTS "select_own_factories" ON factories;
CREATE POLICY "select_own_factories"
  ON factories FOR SELECT TO authenticated
  USING (is_factory_member(factories.id, auth.uid()));

DROP POLICY IF EXISTS "insert_factories" ON factories;
CREATE POLICY "insert_factories"
  ON factories FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "update_factories" ON factories;
CREATE POLICY "update_factories"
  ON factories FOR UPDATE TO authenticated
  USING (is_factory_member(factories.id, auth.uid(), 'owner,admin'))
  WITH CHECK (is_factory_member(factories.id, auth.uid(), 'owner,admin'));

DROP POLICY IF EXISTS "delete_factories" ON factories;
CREATE POLICY "delete_factories"
  ON factories FOR DELETE TO authenticated
  USING (is_factory_member(factories.id, auth.uid(), 'owner'));
