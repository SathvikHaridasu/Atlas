-- Fix code column consistency - Ensure 'code' column exists and is used
-- Run this in Supabase SQL Editor

-- ROOT CAUSE: Column name mismatch
-- - Migrations add 'join_code' column
-- - Code uses 'code' column  
-- - This mismatch causes "Session not found" errors

-- Ensure 'code' column exists (primary column name)
ALTER TABLE public.sessions 
  ADD COLUMN IF NOT EXISTS code TEXT NOT NULL;

-- If join_code exists but code doesn't have values, copy them
-- (This handles case where sessions were created with join_code)
UPDATE public.sessions
SET code = COALESCE(code, join_code)
WHERE code IS NULL AND join_code IS NOT NULL;

-- Make code NOT NULL if it was nullable before
-- (This might fail if there are NULL values - handle those first)
-- ALTER TABLE public.sessions ALTER COLUMN code SET NOT NULL;

-- Optionally, drop join_code column if code is now the primary column
-- Only do this if you're sure all data is migrated
-- ALALES TABLE public.sessions DROP COLUMN IF EXISTS join_code;

-- Create index on code for faster lookups
CREATE INDEX IF NOT EXISTS idx_sessions_code ON public.sessions(code);

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';

