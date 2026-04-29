/*
  # Add unique constraint to caregiver_responses

  Ensures one response record per (status_update_id, caregiver_id) pair,
  enabling upsert operations.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'caregiver_responses_update_caregiver_unique'
  ) THEN
    ALTER TABLE caregiver_responses
      ADD CONSTRAINT caregiver_responses_update_caregiver_unique
      UNIQUE (status_update_id, caregiver_id);
  END IF;
END $$;
