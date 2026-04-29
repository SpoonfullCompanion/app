/*
  # Allow patients to read caregiver responses on their own status updates

  Patients need to see whether their helper has seen/responded to their updates.
  This policy allows authenticated users to read responses where the linked
  status_update belongs to them (patient_id = auth.uid()).
*/

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
