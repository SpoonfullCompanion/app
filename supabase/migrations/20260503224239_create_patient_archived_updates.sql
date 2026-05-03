/*
  # Create patient_archived_updates table

  ## Purpose
  Allows patients to archive their own status updates from their feed,
  mirroring the caregiver archive feature.

  ## New Tables
  - `patient_archived_updates`
    - `id` (uuid, primary key)
    - `patient_id` (uuid, FK to profiles) — the patient doing the archiving
    - `status_update_id` (uuid, FK to status_updates)
    - `archived_at` (timestamptz)
    - Unique constraint on (patient_id, status_update_id)

  ## Security
  - RLS enabled, patients can only manage their own archive rows
*/

CREATE TABLE IF NOT EXISTS patient_archived_updates (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id        uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status_update_id  uuid NOT NULL REFERENCES status_updates(id) ON DELETE CASCADE,
  archived_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (patient_id, status_update_id)
);

ALTER TABLE patient_archived_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can insert their own archive rows"
  ON patient_archived_updates
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Patients can read their own archive rows"
  ON patient_archived_updates
  FOR SELECT
  TO authenticated
  USING (auth.uid() = patient_id);

CREATE POLICY "Patients can delete their own archive rows"
  ON patient_archived_updates
  FOR DELETE
  TO authenticated
  USING (auth.uid() = patient_id);

CREATE INDEX IF NOT EXISTS patient_archived_updates_patient_id_idx
  ON patient_archived_updates(patient_id, archived_at DESC);
