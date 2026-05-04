/*
  # Allow helpers to read all responses on shared patient updates

  ## Problem
  The existing SELECT policy on caregiver_responses only lets a caregiver read
  their own row (auth.uid() = caregiver_id). This means getAllResponsesForUpdates
  silently returns only the current helper's row — other helpers' responses are
  blocked at the database level, so the "also responded" UI never has any data.

  ## Fix
  Add a new SELECT policy that lets any active connected helper read all
  caregiver_responses rows for updates belonging to a patient they follow.
  The check joins through status_updates → connections to confirm the caller
  is an active follower of the patient who sent the update.

  ## Security
  - Only authenticated users
  - Only for updates whose patient is connected to the querying helper
  - The existing patient read policy is unchanged
*/

CREATE POLICY "Helpers can read all responses on updates they follow"
  ON caregiver_responses
  FOR SELECT
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
