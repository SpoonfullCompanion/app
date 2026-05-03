/*
  # Add patient_friend status read policy

  ## Problem
  The existing "Connected users can read status updates" policy only permits
  access when auth.uid() == connections.follower_id. In a patient_friend
  connection, the current user may be on the patient_id side, meaning they
  cannot read their friend's updates even though the friendship is active.

  ## Change
  Add a new SELECT policy that allows a user to read status updates from
  patients they are connected to via an active patient_friend connection,
  regardless of which side of the connection they are on.
*/

CREATE POLICY "Friends can read each other status updates"
  ON status_updates
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM connections
      WHERE connections.connection_type = 'patient_friend'
        AND connections.status = 'active'
        AND connections.patient_id = status_updates.patient_id
        AND (
          connections.follower_id = auth.uid()
          OR connections.patient_id = auth.uid()
        )
    )
    AND patient_id != auth.uid()
  );
