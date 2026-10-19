/*
# Harden factory membership RLS helper

## Purpose
Keeps the recursion fix for factory_members while preventing the SECURITY DEFINER
membership helper from being callable through the public Data API.

## Changes
- Creates a private schema for internal database helpers.
- Creates `private.is_factory_member`, which reads factory_members as its owner so
  membership checks do not re-enter factory_members RLS.
- Revokes public and anonymous execution of the old public helper.
- Replaces factory_members and factories policies so they use the private helper.
- Preserves direct `user_id = auth.uid()` checks for a user's own membership rows.

## Security notes
1. The helper is read-only and has a fixed `search_path`.
2. The helper is not in the exposed public schema, so it cannot be called through
   the REST RPC surface.
3. The policies remain limited to authenticated users.
4. No tables, columns, or user data are deleted or changed.
*/
CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.is_factory_member(
  p_factory_id uuid,
  p_user_id uuid,
  p_roles text DEFAULT NULL
) RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.factory_members
    WHERE public.factory_members.factory_id = p_factory_id
      AND public.factory_members.user_id = p_user_id
      AND (
        p_roles IS NULL
        OR string_to_array(p_roles, ',') && ARRAY[public.factory_members.role]
      )
  )
$$;

REVOKE ALL ON FUNCTION private.is_factory_member(uuid, uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.is_factory_member(uuid, uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION private.is_factory_member(uuid, uuid, text) TO authenticated;

REVOKE ALL ON FUNCTION public.is_factory_member(uuid, uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_factory_member(uuid, uuid, text) FROM anon;
REVOKE ALL ON FUNCTION public.is_factory_member(uuid, uuid, text) FROM authenticated;

DROP POLICY IF EXISTS "select_own_memberships" ON public.factory_members;
CREATE POLICY "select_own_memberships"
  ON public.factory_members FOR SELECT TO authenticated
  USING (
    factory_members.user_id = auth.uid()
    OR private.is_factory_member(factory_members.factory_id, auth.uid(), 'owner,admin')
  );

DROP POLICY IF EXISTS "insert_memberships" ON public.factory_members;
CREATE POLICY "insert_memberships"
  ON public.factory_members FOR INSERT TO authenticated
  WITH CHECK (
    (factory_members.user_id = auth.uid() AND factory_members.role = 'owner')
    OR private.is_factory_member(factory_members.factory_id, auth.uid(), 'owner,admin')
  );

DROP POLICY IF EXISTS "update_memberships" ON public.factory_members;
CREATE POLICY "update_memberships"
  ON public.factory_members FOR UPDATE TO authenticated
  USING (private.is_factory_member(factory_members.factory_id, auth.uid(), 'owner,admin'))
  WITH CHECK (private.is_factory_member(factory_members.factory_id, auth.uid(), 'owner,admin'));

DROP POLICY IF EXISTS "delete_memberships" ON public.factory_members;
CREATE POLICY "delete_memberships"
  ON public.factory_members FOR DELETE TO authenticated
  USING (
    factory_members.user_id = auth.uid()
    OR private.is_factory_member(factory_members.factory_id, auth.uid(), 'owner,admin')
  );

DROP POLICY IF EXISTS "select_own_factories" ON public.factories;
CREATE POLICY "select_own_factories"
  ON public.factories FOR SELECT TO authenticated
  USING (private.is_factory_member(factories.id, auth.uid()));

DROP POLICY IF EXISTS "insert_factories" ON public.factories;
CREATE POLICY "insert_factories"
  ON public.factories FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "update_factories" ON public.factories;
CREATE POLICY "update_factories"
  ON public.factories FOR UPDATE TO authenticated
  USING (private.is_factory_member(factories.id, auth.uid(), 'owner,admin'))
  WITH CHECK (private.is_factory_member(factories.id, auth.uid(), 'owner,admin'));

DROP POLICY IF EXISTS "delete_factories" ON public.factories;
CREATE POLICY "delete_factories"
  ON public.factories FOR DELETE TO authenticated
  USING (private.is_factory_member(factories.id, auth.uid(), 'owner'));
