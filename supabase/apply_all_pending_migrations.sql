/*
  Consolidated migration: brings the live Supabase database up to the state
  expected by app commit 2738a5d (2026-09-08) — the build going to TestFlight.

  ## How to run
    1. Open the Supabase Dashboard -> SQL Editor -> New query.
    2. Paste this entire file.
    3. Click Run.
    4. Run the verification queries at the bottom (uncomment them).

  ## Idempotency
    Safe to run multiple times. Every CREATE TABLE / ADD COLUMN uses
    IF NOT EXISTS, every policy is dropped before being re-created, and
    constraint/column work looks up the catalog first. If half of these were
    already applied, this script reconciles to the desired final state without
    erroring.

  ## What it bundles (in dependency order)
    Section 0 - older migrations (Apr 29) missing from prod:
       0a. status_updates.need_priority column
       0b. caregiver_responses table + RLS
       0c. caregiver_responses (status_update_id, caregiver_id) UNIQUE

    Sections 1-10 - the May 3-4 batch:
       1. profiles.display_name UNIQUE (case-insensitive)
       2. profiles.avatar_icon column
       3. connections table + indexes + RLS
       4. profiles search policy (authenticated users can read profiles)
       5. caregiver_archived_updates table + RLS
       6. patient_archived_updates table + RLS
       7. patient_friend status_updates SELECT policy (corrected version)
       8. status_updates.targeted_follower_ids + replacement SELECT policy
       9. caregiver_responses cross-read SELECT policy for active helpers
      10. caregiver_responses -> profiles foreign key

    Section 11 - the Sep 7 rename, folded in:
      11. status_updates.completed_at / completed_by (created, or renamed from
          resolved_at / resolved_by) + the renamed UPDATE policy.
          Corresponds to migration
          20260907180458_rename_resolved_to_completed_fields.sql, but state-aware
          so it works whether or not the legacy columns exist. The app on `main`
          reads and writes ONLY the completed_* names, so this section is
          required before the TestFlight build ships.

  ## Not included
    Edge function deployment (send-push, delete-account, submit-feedback) and
    their secrets are separate — see GITHUB_SECRETS.md section 11.

  ## Optional block
    After COMMIT there is a clearly marked OPTIONAL block adding a missing
    foreign key on caregiver_responses.status_update_id. Read its comment before
    running it: it deletes already-orphaned rows. It is not required for the
    build to work.
*/

BEGIN;

-- ─── 0. PREREQUISITES (older migrations missing from production) ────────────
-- These were authored before the previous TestFlight (a7cbe0d) but never
-- applied to the live database. The new connections / archive / resolution
-- features depend on caregiver_responses existing, and the app code already
-- reads/writes need_priority on status_updates.

-- 0a. status_updates.need_priority
ALTER TABLE status_updates ADD COLUMN IF NOT EXISTS need_priority text;

-- 0b. caregiver_responses table + indexes + RLS
CREATE TABLE IF NOT EXISTS caregiver_responses (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status_update_id uuid NOT NULL,
  caregiver_id     uuid NOT NULL,
  message          text NOT NULL DEFAULT '',
  seen_at          timestamptz,
  created_at       timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS caregiver_responses_update_idx
  ON caregiver_responses(status_update_id);
CREATE INDEX IF NOT EXISTS caregiver_responses_caregiver_idx
  ON caregiver_responses(caregiver_id);

ALTER TABLE caregiver_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Caregivers can insert own responses" ON caregiver_responses;
CREATE POLICY "Caregivers can insert own responses"
  ON caregiver_responses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = caregiver_id);

DROP POLICY IF EXISTS "Caregivers can select own responses" ON caregiver_responses;
CREATE POLICY "Caregivers can select own responses"
  ON caregiver_responses FOR SELECT
  TO authenticated
  USING (auth.uid() = caregiver_id);

DROP POLICY IF EXISTS "Caregivers can update own responses" ON caregiver_responses;
CREATE POLICY "Caregivers can update own responses"
  ON caregiver_responses FOR UPDATE
  TO authenticated
  USING (auth.uid() = caregiver_id)
  WITH CHECK (auth.uid() = caregiver_id);

