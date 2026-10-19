/*
# Machine Telemetry and Maintenance Logs

## Purpose
Persists machine health predictions and maintenance approvals so each factory
workspace keeps its own operational history. Every row is tied to the active
workspace (factory) so Row Level Security keeps data isolated per factory.

## New Tables
1. `machine_telemetry` — one row per machine health prediction run:
   - `workspace_id` (uuid, required, references factories)
   - `machine_name` (text, optional label)
   - `vibration`, `temperature_c`, `operating_hours` (numeric sensor inputs)
   - `failure_risk` (numeric %), `remaining_useful_life_days` (integer)
   - `status` (text: Healthy / At Risk / Critical)
   - `source` (text: 'live' model service or 'offline' local estimate)
   - `recorded_at` (timestamp, defaults to now)
2. `maintenance_logs` — one row per maintenance approval:
   - `workspace_id` (uuid, required, references factories)
   - `machine_name` (text), `prediction_status` (text), `failure_risk` (numeric)
   - `notes` (text, optional)
   - `approved_by` (uuid, defaults to the authenticated user)
   - `approved_at` (timestamp, defaults to now)

## Security
- RLS enabled on both tables.
- Four separate policies per table (SELECT / INSERT / UPDATE / DELETE), scoped
  `TO authenticated` and gated on factory_members membership, so users can only
  access rows belonging to factories they belong to — same model as existing
  factory-scoped tables.

## Notes
- No destructive operations; idempotent via IF NOT EXISTS / DROP POLICY IF EXISTS.
- Indexes on workspace_id and recorded_at/approved_at for list queries.
*/

CREATE TABLE IF NOT EXISTS machine_telemetry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES factories(id) ON DELETE CASCADE,
  machine_name text,
  vibration numeric NOT NULL,
  temperature_c numeric NOT NULL,
  operating_hours numeric NOT NULL,
  failure_risk numeric,
  remaining_useful_life_days integer,
  status text,
  source text NOT NULL DEFAULT 'manual',
  recorded_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS maintenance_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES factories(id) ON DELETE CASCADE,
  machine_name text,
  prediction_status text,
  failure_risk numeric,
  notes text,
  approved_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  approved_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE machine_telemetry ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_logs ENABLE ROW LEVEL SECURITY;

-- machine_telemetry policies: members of the owning factory only
DROP POLICY IF EXISTS "select_telemetry_members" ON machine_telemetry;
CREATE POLICY "select_telemetry_members"
  ON machine_telemetry FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM factory_members fm
      WHERE fm.factory_id = machine_telemetry.workspace_id
      AND fm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "insert_telemetry_members" ON machine_telemetry;
CREATE POLICY "insert_telemetry_members"
  ON machine_telemetry FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM factory_members fm
      WHERE fm.factory_id = machine_telemetry.workspace_id
      AND fm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "update_telemetry_members" ON machine_telemetry;
CREATE POLICY "update_telemetry_members"
  ON machine_telemetry FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM factory_members fm
      WHERE fm.factory_id = machine_telemetry.workspace_id
      AND fm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM factory_members fm
      WHERE fm.factory_id = machine_telemetry.workspace_id
      AND fm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "delete_telemetry_members" ON machine_telemetry;
CREATE POLICY "delete_telemetry_members"
  ON machine_telemetry FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM factory_members fm
      WHERE fm.factory_id = machine_telemetry.workspace_id
      AND fm.user_id = auth.uid()
    )
  );

-- maintenance_logs policies: members of the owning factory only
DROP POLICY IF EXISTS "select_maintenance_members" ON maintenance_logs;
CREATE POLICY "select_maintenance_members"
  ON maintenance_logs FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM factory_members fm
      WHERE fm.factory_id = maintenance_logs.workspace_id
      AND fm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "insert_maintenance_members" ON maintenance_logs;
CREATE POLICY "insert_maintenance_members"
  ON maintenance_logs FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM factory_members fm
      WHERE fm.factory_id = maintenance_logs.workspace_id
      AND fm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "update_maintenance_members" ON maintenance_logs;
CREATE POLICY "update_maintenance_members"
  ON maintenance_logs FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM factory_members fm
      WHERE fm.factory_id = maintenance_logs.workspace_id
      AND fm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM factory_members fm
      WHERE fm.factory_id = maintenance_logs.workspace_id
      AND fm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "delete_maintenance_members" ON maintenance_logs;
CREATE POLICY "delete_maintenance_members"
  ON maintenance_logs FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM factory_members fm
      WHERE fm.factory_id = maintenance_logs.workspace_id
      AND fm.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_telemetry_workspace ON machine_telemetry(workspace_id, recorded_at);
CREATE INDEX IF NOT EXISTS idx_maintenance_workspace ON maintenance_logs(workspace_id, approved_at);
