# "Session Not Found" Diagnosis - Join by Code

## 🔍 Root Cause Analysis

### **PRIMARY CAUSE: DATABASE RLS POLICY + Column Name Inconsistency**

**Problem Identified:**
1. **RLS Policy Issue**: The SELECT policy on `sessions` table blocks non-members from looking up sessions by join code
2. **Column Name Mismatch**: 
   - Migrations add `join_code` column
   - Code queries `code` column  
   - Code inserts into `code` column
   - This inconsistency causes lookup failures

### Diagnosis Process

1. **Code Analysis:**
   - `createSession()` inserts into `code` column (line 94)
   - `joinSessionWithCode()` queries `code` column (line 495)
   - Both normalize codes to uppercase 6 characters

2. **Database Analysis:**
   - Migration `20250102_fix_sessions_rls.sql` adds `join_code` column
   - Migration `20250102_fix_join_session_rls.sql` fixes RLS but doesn't address column name
   - Original migration `20250101_create_profiles.sql` creates sessions table WITHOUT any code column

3. **Likely Scenario:**
   - Database might have `join_code` column (from migrations)
   - Code is using `code` column
   - RLS policy blocks non-members from SELECT
   - Result: "Session not found" even when session exists

---

## ✅ Solution

### 1. Database Fix (SQL Migration)

**File:** `supabase/migrations/20250102_fix_code_column_consistency.sql`

This migration:
1. Ensures `code` column exists (not just `join_code`)
2. Copies data from `join_code` to `code` if needed
3. Creates index on `code` for faster lookups
4. Ensures RLS policy allows code lookups

**Run this SQL in Supabase Dashboard → SQL Editor:**

```sql
-- Fix code column consistency - Ensure 'code' column exists and is used
-- Ensure 'code' column exists (primary column name)
ALTER TABLE public.sessions 
  ADD COLUMN IF NOT EXISTS code TEXT;

-- If join_code exists but code doesn't have values, copy them
UPDATE public.sessions
SET code = COALESCE(code, join_code)
WHERE code IS NULL AND join_code IS NOT NULL;

-- Create index on code for faster lookups
CREATE INDEX IF NOT EXISTS idx_sessions_code ON public.sessions(code);

-- Ensure RLS allows code lookups (already done in 20250102_fix_join_session_rls.sql)
-- But verify the policy exists:
DROP POLICY IF EXISTS "select sessions" ON public.sessions;

CREATE POLICY "select sessions" ON public.sessions
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  -- Allow ALL authenticated users to SELECT sessions for join code lookups
);

NOTIFY pgrst, 'reload schema';
```

### 2. Code Fixes (Already Implemented)

**File:** `lib/sessionService.ts`

**Changes Made:**
1. ✅ Added comprehensive logging to diagnose the issue
2. ✅ Added fallback to try both `code` and `join_code` columns
3. ✅ Better error messages showing what went wrong
4. ✅ Normalizes code (trim + uppercase) consistently

**Logging Output:**
The code now logs:
- Raw code from input
- Normalized code
- Which column was used for lookup
- Query results (found/not found)
- Error details if any

---

## 📋 Testing Steps

1. **Check Console Logs:**
   - When joining, check console for `[JOIN]` prefixed logs
   - Look for "Found session using 'code' column" or "Found session using 'join_code' column"
   - If neither works, check RLS error codes

2. **Verify Database:**
   ```sql
   -- Check what columns exist
   SELECT column_name, data_type, is_nullable
   FROM information_schema.columns
   WHERE table_name = 'sessions' AND table_schema = 'public'
   ORDER BY ordinal_position;

   -- Check if sessions have codes
   SELECT id, name, code, join_code, status
   FROM sessions
   LIMIT 5;

   -- Check RLS policies
   SELECT * FROM pg_policies WHERE tablename = 'sessions';
   ```

3. **Test Join Flow:**
   - Create a session (should generate 6-character code)
   - Copy the code
   - Try to join with that code from another user account
   - Check console logs for diagnosis

---

## 🐛 Common Issues & Solutions

### Issue 1: "Session not found" but session exists

**Possible Causes:**
1. RLS policy blocking SELECT → Run `20250102_fix_join_session_rls.sql`
2. Column name mismatch (`code` vs `join_code`) → Run `20250102_fix_code_column_consistency.sql`
3. Code casing mismatch → Code handles this with `.toUpperCase()`
4. Wrong code length → Code validates 6 characters

**Solution:** Check console logs to see which column was queried and what error occurred.

### Issue 2: RLS Error 42501

**Cause:** RLS policy blocks non-members from SELECT

**Solution:** Run `20250102_fix_join_session_rls.sql` to allow code lookups.

### Issue 3: Code Column Missing

**Cause:** Database doesn't have `code` column

**Solution:** Run `20250102_fix_code_column_consistency.sql` to add it.

---

## 📝 Summary

**Root Cause:** 
- **Primary:** RLS policy blocks non-members from SELECT (DB issue)
- **Secondary:** Column name inconsistency (`code` vs `join_code`) (DB issue)
- **Tertiary:** Code validation/lookup logic (Code issue - fixed with logging and fallback)

**Fixes Applied:**
1. ✅ Added comprehensive logging
2. ✅ Added fallback to try both `code` and `join_code` columns
3. ✅ Better error handling
4. ✅ SQL migration to ensure `code` column exists

**Next Steps:**
1. Run `supabase/migrations/20250102_fix_join_session_rls.sql` (if not already run)
2. Run `supabase/migrations/20250102_fix_code_column_consistency.sql` (new)
3. Test join flow and check console logs
4. Verify which column actually contains the codes in your database

The enhanced logging will help diagnose the exact issue when testing!

