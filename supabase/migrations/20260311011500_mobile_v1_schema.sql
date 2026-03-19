/*
  # Mobile V1 schema

  1. New tables
    - `profiles`
    - `pairings`
    - `status_updates`
    - `notification_preferences`

  2. Notes
    - Supports one patient and one caregiver per pairing for v1
    - Keeps auth in Supabase Auth and role/profile metadata in `profiles`
    - Stores latest patient status for realtime delivery and caregiver views
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY,
  role text NOT NULL CHECK (role IN ('patient', 'caregiver')),
  email text,
  display_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'Users can manage their own profile'
  ) THEN
    CREATE POLICY "Users can manage their own profile"
      ON profiles
      FOR ALL
      TO authenticated
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS pairings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  patient_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  caregiver_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paired')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE pairings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'pairings'
      AND policyname = 'Paired users can read their pairing'
  ) THEN
    CREATE POLICY "Paired users can read their pairing"
      ON pairings
      FOR SELECT
      TO authenticated
      USING (auth.uid() = patient_id OR auth.uid() = caregiver_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'pairings'
      AND policyname = 'Authenticated users can read pending pairings'
  ) THEN
    CREATE POLICY "Authenticated users can read pending pairings"
      ON pairings
      FOR SELECT
      TO authenticated
      USING (status = 'pending');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'pairings'
      AND policyname = 'Patients can create pairings'
  ) THEN
    CREATE POLICY "Patients can create pairings"
      ON pairings
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = patient_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'pairings'
      AND policyname = 'Paired users can update pairings'
  ) THEN
    CREATE POLICY "Paired users can update pairings"
      ON pairings
      FOR UPDATE
      TO authenticated
      USING (
        auth.uid() = patient_id
        OR auth.uid() = caregiver_id
        OR (status = 'pending' AND caregiver_id IS NULL)
      )
      WITH CHECK (
        auth.uid() = patient_id
        OR auth.uid() = caregiver_id
        OR (status = 'paired' AND auth.uid() = caregiver_id)
        OR (status = 'pending' AND caregiver_id IS NULL)
      );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS status_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  caregiver_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  pairing_id uuid REFERENCES pairings(id) ON DELETE SET NULL,
  helper_location text CHECK (helper_location IN ('in_room', 'away', 'hospital')),
  selected_needs jsonb NOT NULL DEFAULT '[]'::jsonb,
  energy_status text,
  selected_symptoms jsonb NOT NULL DEFAULT '[]'::jsonb,
  message_text text NOT NULL,
  delivery text NOT NULL DEFAULT 'sent' CHECK (delivery IN ('sent', 'draft')),
  sent_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS status_updates_patient_id_sent_at_idx
  ON status_updates(patient_id, sent_at DESC);

ALTER TABLE status_updates ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'status_updates'
      AND policyname = 'Paired users can read status updates'
  ) THEN
    CREATE POLICY "Paired users can read status updates"
      ON status_updates
      FOR SELECT
      TO authenticated
      USING (auth.uid() = patient_id OR auth.uid() = caregiver_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'status_updates'
      AND policyname = 'Patients can create status updates'
  ) THEN
    CREATE POLICY "Patients can create status updates"
      ON status_updates
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = patient_id);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  push_enabled boolean NOT NULL DEFAULT false,
  local_reminders_enabled boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'notification_preferences'
      AND policyname = 'Users can manage their own notification preferences'
  ) THEN
    CREATE POLICY "Users can manage their own notification preferences"
      ON notification_preferences
      FOR ALL
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
