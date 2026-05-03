/*
  # Add avatar_icon to profiles

  Adds an `avatar_icon` column to the `profiles` table so users can pick a
  small illustrated icon to represent themselves throughout the app.

  ## Changes
  - `profiles.avatar_icon` (text, nullable) — stores an icon key string such as
    "leaf", "moon", "star", etc. Null means the user has not chosen one yet;
    the UI shows a default fallback.

  ## Notes
  - No data loss possible — additive column only.
  - Existing RLS policies on `profiles` cover this column automatically because
    they operate at the row level.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'avatar_icon'
  ) THEN
    ALTER TABLE profiles ADD COLUMN avatar_icon text;
  END IF;
END $$;