DROP POLICY IF EXISTS "Patients can read responses to their updates" ON caregiver_responses;
CREATE POLICY "Patients can read responses to their updates"
  ON caregiver_responses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM status_updates
      WHERE status_updates.id = caregiver_responses.status_update_id
        AND status_updates.patient_id = auth.uid()
    )
  );

-- 0c. caregiver_responses unique constraint (enables upsert by composite key)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'caregiver_responses_update_caregiver_unique'
  ) THEN
    ALTER TABLE caregiver_responses
      ADD CONSTRAINT caregiver_responses_update_caregiver_unique
      UNIQUE (status_update_id, caregiver_id);
  END IF;
END $$;

-- ─── 1. profiles.display_name UNIQUE (case-insensitive) ─────────────────────
-- De-duplicate any existing rows that share lower(display_name) before adding
-- the unique index. Each duplicate gets the first 6 chars of its id appended.
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT lower(display_name) AS lname
    FROM profiles
    GROUP BY lower(display_name)
    HAVING count(*) > 1
  LOOP
    UPDATE profiles
    SET display_name = display_name || '-' || substring(id::text, 1, 6)
    WHERE lower(display_name) = r.lname;
  END LOOP;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_display_name_lower_unique
  ON profiles (lower(display_name));

-- ─── 2. profiles.avatar_icon ────────────────────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_icon text;

-- ─── 3. connections table ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS connections (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  follower_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  connection_type text NOT NULL DEFAULT 'caregiver'
    CHECK (connection_type IN ('caregiver', 'patient_friend')),
  status          text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'declined')),
  requested_by    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT connections_unique_pair UNIQUE (patient_id, follower_id)
);

CREATE INDEX IF NOT EXISTS connections_patient_id_status_idx
  ON connections(patient_id, status);
CREATE INDEX IF NOT EXISTS connections_follower_id_status_idx
  ON connections(follower_id, status);

ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own connections" ON connections;
CREATE POLICY "Users can view their own connections"
  ON connections FOR SELECT
  TO authenticated
  USING (auth.uid() = patient_id OR auth.uid() = follower_id);

DROP POLICY IF EXISTS "Users can create connection requests" ON connections;
CREATE POLICY "Users can create connection requests"
  ON connections FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.uid() = patient_id OR auth.uid() = follower_id)
    AND auth.uid() = requested_by
  );

DROP POLICY IF EXISTS "Patients can update connections they are part of" ON connections;
CREATE POLICY "Patients can update connections they are part of"
  ON connections FOR UPDATE
  TO authenticated
  USING (auth.uid() = patient_id OR auth.uid() = follower_id)
  WITH CHECK (auth.uid() = patient_id OR auth.uid() = follower_id);

DROP POLICY IF EXISTS "Users can delete their own connections" ON connections;
CREATE POLICY "Users can delete their own connections"
  ON connections FOR DELETE
  TO authenticated
  USING (auth.uid() = patient_id OR auth.uid() = follower_id);

-- ─── 4. profiles search policy ──────────────────────────────────────────────
-- Allows authenticated users to search any profile by display_name. This is
-- what makes the Connections screen's user search work.
DROP POLICY IF EXISTS "Authenticated users can search profiles" ON profiles;
CREATE POLICY "Authenticated users can search profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- ─── 5. caregiver_archived_updates table ────────────────────────────────────
CREATE TABLE IF NOT EXISTS caregiver_archived_updates (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  caregiver_id     uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status_update_id uuid        NOT NULL REFERENCES status_updates(id) ON DELETE CASCADE,
  archived_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT caregiver_archived_updates_unique UNIQUE (caregiver_id, status_update_id)
);

CREATE INDEX IF NOT EXISTS idx_caregiver_archived_updates_caregiver
  ON caregiver_archived_updates (caregiver_id, archived_at DESC);

ALTER TABLE caregiver_archived_updates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Caregivers can view own archived updates" ON caregiver_archived_updates;
CREATE POLICY "Caregivers can view own archived updates"
  ON caregiver_archived_updates FOR SELECT
  TO authenticated
  USING (auth.uid() = caregiver_id);

