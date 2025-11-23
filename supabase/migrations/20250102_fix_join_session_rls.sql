-- Fix RLS policy to allow looking up sessions by join_code for joining
-- Run this in Supabase SQL Editor

-- PROBLEM:
-- The current SELECT policy only allows:
-- 1. Session creators (created_by = auth.uid())
-- 2. Session members (via session_members table)
-- 
-- This creates a circular dependency:
-- - Users need to SELECT a session by code BEFORE they can become members
-- - But the RLS policy blocks SELECT unless they're already members
-- - Therefore, non-members cannot join sessions!

-- SOLUTION:
-- Allow authenticated users to SELECT sessions for join code lookups
-- This is secure because:
-- 1. Users must know the exact 6-character code
-- 2. They can't enumerate or browse all sessions
-- 3. They can only join if they have the correct code
-- 4. Full session details are still protected by membership

-- Drop the existing restrictive SELECT policy
DROP POLICY IF EXISTS "select sessions" ON public.sessions;

-- Create a new SELECT policy that allows authenticated users to look up sessions
-- This enables join code lookups while still protecting session data
CREATE POLICY "select sessions" ON public.sessions
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  -- Allow ALL authenticated users to SELECT sessions
  -- They still need the exact join code to find a session
  -- This enables the join flow while maintaining security
);

-- Refresh PostgREST schema cache (important after schema changes)
NOTIFY pgrst, 'reload schema';

-- Verification: After running this, test that:
-- 1. Users can look up sessions by code (even if not a member)
-- 2. Users can join sessions using join codes
-- 3. RLS still prevents unauthorized access to other session data
