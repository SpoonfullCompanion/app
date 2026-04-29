/*
  # Add need_priority to status_updates

  Adds an optional priority field to the status_updates table so patients
  can indicate urgency when communicating needs to caregivers.

  1. Changes
    - `status_updates`: new nullable column `need_priority` (text)
      - Allowed values: 'when_you_can' | 'soon' | 'asap'
      - NULL means no priority was set (e.g. energy/symptom-only updates)

  2. Notes
    - Non-destructive: existing rows remain unchanged (NULL priority)
    - No RLS changes needed — existing policies on status_updates already cover this column
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'status_updates' AND column_name = 'need_priority'
  ) THEN
    ALTER TABLE status_updates ADD COLUMN need_priority text;
  END IF;
END $$;