DROP POLICY IF EXISTS "Caregivers can archive updates" ON caregiver_archived_updates;
CREATE POLICY "Caregivers can archive updates"
  ON caregiver_archived_updates FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = caregiver_id);

DROP POLICY IF EXISTS "Caregivers can unarchive own updates" ON caregiver_archived_updates;
CREATE POLICY "Caregivers can unarchive own updates"
  ON caregiver_archived_updates FOR DELETE
  TO authenticated
  USING (auth.uid() = caregiver_id);

-- ─── 6. patient_archived_updates table ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS patient_archived_updates (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id       uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status_update_id uuid        NOT NULL REFERENCES status_updates(id) ON DELETE CASCADE,
  archived_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (patient_id, status_update_id)
);

CREATE INDEX IF NOT EXISTS patient_archived_updates_patient_id_idx
  ON patient_archived_updates(patient_id, archived_at DESC);

ALTER TABLE patient_archived_updates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Patients can insert their own archive rows" ON patient_archived_updates;
CREATE POLICY "Patients can insert their own archive rows"
  ON patient_archived_updates FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Patients can read their own archive rows" ON patient_archived_updates;
CREATE POLICY "Patients can read their own archive rows"
  ON patient_archived_updates FOR SELECT
  TO authenticated
  USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Patients can delete their own archive rows" ON patient_archived_updates;
CREATE POLICY "Patients can delete their own archive rows"
  ON patient_archived_updates FOR DELETE
  TO authenticated
  USING (auth.uid() = patient_id);

-- ─── 7. patient_friend status_updates SELECT policy (corrected) ─────────────
-- The original migration created a policy with the wrong join direction; the
-- follow-up migration dropped it and added the correct one. We drop both
-- possible names here so the final state is correct regardless of history.
DROP POLICY IF EXISTS "Friends can read each other status updates" ON status_updates;
DROP POLICY IF EXISTS "Patients can read friend follower status updates" ON status_updates;
CREATE POLICY "Patients can read friend follower status updates"
  ON status_updates FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM connections
      WHERE connections.connection_type = 'patient_friend'
        AND connections.status = 'active'
        AND connections.follower_id = status_updates.patient_id
        AND connections.patient_id = auth.uid()
    )
  );

-- ─── 8. status_updates.targeted_follower_ids + replacement SELECT policy ────
ALTER TABLE status_updates
  ADD COLUMN IF NOT EXISTS targeted_follower_ids uuid[] DEFAULT NULL;

-- Drop any prior name variants of the caregiver/connection read policy so
-- the new "Active connections can read status updates" policy is the only one.
DROP POLICY IF EXISTS "Caregiver can read status updates for connected patients" ON status_updates;
DROP POLICY IF EXISTS "Connected users can read status updates" ON status_updates;
DROP POLICY IF EXISTS "Active connections can read status updates" ON status_updates;

CREATE POLICY "Active connections can read status updates"
  ON status_updates FOR SELECT
  TO authenticated
  USING (
    -- Patient always sees their own updates
    patient_id = auth.uid()
    OR
    -- Followers see broadcast updates (NULL) or updates targeted at them
    (
      EXISTS (
        SELECT 1 FROM connections
        WHERE connections.patient_id = status_updates.patient_id
          AND connections.follower_id = auth.uid()
          AND connections.status = 'active'
      )
      AND (
        status_updates.targeted_follower_ids IS NULL
        OR auth.uid() = ANY(status_updates.targeted_follower_ids)
      )
    )
  );

-- ─── 9. caregiver_responses cross-read SELECT policy ────────────────────────
DROP POLICY IF EXISTS "Helpers can read all responses on updates they follow" ON caregiver_responses;
CREATE POLICY "Helpers can read all responses on updates they follow"
  ON caregiver_responses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM status_updates su
      JOIN connections c ON c.patient_id = su.patient_id
      WHERE su.id = caregiver_responses.status_update_id
        AND c.follower_id = auth.uid()
        AND c.status = 'active'
    )
  );

