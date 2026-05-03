/*
  # Fix patient_friend status read policy

  ## Problem
  The previous migration added an incorrect policy. This migration drops it and
  adds the correct one.

  In a patient_friend connection: patient_id=A, follower_id=B.
  - The existing policy lets B read A's updates (follower reads patient's updates).
  - Missing: A needs to read B's updates. B's status_updates have patient_id=B,
    and in the connection row, B is the follower_id while A is the patient_id.

  ## Fix
  Drop the incorrect policy and add the correct one: allow reading status updates
  for a user (the follower) when auth.uid() is the patient_id in a patient_friend
  connection with that follower.
*/

DROP POLICY IF EXISTS "Friends can read each other status updates" ON status_updates;

CREATE POLICY "Patients can read friend follower status updates"
  ON status_updates
  FOR SELECT
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
