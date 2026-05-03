/*
  # Allow authenticated users to read other profiles

  ## Problem
  The profiles table only had a single policy allowing users to manage their own row.
  This blocked caregivers from searching for patients by display name.

  ## Changes
  - Add a SELECT policy so any authenticated user can read any profile's
    public fields (id, display_name, role, avatar_icon).
  - The existing "manage own profile" policy is left intact for INSERT/UPDATE/DELETE.
*/

CREATE POLICY "Authenticated users can search profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);