-- ─── 10. caregiver_responses → profiles foreign key ─────────────────────────
-- Without this FK, the JS client's join hint
-- `profiles!caregiver_responses_caregiver_id_fkey` silently fails and
-- response queries return {}. Guarded so re-running is safe.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'caregiver_responses_caregiver_id_fkey'
      AND conrelid = 'caregiver_responses'::regclass
  ) THEN
    ALTER TABLE caregiver_responses
      ADD CONSTRAINT caregiver_responses_caregiver_id_fkey
      FOREIGN KEY (caregiver_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ─── 11. status_updates completion fields (final names) ─────────────────────
-- The app on `main` reads/writes `completed_at` / `completed_by`
-- (src/services/backend.ts:1310). Production may be in any of three states:
--   A. neither column exists            → create them under the final names
--   B. legacy `resolved_*` columns only → rename them
--   C. already renamed                  → no-op
-- The block below reconciles all three without erroring on a re-run.

DO $$
DECLARE
  has_resolved_at  boolean;
  has_resolved_by  boolean;
  has_completed_at boolean;
  has_completed_by boolean;
BEGIN
  SELECT
    bool_or(column_name = 'resolved_at'),
    bool_or(column_name = 'resolved_by'),
    bool_or(column_name = 'completed_at'),
    bool_or(column_name = 'completed_by')
  INTO has_resolved_at, has_resolved_by, has_completed_at, has_completed_by
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'status_updates';

  -- Case B: legacy name present, final name absent → rename in place (keeps data).
  IF has_resolved_at AND NOT has_completed_at THEN
    ALTER TABLE status_updates RENAME COLUMN resolved_at TO completed_at;
    RAISE NOTICE 'Renamed status_updates.resolved_at -> completed_at';
  END IF;

  IF has_resolved_by AND NOT has_completed_by THEN
    ALTER TABLE status_updates RENAME COLUMN resolved_by TO completed_by;
    RAISE NOTICE 'Renamed status_updates.resolved_by -> completed_by';
  END IF;

  -- Both names present (a partial/interrupted earlier run): copy any values
  -- the legacy column still holds, then leave it in place. Nothing is dropped
  -- here — review and drop the stale column manually if you want it gone.
  IF has_resolved_at AND has_completed_at THEN
    UPDATE status_updates
       SET completed_at = resolved_at
     WHERE completed_at IS NULL AND resolved_at IS NOT NULL;
    RAISE NOTICE 'Both resolved_at and completed_at exist; backfilled completed_at. Stale column left in place.';
  END IF;

  IF has_resolved_by AND has_completed_by THEN
    UPDATE status_updates
       SET completed_by = resolved_by
     WHERE completed_by IS NULL AND resolved_by IS NOT NULL;
    RAISE NOTICE 'Both resolved_by and completed_by exist; backfilled completed_by. Stale column left in place.';
  END IF;
END $$;

-- Case A: neither name existed → create them under the final names.
ALTER TABLE status_updates
  ADD COLUMN IF NOT EXISTS completed_at timestamptz DEFAULT NULL;
ALTER TABLE status_updates
  ADD COLUMN IF NOT EXISTS completed_by uuid REFERENCES profiles(id) DEFAULT NULL;

-- UPDATE policy. Drop both historical names so the final state has exactly one.
DROP POLICY IF EXISTS "Patient or helper can mark update resolved"  ON status_updates;
DROP POLICY IF EXISTS "Patient or helper can mark update completed" ON status_updates;
CREATE POLICY "Patient or helper can mark update completed"
  ON status_updates FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = patient_id
    OR EXISTS (
      SELECT 1 FROM connections
      WHERE connections.patient_id = status_updates.patient_id
        AND connections.follower_id = auth.uid()
        AND connections.status = 'active'
    )
  )
  WITH CHECK (
    auth.uid() = patient_id
    OR EXISTS (
      SELECT 1 FROM connections
      WHERE connections.patient_id = status_updates.patient_id
        AND connections.follower_id = auth.uid()
        AND connections.status = 'active'
    )
  );

COMMIT;


