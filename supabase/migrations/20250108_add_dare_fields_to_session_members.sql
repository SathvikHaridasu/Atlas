-- Add dare fields to session_members table
-- This allows tracking whether a user has submitted a dare for a specific session

ALTER TABLE public.session_members
  ADD COLUMN IF NOT EXISTS dare_text TEXT,
  ADD COLUMN IF NOT EXISTS dare_submitted BOOLEAN NOT NULL DEFAULT false;

-- Refresh PostgREST schema cache (important after schema changes)
NOTIFY pgrst, 'reload schema';

