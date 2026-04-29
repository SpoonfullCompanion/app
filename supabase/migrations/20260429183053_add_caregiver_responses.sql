/*
  # Add caregiver responses and seen tracking

  1. New Tables
    - `caregiver_responses`
      - `id` (uuid, primary key)
      - `status_update_id` (uuid, FK to status_updates)
      - `caregiver_id` (uuid, FK to profiles)
      - `message` (text) — the response text ("Got it" or custom note)
      - `seen_at` (timestamptz) — when caregiver first viewed this update
      - `created_at` (timestamptz)

  2. Security
    - RLS enabled
    - Caregivers can insert/select their own responses
    - Patients can select responses directed at their updates
*/

CREATE TABLE IF NOT EXISTS caregiver_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status_update_id uuid NOT NULL,
  caregiver_id uuid NOT NULL,
  message text NOT NULL DEFAULT '',
  seen_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE caregiver_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Caregivers can insert own responses"
  ON caregiver_responses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = caregiver_id);

CREATE POLICY "Caregivers can select own responses"
  ON caregiver_responses FOR SELECT
  TO authenticated
  USING (auth.uid() = caregiver_id);

CREATE POLICY "Caregivers can update own responses"
  ON caregiver_responses FOR UPDATE
  TO authenticated
  USING (auth.uid() = caregiver_id)
  WITH CHECK (auth.uid() = caregiver_id);

CREATE INDEX IF NOT EXISTS caregiver_responses_update_idx ON caregiver_responses(status_update_id);
CREATE INDEX IF NOT EXISTS caregiver_responses_caregiver_idx ON caregiver_responses(caregiver_id);