-- ═══════════════════════════════════════════════════════════════════════════
--  OPTIONAL — review before running. Not part of any committed migration.
-- ═══════════════════════════════════════════════════════════════════════════
--
--  caregiver_responses.status_update_id has never had a foreign key (see
--  supabase/migrations/20260429183053_add_caregiver_responses.sql — the header
--  comment claims "FK to status_updates" but the CREATE TABLE omits it).
--
--  This matters for the new delete-account feature. Its docstring
--  (supabase/functions/delete-account/index.ts) states that caregiver_responses
--  rows are removed "via cascade from status_updates". They are not. Deleting a
--  user cascades away their status_updates, but responses OTHER helpers wrote on
--  those updates survive as orphans pointing at rows that no longer exist.
--
--  The user's OWN responses are still removed correctly (caregiver_responses
--  .caregiver_id -> profiles has ON DELETE CASCADE), so this is a residual-data
--  issue, not a broken deletion.
--
--  Running this block DELETES any already-orphaned rows — required, because the
--  FK cannot be added while they exist. Inspect the count first:
--
--    SELECT count(*) FROM caregiver_responses cr
--     WHERE NOT EXISTS (SELECT 1 FROM status_updates su WHERE su.id = cr.status_update_id);
--
--  Uncomment to apply:
--
-- BEGIN;
-- DELETE FROM caregiver_responses cr
--  WHERE NOT EXISTS (
--    SELECT 1 FROM status_updates su WHERE su.id = cr.status_update_id
--  );
--
-- DO $$
-- BEGIN
--   IF NOT EXISTS (
--     SELECT 1 FROM pg_constraint
--     WHERE conname = 'caregiver_responses_status_update_id_fkey'
--       AND conrelid = 'caregiver_responses'::regclass
--   ) THEN
--     ALTER TABLE caregiver_responses
--       ADD CONSTRAINT caregiver_responses_status_update_id_fkey
--       FOREIGN KEY (status_update_id) REFERENCES status_updates(id) ON DELETE CASCADE;
--   END IF;
-- END $$;
-- COMMIT;


-- ═══════════════════════════════════════════════════════════════════════════
--  VERIFICATION — run after the script above. Every query should return the
--  stated number of rows. A short count means that step did not apply.
-- ═══════════════════════════════════════════════════════════════════════════

-- a) Tables exist (4 expected)
-- SELECT table_name FROM information_schema.tables
--  WHERE table_schema = 'public'
--    AND table_name IN (
--      'caregiver_responses','connections',
--      'caregiver_archived_updates','patient_archived_updates'
--    )
--  ORDER BY table_name;

-- b) Columns exist under their FINAL names (5 expected). `resolved_at` /
--    `resolved_by` must NOT appear in this result.
-- SELECT table_name, column_name
--   FROM information_schema.columns
--  WHERE table_schema = 'public'
--    AND (
--          (table_name = 'profiles'       AND column_name = 'avatar_icon')
--       OR (table_name = 'status_updates' AND column_name IN
--             ('need_priority','targeted_follower_ids','completed_at','completed_by'))
--    )
--  ORDER BY table_name, column_name;

-- c) Confirm the legacy names are gone (0 rows expected)
-- SELECT column_name FROM information_schema.columns
--  WHERE table_schema = 'public' AND table_name = 'status_updates'
--    AND column_name IN ('resolved_at','resolved_by');

-- d) Constraints on caregiver_responses (2 expected)
-- SELECT conname FROM pg_constraint
--  WHERE conname IN (
--    'caregiver_responses_caregiver_id_fkey',
--    'caregiver_responses_update_caregiver_unique'
--  );

-- e) Unique index on profiles (1 expected)
-- SELECT indexname FROM pg_indexes
--  WHERE schemaname = 'public'
--    AND indexname = 'profiles_display_name_lower_unique';

-- f) The completion UPDATE policy uses the new name (1 row, "…completed")
-- SELECT policyname FROM pg_policies
--  WHERE schemaname = 'public' AND tablename = 'status_updates' AND cmd = 'UPDATE';

-- g) Full policy listing across every touched table
-- SELECT tablename, policyname FROM pg_policies
--  WHERE schemaname = 'public'
--    AND tablename IN (
--      'profiles','status_updates','caregiver_responses',
--      'connections','caregiver_archived_updates','patient_archived_updates'
--    )
--  ORDER BY tablename, policyname;
