/*
  # Add caregiver archived updates table

  ## Summary
  Allows caregivers to archive (bookmark) individual status update cards from their feed.
  Each caregiver can archive up to 20 updates; pruning beyond that is enforced in the app.

  ## New Tables
  - `caregiver_archived_updates`
    - `id` (uuid, primary key)
    - `caregiver_id` (uuid, FK → profiles) — the caregiver who archived it
    - `status_update_id` (uuid, FK → status_updates) — the archived update
    - `archived_at` (timestamptz) — when it was archived

  ## Constraints
  - Unique on (caregiver_id, status_update_id) — one archive entry per update per caregiver

  ## Security
  - RLS enabled; caregivers can only read/insert/delete their own rows
*/

CREATE TABLE IF NOT EXISTS caregiver_archived_updates (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  caregiver_id      uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status_update_id  uuid        NOT NULL REFERENCES status_updates(id) ON DELETE CASCADE,
  archived_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT caregiver_archived_updates_unique UNIQUE (caregiver_id, status_update_id)
);

CREATE INDEX IF NOT EXISTS idx_caregiver_archived_updates_caregiver
  ON caregiver_archived_updates (caregiver_id, archived_at DESC);

ALTER TABLE caregiver_archived_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Caregivers can view own archived updates"
  ON caregiver_archived_updates FOR SELECT
  TO authenticated
  USING (auth.uid() = caregiver_id);

CREATE POLICY "Caregivers can archive updates"
  ON caregiver_archived_updates FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = caregiver_id);

CREATE POLICY "Caregivers can unarchive own updates"
  ON caregiver_archived_updates FOR DELETE
  TO authenticated
  USING (auth.uid() = caregiver_id);
