/*
# Allow a new factory owner to receive their workspace row

## Purpose
Completes the secure workspace-creation flow. Supabase returns the inserted factory
row when the client requests it with `.select()`. At that exact moment, the owner row
may exist before the factory_members owner row is inserted.

## Change
Updates the factories SELECT policy to allow the authenticated owner to see their own
factory by `owner_id = auth.uid()` in addition to the private membership helper.

## Security
- A user can only see a factory they own or belong to.
- No anonymous access is added.
- The recursive factory_members policy fix remains unchanged.
*/
DROP POLICY IF EXISTS "select_own_factories" ON public.factories;
CREATE POLICY "select_own_factories"
  ON public.factories FOR SELECT TO authenticated
  USING (
    factories.owner_id = auth.uid()
    OR private.is_factory_member(factories.id, auth.uid())
  );
