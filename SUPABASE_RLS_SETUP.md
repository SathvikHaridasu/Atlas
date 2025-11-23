# Supabase RLS Setup Instructions

## Quick Fix for "new row violates row-level security policy" Error

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Click **New query**

### Step 2: Run the SQL Script
Copy and paste the contents of `supabase-rls-fix.sql` into the SQL editor and run it.

**OR** run these commands directly:

```sql
-- Enable RLS (if not already enabled)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (if any)
DROP POLICY IF EXISTS "Allow users to insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to select their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.profiles;

-- Create INSERT policy
CREATE POLICY "Allow users to insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK ( auth.uid() = user_id );

-- Create SELECT policy
CREATE POLICY "Allow users to select their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING ( auth.uid() = user_id );

-- Create UPDATE policy
CREATE POLICY "Allow users to update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING ( auth.uid() = user_id )
WITH CHECK ( auth.uid() = user_id );

