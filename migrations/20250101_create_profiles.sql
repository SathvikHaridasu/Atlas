BEGIN;

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY,
  created_at timestamptz DEFAULT now() NOT NULL,
  username text,
  bio text,
  email text  -- optional; remove if not needed
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_insert_authenticated_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_authenticated_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_authenticated_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_prevent_delete" ON public.profiles;

CREATE POLICY "profiles_insert_authenticated_own"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_select_authenticated_own"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "profiles_update_authenticated_own"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_prevent_delete"
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (false);

COMMIT;