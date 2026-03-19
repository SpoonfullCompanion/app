/*
  # Create Prototype Usage Tracking Table

  1. New Tables
    - `prototype_sessions`
      - `id` (uuid, primary key) - Unique session identifier
      - `helper_location` (text) - Either 'in_room' or 'away'
      - `selected_needs` (jsonb) - Array of selected need objects
      - `energy_status` (text, nullable) - Selected energy status
      - `symptoms` (jsonb, nullable) - Array of selected symptoms
      - `message_sent` (boolean) - Whether user completed and sent message
      - `created_at` (timestamptz) - Session timestamp

  2. Security
    - Enable RLS on `prototype_sessions` table
    - Add policy for anonymous usage (no auth required for prototype)
    - This is a public prototype tool, so we allow inserts without authentication
*/

CREATE TABLE IF NOT EXISTS prototype_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  helper_location text NOT NULL,
  selected_needs jsonb DEFAULT '[]'::jsonb,
  energy_status text,
  symptoms jsonb DEFAULT '[]'::jsonb,
  message_sent boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE prototype_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert prototype sessions"
  ON prototype_sessions
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "No one can read prototype sessions"
  ON prototype_sessions
  FOR SELECT
  TO anon
  USING (false);