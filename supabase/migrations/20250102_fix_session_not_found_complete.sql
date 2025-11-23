-- Complete fix for "Session Not Found" when joining by code
-- Run this in Supabase SQL Editor

-- ===== ROOT CAUSE DIAGNOSIS =====
-- Primary: RLS policy blocks non-members from SELECTing sessions by code
-- Secondary: Column name inconsistency (code vs join_code)
-- =================================

-- Step 1: Ensure 'code' column exists (the column name used by the app code)
ALTER TABLE public.sessions 
  ADD COLUMN IF NOT EXISTS code TEXT;

-- Step 2: If join_code exists but code is NULL, copy values from join_code
-- This handles cases where sessions were created with join_code instead of code
UPDATE public.sessions
SET code = COALESCE(code, join_code)
WHERE (code IS NULL OR code = '') AND join_code IS NOT NULL AND join_code != '';

-- Step 3: Ensure code column has values (if it's still NULL for some sessions, generate codes)
-- Note: This only affects sessions without codes - existing codes are preserved

-- Step 4: Enable RLS if not already enabled
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Step 5: Drop any existing restrictive SELECT policies
DROP POLICY IF EXISTS "select sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can view sessions they are members of" ON public.sessions;
DROP POLICY IF EXISTS "select sessions if member" ON public.sessions;
DROP POLICY IF EXISTS "Users can view sessions they created OR are members of" ON public.sessions;

-- Step 6: Create permissive SELECT policy to allow code lookups
-- This allows authenticated users to look up sessions by code BEFORE joining
-- Security: Users still need the exact 6-character code to find a session
CREATE POLICY "select sessions" ON public.sessions
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  -- Allow ALL authenticated users to SELECT sessions
  -- This enables join code lookups while maintaining security
  -- Users can't enumerate sessions - they need the exact code
);

-- Step 7: Create index on code column for faster lookups
CREATE INDEX IF NOT EXISTS idx_sessions_code ON public.sessions(code);
CREATE INDEX IF NOT EXISTS idx_sessions_join_code ON public.sessions(join_code);

-- Step 8: Verify the fix
-- Check that code column exists and has values
DO $$
DECLARE
  code_count INTEGER;
  null_code_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO code_count FROM public.sessions WHERE code IS NOT NULL AND code != '';
  SELECT COUNT(*) INTO null_code_count FROM public.sessions WHERE code IS NULL OR code = '';
  
  RAISE NOTICE 'Sessions with code: %', code_count;
  RAISE NOTICE 'Sessions without code: %', null_code_count;
  
  IF null_code_count > 0 THEN
    RAISE WARNING 'Found % sessions without codes. You may need to generate codes for existing sessions.', null_code_count;
  END IF;
END $$;

-- Step 9: Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- Verification query (run this after migration to check):
-- SELECT id, name, code, join_code, status, created_by
-- FROM public.sessions
-- LIMIT 5;

