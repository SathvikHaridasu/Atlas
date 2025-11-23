-- Comprehensive migration to fix sessions, messaging, and RLS issues
-- Run this in Supabase SQL Editor

-- 1. Ensure required columns exist in sessions table
ALTER TABLE public.sessions 
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived'));

ALTER TABLE public.sessions 
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.sessions 
  ADD COLUMN IF NOT EXISTS join_code TEXT;

ALTER TABLE public.sessions 
  ADD COLUMN IF NOT EXISTS week_start DATE;

ALTER TABLE public.sessions 
  ADD COLUMN IF NOT EXISTS week_end DATE;

-- Create index on join_code for faster lookups
CREATE INDEX IF NOT EXISTS idx_sessions_join_code ON public.sessions(join_code);

-- 2. Ensure points column exists in session_members
ALTER TABLE public.session_members 
  ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;

-- 3. Ensure unique constraint on session_members
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'unique_session_user'
  ) THEN
    ALTER TABLE public.session_members
      ADD CONSTRAINT unique_session_user UNIQUE(session_id, user_id);
  END IF;
END $$;

-- 4. Drop and recreate RLS policies for messages with proper membership checks
DROP POLICY IF EXISTS "Users can view messages for sessions they belong to" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages to sessions they belong to" ON public.messages;
DROP POLICY IF EXISTS "select messages if member" ON public.messages;
DROP POLICY IF EXISTS "insert messages if member" ON public.messages;

-- Messages SELECT policy - users can only see messages if they're members
CREATE POLICY "select messages if member" ON public.messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.session_members
    WHERE session_members.session_id = messages.session_id
    AND session_members.user_id = auth.uid()
  )
);

-- Messages INSERT policy - users can only send messages if they're members
CREATE POLICY "insert messages if member" ON public.messages
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.session_members
    WHERE session_members.session_id = messages.session_id
    AND session_members.user_id = auth.uid()
  )
);

-- 5. Fix session_members policies to allow joining
DROP POLICY IF EXISTS "Users can view session members for sessions they belong to" ON public.session_members;
DROP POLICY IF EXISTS "Users can join sessions" ON public.session_members;
DROP POLICY IF EXISTS "Users can update session members" ON public.session_members;

-- Allow viewing members if you're a member of that session
CREATE POLICY "view members if session member" ON public.session_members
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.session_members sm
    WHERE sm.session_id = session_members.session_id
    AND sm.user_id = auth.uid()
  )
);

-- Allow inserting yourself as a member (joining)
CREATE POLICY "join sessions" ON public.session_members
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow updating your own membership (e.g., points)
CREATE POLICY "update own membership" ON public.session_members
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 6. Enable Realtime for messages and session_members tables
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.session_members;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.sessions;

-- 7. Create function to generate unique join codes (optional, can be done in client)
CREATE OR REPLACE FUNCTION generate_join_code() RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Verify the changes
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name IN ('sessions', 'session_members', 'messages')
  AND table_schema = 'public'
ORDER BY table_name, ordinal_position;

