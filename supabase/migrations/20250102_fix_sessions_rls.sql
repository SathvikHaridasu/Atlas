-- Fix sessions table schema and RLS policies
-- Run this in Supabase SQL Editor

-- 1. Ensure required columns exist in sessions table
ALTER TABLE public.sessions 
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.sessions 
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

ALTER TABLE public.sessions 
  ADD COLUMN IF NOT EXISTS join_code TEXT;

-- 2. Ensure RLS is enabled on sessions table
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- 3. Drop any existing conflicting policies on sessions
DROP POLICY IF EXISTS "Users can view sessions they are members of" ON public.sessions;
DROP POLICY IF EXISTS "Users can create sessions" ON public.sessions;
DROP POLICY IF EXISTS "insert sessions" ON public.sessions;
DROP POLICY IF EXISTS "select sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can view sessions they created OR are members of" ON public.sessions;

-- 4. Create RLS policies for INSERT
-- Allow authenticated users to create sessions where created_by matches auth.uid()
CREATE POLICY "insert sessions" ON public.sessions
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND created_by = auth.uid()
);

-- 5. Create RLS policies for SELECT
-- Allow users to select sessions they created OR are members of
CREATE POLICY "select sessions" ON public.sessions
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.session_members
      WHERE session_members.session_id = sessions.id
        AND session_members.user_id = auth.uid()
    )
  )
);

-- 6. Optional: Add UPDATE and DELETE policies if needed
DROP POLICY IF EXISTS "update sessions" ON public.sessions;
DROP POLICY IF EXISTS "delete sessions" ON public.sessions;

-- Allow users to update sessions they created
CREATE POLICY "update sessions" ON public.sessions
FOR UPDATE
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- Allow users to delete sessions they created
CREATE POLICY "delete sessions" ON public.sessions
FOR DELETE
USING (created_by = auth.uid());

-- Refresh PostgREST schema cache (important after schema changes)
NOTIFY pgrst, 'reload schema';

