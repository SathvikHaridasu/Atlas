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
```

### Step 3: Verify Your Table Structure
If you're unsure whether your table uses `user_id` or `id`, run this query:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND table_schema = 'public';
```

- If you see a column named `user_id`, use the policies above (already correct)
- If you see a column named `id` (and no `user_id`), replace `user_id` with `id` in all three policies

### Step 4: Verify Policies Were Created
Run this to see all policies on the profiles table:

```sql
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```

You should see three policies:
1. "Allow users to insert their own profile"
2. "Allow users to select their own profile"
3. "Allow users to update their own profile"

### What This Does
- **INSERT policy**: Allows authenticated users to create their own profile row, but only if `user_id` matches their authenticated user ID
- **SELECT policy**: Allows users to read only their own profile data
- **UPDATE policy**: Allows users to update only their own profile data

### Your App Code
Your app code in `contexts/AuthContext.tsx` and `lib/auth.ts` is already correct - it uses `user_id: user.id` when inserting profiles, which matches the policy requirements.

After running the SQL script, the RLS error should be resolved!




