-- Supabase RLS Policy Fix for Profiles Table
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)

-- IMPORTANT: This assumes your profiles table has a column named 'user_id'
-- If your table uses 'id' instead, replace 'user_id' with 'id' in all policies below

-- Step 1: Ensure RLS is enabled on the profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop existing policies if they exist (optional, for clean slate)
DROP POLICY IF EXISTS "Allow users to insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to select their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to read their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.profiles;

-- Step 3: Create INSERT policy - allows authenticated users to insert their own profile
-- This policy checks that the user_id being inserted matches the authenticated user's ID
CREATE POLICY "Allow users to insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK ( auth.uid() = user_id );

-- Step 4: Create SELECT policy - allows users to read their own profile
-- This policy ensures users can only see their own profile data
CREATE POLICY "Allow users to select their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING ( auth.uid() = user_id );

-- Step 5: Create UPDATE policy - allows users to update their own profile
-- This policy ensures users can only update their own profile
CREATE POLICY "Allow users to update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING ( auth.uid() = user_id )
WITH CHECK ( auth.uid() = user_id );

-- Verification: Check if policies were created
-- You can run this query to see all policies on the profiles table:
-- SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- To verify your table structure, run:
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'profiles' AND table_schema = 'public';

