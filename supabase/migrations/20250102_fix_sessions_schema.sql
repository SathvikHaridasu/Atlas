-- Fix sessions table schema - Add missing columns
-- Run this in Supabase SQL Editor

-- Ensure status column exists (TEXT with default 'active')
ALTER TABLE public.sessions 
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Ensure created_by column exists (references profiles)
ALTER TABLE public.sessions 
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Ensure join_code column exists
ALTER TABLE public.sessions 
  ADD COLUMN IF NOT EXISTS join_code TEXT;

-- Refresh PostgREST schema cache (important after schema changes)
NOTIFY pgrst, 'reload schema';

