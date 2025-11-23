# RLS Policy Fix - Sessions Table

## Problem
App was failing to create a session with error:
```
{"code":"42501","message":"new row violates row-level security policy for table \"sessions\""}
```

This error code `42501` indicates that Row Level Security (RLS) on the `sessions` table is blocking INSERTs.

---

## Solution

### 1. SQL Migration ✅

**File**: `supabase/migrations/20250102_fix_sessions_rls.sql`

This migration:
- ✅ Adds missing columns (`created_by`, `status`, `join_code`)
- ✅ Ensures RLS is enabled
- ✅ Drops existing conflicting policies
- ✅ Creates proper RLS policies for INSERT, SELECT, UPDATE, and DELETE

**Run this migration in Supabase SQL Editor!**

```sql
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
```

### 2. TypeScript Code Updates ✅

#### Updated `Session` Interface
```typescript
export interface Session {
  id: string;
  name: string;
  created_at: string;
  created_by: string;
  status: string; // 'active', 'completed', etc.
  join_code: string | null;
  week_start?: string;
  week_end?: string;
}
```

#### Updated `createSession` Function
**Key Changes:**
- ✅ **Gets user from `supabase.auth.getUser()`** instead of accepting `userId` as parameter
- ✅ **Ensures `created_by` matches `auth.uid()`** for RLS policy compliance
- ✅ **Generates `join_code` automatically** (6 characters)
- ✅ **Handles error code 42501** with helpful message
- ✅ **Comprehensive error handling** with detailed logging

**Function Signature Changed:**
```typescript
// OLD: createSession(userId: string, name: string)
// NEW: createSession(name: string)
```

The function now:
1. Gets authenticated user via `supabase.auth.getUser()`
2. Generates a 6-character join code
3. Inserts session with `created_by: user.id` (must match `auth.uid()`)
4. Handles RLS errors specifically (code 42501)
5. Adds creator to `session_members` automatically

### 3. Screen Updates ✅

#### `SessionsHomeScreen.tsx`
- ✅ Updated call from `createSession(user.id, sessionName.trim())` to `createSession(sessionName.trim())`
- ✅ Removed `userId` parameter

#### `CreateSessionScreen.tsx`
- ✅ Updated call from `createSession(user.id, name.trim())` to `createSession(name.trim())`
- ✅ Removed unused `password` field (not part of session schema)
- ✅ Removed `userId` parameter

---

## RLS Policy Explanation

### INSERT Policy
```sql
CREATE POLICY "insert sessions" ON public.sessions
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND created_by = auth.uid()
);
```

**What this means:**
- Only authenticated users can create sessions
- The `created_by` field **must** equal the authenticated user's ID (`auth.uid()`)
- This is why the client code now gets the user via `supabase.auth.getUser()` and sets `created_by: user.id`

### SELECT Policy
```sql
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
```

**What this means:**
- Users can see sessions they **created** (creator)
- Users can see sessions they **are members of** (via `session_members` table)
- This allows session creators to see their own sessions even before joining as a member

---

## Steps to Apply Fix

1. **Run SQL Migration**:
   - Go to Supabase Dashboard → SQL Editor
   - Copy the SQL from `supabase/migrations/20250102_fix_sessions_rls.sql`
   - Paste and run it
   - Wait 30-60 seconds for schema cache to refresh

2. **Code Already Updated**:
   - ✅ `lib/sessionService.ts` - Updated `createSession` function
   - ✅ `src/screens/SessionsHomeScreen.tsx` - Updated function call
   - ✅ `src/screens/CreateSessionScreen.tsx` - Updated function call and removed password field

3. **Test**:
   - Try creating a session in your app
   - Should work without RLS errors now!

---

## Why This Fixes the Error

**Before:**
- `createSession` accepted `userId` as a parameter
- If the passed `userId` didn't match `auth.uid()`, the RLS policy would block the INSERT
- Error: `42501 - new row violates row-level security policy`

**After:**
- `createSession` gets the user directly from `supabase.auth.getUser()`
- Sets `created_by: user.id` which **always** matches `auth.uid()`
- RLS policy allows the INSERT because `created_by = auth.uid()` ✅

---

## All Queries Verified

All queries in `lib/sessionService.ts` using `sessions` table:
1. ✅ `createSession()` - Inserts with `created_by`, `join_code`, `status`
2. ✅ `getSession()` - Uses `.select("*")` - works with all valid columns
3. ✅ `joinSessionWithCode()` - Uses `.select("*")` and checks `status`
4. ✅ `getUserSessions()` - Uses `.select("*")` - filtered by membership
5. ✅ `endOfWeekProcessing()` - Updates `week_start` and `week_end` only

All columns referenced:
- ✅ `id`, `name`, `created_at` - Core columns
- ✅ `created_by`, `status`, `join_code` - Added by migration
- ✅ `week_start`, `week_end` - Optional columns (already exist or added separately)

---

## Summary

✅ **SQL Migration**: Fixes RLS policies for INSERT, SELECT, UPDATE, DELETE  
✅ **createSession Function**: Gets user from auth, ensures `created_by = auth.uid()`  
✅ **Session Interface**: Updated to match schema  
✅ **Screen Updates**: Function calls updated to new signature  
✅ **Error Handling**: Specific handling for RLS errors (42501)  

**The error should disappear once you run the SQL migration!**

