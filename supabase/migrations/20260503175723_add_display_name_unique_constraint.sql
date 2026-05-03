/*
  # Add UNIQUE constraint to profiles.display_name

  ## Summary
  Prevents duplicate display names across all user profiles.

  ## Changes
  - `profiles` table: adds a case-insensitive unique index on `display_name`
    using `lower(display_name)` so "Alice" and "alice" are treated as the same
    name and both are rejected as duplicates.

  ## Notes
  - Existing rows with duplicate display names (e.g. auto-generated "Patient" or
    "Caregiver" defaults) would violate this constraint, so we de-duplicate them
    first by appending the first 6 chars of the profile id before adding the index.
  - The index is created with IF NOT EXISTS so re-running the migration is safe.
*/

-- De-duplicate any existing rows that share a lower-cased display_name
-- (happens when multiple accounts were auto-assigned the same role-based default)
DO $$
DECLARE
  r RECORD;
  dup_count INTEGER;
BEGIN
  FOR r IN
    SELECT lower(display_name) AS lname
    FROM profiles
    GROUP BY lower(display_name)
    HAVING count(*) > 1
  LOOP
    dup_count := 0;
    UPDATE profiles
    SET display_name = display_name || '-' || substring(id::text, 1, 6)
    WHERE lower(display_name) = r.lname;
  END LOOP;
END $$;

-- Create unique index on lower(display_name) for case-insensitive uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS profiles_display_name_lower_unique
  ON profiles (lower(display_name));
