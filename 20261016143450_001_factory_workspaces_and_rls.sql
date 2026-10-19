/*
# Factory Workspaces, Team Membership, and Row-Level Security

## Purpose
Creates the multi-tenant foundation for IndusLedger AI. Each factory gets its own
private workspace. Users belong to one or more factories via a membership table with
role-based permissions. All factory-scoped tables enforce RLS so a user from Factory A
can never read or modify Factory B's data.

## New Tables
1. factories — factory workspace with name, industry, owner
2. factory_members — maps users to factories with roles (owner/admin/operator/viewer)
3. user_profiles — user display name, linked to auth.users

## Security
- RLS enabled on all three tables
- Factory access gated through factory_members membership checks
- User profiles restricted to self only
- owner_id defaults to auth.uid() for seamless inserts

## Notes
- Tables created first, then policies applied (factory policies reference factory_members)
- All policies use auth.uid(), never current_user
- Email confirmation remains OFF
*/
CREATE TABLE IF NOT EXISTS factories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  industry text NOT NULL DEFAULT 'other',
  owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS factory_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  factory_id uuid NOT NULL REFERENCES factories(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'viewer',
  created_at timestamptz DEFAULT now(),
  UNIQUE (factory_id, user_id)
);

CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE factories ENABLE ROW LEVEL SECURITY;
ALTER TABLE factory_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_factories" ON factories;
CREATE POLICY "select_own_factories"
  ON factories FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM factory_members
      WHERE factory_members.factory_id = factories.id
      AND factory_members.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "insert_factories" ON factories;
CREATE POLICY "insert_factories"
  ON factories FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "update_factories" ON factories;
CREATE POLICY "update_factories"
  ON factories FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM factory_members
      WHERE factory_members.factory_id = factories.id
      AND factory_members.user_id = auth.uid()
      AND factory_members.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM factory_members
      WHERE factory_members.factory_id = factories.id
      AND factory_members.user_id = auth.uid()
      AND factory_members.role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "delete_factories" ON factories;
CREATE POLICY "delete_factories"
  ON factories FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM factory_members
      WHERE factory_members.factory_id = factories.id
      AND factory_members.user_id = auth.uid()
      AND factory_members.role = 'owner'
    )
  );

DROP POLICY IF EXISTS "select_own_memberships" ON factory_members;
CREATE POLICY "select_own_memberships"
  ON factory_members FOR SELECT TO authenticated
  USING (
    factory_members.user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM factory_members fm
      WHERE fm.factory_id = factory_members.factory_id
      AND fm.user_id = auth.uid()
      AND fm.role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "insert_memberships" ON factory_members;
CREATE POLICY "insert_memberships"
  ON factory_members FOR INSERT TO authenticated
  WITH CHECK (
    factory_members.user_id = auth.uid() AND factory_members.role = 'owner'
    OR EXISTS (
      SELECT 1 FROM factory_members fm
      WHERE fm.factory_id = factory_members.factory_id
      AND fm.user_id = auth.uid()
      AND fm.role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "update_memberships" ON factory_members;
CREATE POLICY "update_memberships"
  ON factory_members FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM factory_members fm
      WHERE fm.factory_id = factory_members.factory_id
      AND fm.user_id = auth.uid()
      AND fm.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM factory_members fm
      WHERE fm.factory_id = factory_members.factory_id
      AND fm.user_id = auth.uid()
      AND fm.role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "delete_memberships" ON factory_members;
CREATE POLICY "delete_memberships"
  ON factory_members FOR DELETE TO authenticated
  USING (
    factory_members.user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM factory_members fm
      WHERE fm.factory_id = factory_members.factory_id
      AND fm.user_id = auth.uid()
      AND fm.role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "select_own_profile" ON user_profiles;
CREATE POLICY "select_own_profile"
  ON user_profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON user_profiles;
CREATE POLICY "insert_own_profile"
  ON user_profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON user_profiles;
CREATE POLICY "update_own_profile"
  ON user_profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE INDEX IF NOT EXISTS idx_factory_members_user ON factory_members(user_id);
CREATE INDEX IF NOT EXISTS idx_factory_members_factory ON factory_members(factory_id);
