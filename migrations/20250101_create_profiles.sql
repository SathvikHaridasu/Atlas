BEGIN;

-- create profiles table if missing
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY,
  created_at timestamptz DEFAULT now() NOT NULL,
  username text,
  bio text,
  email text
);

-- ensure extension for uuid generate if you plan to use gen_random_uuid on server (optional)
-- CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- RLS on
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Remove previously broken policies if found
DROP POLICY IF EXISTS "Account Creation" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated users to insert their own profile" ON public.profiles;

-- INSERT policy: only authenticated users may insert their own row where id = auth.uid()
CREATE POLICY "profiles_insert_authenticated_own"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- SELECT policy: allow authenticated users to select their own row; allow public minimal fields if needed
CREATE POLICY "profiles_select_authenticated_own"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- UPDATE policy: authenticated users may update their own row
CREATE POLICY "profiles_update_authenticated_own"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Prevent deletes by default (or allow owner)
CREATE POLICY "profiles_prevent_delete"
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (false);

COMMIT;