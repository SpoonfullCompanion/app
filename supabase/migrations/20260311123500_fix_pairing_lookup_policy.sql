/*
  # Fix invite code lookup for cross-browser pairing

  1. Problem
    - Patients could create a local invite code, but caregivers in another browser
      could not look up pending pairings because RLS only allowed reads by already-paired users.

  2. Fix
    - Keep paired-user read access
    - Add read access for authenticated users when the pairing is still pending
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'pairings'
      AND policyname = 'Authenticated users can read pending pairings'
  ) THEN
    CREATE POLICY "Authenticated users can read pending pairings"
      ON pairings
      FOR SELECT
      TO authenticated
      USING (status = 'pending');
  END IF;
END $$;
