/*
  # Create connections table

  Replaces the 1:1 pairings model with a flexible connections model that
  supports one patient having multiple caregivers and one caregiver having
  multiple patients.

  ## New Tables

  ### connections
  - `id` (uuid, pk)
  - `patient_id` (uuid, fk → profiles) — the patient being followed
  - `follower_id` (uuid, fk → profiles) — the person following (caregiver or patient friend)
  - `connection_type` (text) — 'caregiver' or 'patient_friend'
  - `status` (text) — 'pending' (request sent, awaiting patient approval) | 'active' | 'declined'
  - `requested_by` (uuid) — which side initiated the request
  - `created_at`, `updated_at`

  ## Indexes
  - (patient_id, status) — for patient fetching their followers
  - (follower_id, status) — for caregiver fetching their patients

  ## Security
  - RLS enabled
  - Patients can see all connections where they are the patient
  - Followers can see all connections where they are the follower
  - Either party can create a connection request (patient invites caregiver OR caregiver requests patient)
  - Patients can update (approve/decline) connections where they are the patient
  - Either party can delete their own connection (disconnect)

  ## Notes
  - The pairings table is NOT dropped — existing data is preserved.
  - New users will create connections. Existing paired users continue to work
    via pairings until Chunk 3 migrates them.
  - `connection_type` = 'caregiver' means full visibility (energy + symptoms + needs).
    `connection_type` = 'patient_friend' means partial visibility (energy + symptoms only).
    Visibility enforcement happens in application logic and future RLS policies.
*/

CREATE TABLE IF NOT EXISTS connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  follower_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  connection_type text NOT NULL DEFAULT 'caregiver'
    CHECK (connection_type IN ('caregiver', 'patient_friend')),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'declined')),
  requested_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT connections_unique_pair UNIQUE (patient_id, follower_id)
);

CREATE INDEX IF NOT EXISTS connections_patient_id_status_idx
  ON connections(patient_id, status);

CREATE INDEX IF NOT EXISTS connections_follower_id_status_idx
  ON connections(follower_id, status);

ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

-- Either party can see their connections
CREATE POLICY "Users can view their own connections"
  ON connections FOR SELECT
  TO authenticated
  USING (auth.uid() = patient_id OR auth.uid() = follower_id);

-- Either party can create a connection request
CREATE POLICY "Users can create connection requests"
  ON connections FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.uid() = patient_id OR auth.uid() = follower_id)
    AND auth.uid() = requested_by
  );

-- Patient approves/declines incoming requests; follower can also update (e.g. withdraw)
CREATE POLICY "Patients can update connections they are part of"
  ON connections FOR UPDATE
  TO authenticated
  USING (auth.uid() = patient_id OR auth.uid() = follower_id)
  WITH CHECK (auth.uid() = patient_id OR auth.uid() = follower_id);

-- Either party can remove a connection
CREATE POLICY "Users can delete their own connections"
  ON connections FOR DELETE
  TO authenticated
  USING (auth.uid() = patient_id OR auth.uid() = follower_id);
