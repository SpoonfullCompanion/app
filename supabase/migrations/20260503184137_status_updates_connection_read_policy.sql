/*
  # Add connection-based read policy for status_updates

  Caregivers and patient friends connected via the new `connections` table
  need to be able to read the status updates of their connected patients.

  ## Changes
  - New SELECT policy on `status_updates` that allows any user with an active
    connection to the patient (as either caregiver or patient_friend) to read
    that patient's updates.

  ## Notes
  - The existing 'Paired users can read status updates' policy (based on
    caregiver_id column) remains in place for backwards compatibility with
    existing pairings.
  - Both policies use OR logic via separate policies — Postgres RLS evaluates
    multiple SELECT policies with OR.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'status_updates'
      AND policyname = 'Connected users can read status updates'
  ) THEN
    CREATE POLICY "Connected users can read status updates"
      ON status_updates FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM connections
          WHERE connections.patient_id = status_updates.patient_id
            AND connections.follower_id = auth.uid()
            AND connections.status = 'active'
        )
      );
  END IF;
END $$;
