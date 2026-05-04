/*
  # Add resolved_at and resolved_by to status_updates

  ## Summary
  Adds two nullable columns to status_updates so either the patient or any
  connected helper can mark an update as resolved. Resolving also triggers
  archiving on both sides (handled in application code).

  ## New Columns
  - `status_updates.resolved_at` (timestamptz) — when the update was marked resolved
  - `status_updates.resolved_by` (uuid, FK → profiles.id) — who resolved it

  ## Security
  - New UPDATE policy allows the patient who owns the update OR any authenticated
    user who is a confirmed follower/connection of the patient to write resolved_at/resolved_by.
  - Existing SELECT policies already cover these columns via SELECT *.
*/

-- Add columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'status_updates' AND column_name = 'resolved_at'
  ) THEN
    ALTER TABLE status_updates ADD COLUMN resolved_at timestamptz DEFAULT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'status_updates' AND column_name = 'resolved_by'
  ) THEN
    ALTER TABLE status_updates ADD COLUMN resolved_by uuid REFERENCES profiles(id) DEFAULT NULL;
  END IF;
END $$;

-- Allow patient or any connected helper to mark resolved
CREATE POLICY "Patient or helper can mark update resolved"
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
