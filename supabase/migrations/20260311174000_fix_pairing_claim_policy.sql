/*
  # Allow caregivers to claim pending pairings

  1. Problem
    - Caregivers can read a pending pairing by invite code, but cannot update it
      because the old UPDATE policy only allowed rows already linked to their auth.uid().

  2. Fix
    - Replace the update policy so:
      - patients can still update their own pairings
      - caregivers can claim a pending pairing when `caregiver_id` is null
      - paired caregivers can continue to update their own pairing row
*/

DROP POLICY IF EXISTS "Paired users can update pairings" ON pairings;

CREATE POLICY "Paired users can update pairings"
  ON pairings
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = patient_id
    OR auth.uid() = caregiver_id
    OR (status = 'pending' AND caregiver_id IS NULL)
  )
  WITH CHECK (
    auth.uid() = patient_id
    OR auth.uid() = caregiver_id
    OR (status = 'paired' AND auth.uid() = caregiver_id)
    OR (status = 'pending' AND caregiver_id IS NULL)
  );
