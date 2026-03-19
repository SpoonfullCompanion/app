/*
  # Fix Security Issues

  1. Changes to `prototype_sessions` RLS Policies
    - Remove overly permissive INSERT policy that allows unrestricted access
    - Add restrictive INSERT policy that validates session data
    - Ensures only valid prototype session data can be inserted
    - Prevents abuse by requiring proper data structure

  2. Security Notes
    - The new policy validates that required fields are present
    - Helper location must be either 'in_room' or 'away'
    - This maintains public access for the prototype while preventing malicious data
    - No authentication required (intentional for public prototype)
*/

-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Anyone can insert prototype sessions" ON prototype_sessions;

-- Create a more restrictive policy that validates input data
CREATE POLICY "Allow valid prototype session inserts"
  ON prototype_sessions
  FOR INSERT
  TO anon
  WITH CHECK (
    -- Ensure helper_location is one of the valid values
    helper_location IN ('in_room', 'away')
    -- Ensure selected_needs is a valid jsonb array
    AND jsonb_typeof(selected_needs) = 'array'
    -- Ensure symptoms is null or a valid jsonb array
    AND (symptoms IS NULL OR jsonb_typeof(symptoms) = 'array')
    -- Ensure message_sent is a boolean (will be handled by default/type)
    AND message_sent IS NOT NULL
  );