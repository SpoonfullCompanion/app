/*
  # Add foreign key from caregiver_responses to profiles

  ## Problem
  caregiver_responses.caregiver_id references profiles(id) but no FK constraint
  was ever created. The Supabase JS client query uses the hint
  `profiles!caregiver_responses_caregiver_id_fkey` to join display names — without
  the FK this hint fails, causing getResponsesForPatient and getAllResponsesForUpdates
  to return an error and silently fall back to {}.

  ## Fix
  Add the FK constraint so the join hint resolves correctly and caregiver display
  names are returned alongside responses.
*/

ALTER TABLE caregiver_responses
  ADD CONSTRAINT caregiver_responses_caregiver_id_fkey
  FOREIGN KEY (caregiver_id) REFERENCES profiles(id) ON DELETE CASCADE;
