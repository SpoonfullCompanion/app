/*
  # Add Hospital Messages Tracking

  1. Changes to Tables
    - `prototype_sessions`
      - Add `hospital_messages_played` (jsonb, nullable) - Array of messages played during hospital session

  2. Purpose
    - Track which pre-written hospital messages were read aloud via text-to-speech
    - Enable analytics on which messages are most commonly used
    - Allow future improvements based on usage patterns

  3. Notes
    - Only applies to sessions where helper_location = 'hospital'
    - Array contains the actual message text that was spoken
    - Each message play is appended to the array with timestamp tracking handled in app
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prototype_sessions' AND column_name = 'hospital_messages_played'
  ) THEN
    ALTER TABLE prototype_sessions ADD COLUMN hospital_messages_played jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;
