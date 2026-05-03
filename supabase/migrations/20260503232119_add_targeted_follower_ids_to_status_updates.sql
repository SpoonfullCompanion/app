/*
  # Add targeted_follower_ids to status_updates

  ## Summary
  Allows patients to target specific helpers when sending need requests.
  Status updates (energy/symptoms) always broadcast to all — only need submissions use this field.

  ## Changes
  - `status_updates` — new nullable column `targeted_follower_ids uuid[]`
    - NULL means "broadcast to all active connections" (existing behavior)
    - Non-null array means only the listed follower profile IDs can see this update

  ## Security
  - Updated the caregiver SELECT policy to respect targeting:
    if targeted_follower_ids is NULL → visible to all active connected caregivers (existing behavior)
    if targeted_follower_ids is non-null → only caregivers whose profile id is in the array
  - Patient can always read their own updates (existing policy unchanged)
*/

-- 1. Add the column (nullable, default null = broadcast)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'status_updates' AND column_name = 'targeted_follower_ids'
  ) THEN
    ALTER TABLE status_updates ADD COLUMN targeted_follower_ids uuid[] DEFAULT NULL;
  END IF;
END $$;

-- 2. Drop the existing caregiver SELECT policy so we can replace it
DO $$
BEGIN
  -- Drop known policy names that may exist from previous migrations
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'status_updates' AND policyname = 'Caregiver can read status updates for connected patients'
  ) THEN
    DROP POLICY "Caregiver can read status updates for connected patients" ON status_updates;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'status_updates' AND policyname = 'Connected users can read status updates'
  ) THEN
    DROP POLICY "Connected users can read status updates" ON status_updates;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'status_updates' AND policyname = 'Active connections can read status updates'
  ) THEN
    DROP POLICY "Active connections can read status updates" ON status_updates;
  END IF;
END $$;

-- 3. Create the replacement policy that respects targeted_follower_ids
CREATE POLICY "Active connections can read status updates"
  ON status_updates
  FOR SELECT
  TO authenticated
  USING (
    -- Patient always sees their own updates
    patient_id = auth.uid()
    OR
    -- Follower sees the update if they have an active connection to the patient
    -- AND the update is either broadcast (null) or targeted at them specifically
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
