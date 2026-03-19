/*
  # Allow caregivers to leave an active pairing

  1. Problem
    - Caregivers can claim a pending pairing, but cannot clear `caregiver_id`
      back to null because the UPDATE policy checks the new row and rejects it.

  2. Fix
    - Replace the update policy so the new row is valid when:
      - a caregiver claims a pending pairing
      - a caregiver releases their own pairing back to pending/null
      - a patient updates their own pairing row
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
