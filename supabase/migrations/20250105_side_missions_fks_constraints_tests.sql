-- ============================================================================
-- Side Missions System - Step 1.2: Foreign Keys + Constraints + RLS Tests
-- ============================================================================
-- This migration ensures:
-- 1. All foreign keys are properly defined
-- 2. All required indexes exist
-- 3. Check constraints are in place
-- 4. RLS policies are correctly enforced
-- 5. Test queries for validation
--
-- This builds on Step 1.1 (20250104_create_side_missions_system.sql)
-- ============================================================================

-- ============================================================================
-- 1. VERIFY AND ADD FOREIGN KEYS
-- ============================================================================
-- Ensure all foreign key relationships are properly defined.
-- Note: Most FKs were created in Step 1.1, but we verify/add any missing ones.
-- ============================================================================

-- mission_instances foreign keys (verify they exist)
DO $$
BEGIN
  -- mission_template_id → mission_templates(id)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'mission_instances_mission_template_id_fkey'
  ) THEN
    ALTER TABLE public.mission_instances
      ADD CONSTRAINT mission_instances_mission_template_id_fkey
      FOREIGN KEY (mission_template_id) 
      REFERENCES public.mission_templates(id) 
      ON DELETE CASCADE;
  END IF;

  -- session_id → sessions(id), NULL allowed
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'mission_instances_session_id_fkey'
  ) THEN
    ALTER TABLE public.mission_instances
      ADD CONSTRAINT mission_instances_session_id_fkey
      FOREIGN KEY (session_id) 
      REFERENCES public.sessions(id) 
      ON DELETE CASCADE;
  END IF;

  -- owner_user_id → profiles(id), NULL allowed
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'mission_instances_owner_user_id_fkey'
  ) THEN
    ALTER TABLE public.mission_instances
      ADD CONSTRAINT mission_instances_owner_user_id_fkey
      FOREIGN KEY (owner_user_id) 
      REFERENCES public.profiles(id) 
      ON DELETE CASCADE;
  END IF;

  -- created_by → profiles(id)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'mission_instances_created_by_fkey'
  ) THEN
    ALTER TABLE public.mission_instances
      ADD CONSTRAINT mission_instances_created_by_fkey
      FOREIGN KEY (created_by) 
      REFERENCES public.profiles(id) 
      ON DELETE CASCADE;
  END IF;
END $$;

-- mission_participation foreign keys (verify they exist)
DO $$
BEGIN
  -- mission_instance_id → mission_instances(id)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'mission_participation_mission_instance_id_fkey'
  ) THEN
    ALTER TABLE public.mission_participation
      ADD CONSTRAINT mission_participation_mission_instance_id_fkey
      FOREIGN KEY (mission_instance_id) 
      REFERENCES public.mission_instances(id) 
      ON DELETE CASCADE;
  END IF;

  -- user_id → profiles(id)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'mission_participation_user_id_fkey'
  ) THEN
    ALTER TABLE public.mission_participation
      ADD CONSTRAINT mission_participation_user_id_fkey
      FOREIGN KEY (user_id) 
      REFERENCES public.profiles(id) 
      ON DELETE CASCADE;
  END IF;
END $$;

-- mission_submissions foreign keys (verify they exist)
DO $$
BEGIN
  -- mission_instance_id → mission_instances(id)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'mission_submissions_mission_instance_id_fkey'
  ) THEN
    ALTER TABLE public.mission_submissions
      ADD CONSTRAINT mission_submissions_mission_instance_id_fkey
      FOREIGN KEY (mission_instance_id) 
      REFERENCES public.mission_instances(id) 
      ON DELETE CASCADE;
  END IF;

  -- user_id → profiles(id)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'mission_submissions_user_id_fkey'
  ) THEN
    ALTER TABLE public.mission_submissions
      ADD CONSTRAINT mission_submissions_user_id_fkey
      FOREIGN KEY (user_id) 
      REFERENCES public.profiles(id) 
      ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================================
-- 2. ADD MISSING INDEXES
-- ============================================================================
-- Ensure all performance-critical indexes exist.
-- Note: Some indexes were created in Step 1.1, but we verify completeness.
-- ============================================================================

-- mission_instances indexes
CREATE INDEX IF NOT EXISTS idx_mission_instances_scope ON public.mission_instances(scope);
CREATE INDEX IF NOT EXISTS idx_mission_instances_session_id ON public.mission_instances(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mission_instances_owner_user_id ON public.mission_instances(owner_user_id) WHERE owner_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mission_instances_template_id ON public.mission_instances(mission_template_id);
CREATE INDEX IF NOT EXISTS idx_mission_instances_created_by ON public.mission_instances(created_by);

-- mission_participation indexes
CREATE INDEX IF NOT EXISTS idx_mission_participation_instance_id ON public.mission_participation(mission_instance_id);
CREATE INDEX IF NOT EXISTS idx_mission_participation_user_id ON public.mission_participation(user_id);
CREATE INDEX IF NOT EXISTS idx_mission_participation_status ON public.mission_participation(status);
CREATE INDEX IF NOT EXISTS idx_mission_participation_user_status ON public.mission_participation(user_id, status);

-- mission_submissions indexes
CREATE INDEX IF NOT EXISTS idx_mission_submissions_instance_id ON public.mission_submissions(mission_instance_id);
CREATE INDEX IF NOT EXISTS idx_mission_submissions_user_id ON public.mission_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_mission_submissions_created_at ON public.mission_submissions(created_at DESC);

-- mission_templates indexes
CREATE INDEX IF NOT EXISTS idx_mission_templates_is_active ON public.mission_templates(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_mission_templates_category ON public.mission_templates(category) WHERE category IS NOT NULL;

-- ============================================================================
-- 3. ADD CHECK CONSTRAINTS
-- ============================================================================
-- Add defensive constraints to ensure data integrity.
-- ============================================================================

-- mission_instances: scope must be one of the allowed values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'mission_instances_scope_check'
  ) THEN
    ALTER TABLE public.mission_instances
      ADD CONSTRAINT mission_instances_scope_check
      CHECK (scope IN ('global', 'session', 'user'));
  END IF;
END $$;

-- mission_instances: max_completions_per_user must be positive
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'mission_instances_max_completions_check'
  ) THEN
    ALTER TABLE public.mission_instances
      ADD CONSTRAINT mission_instances_max_completions_check
      CHECK (max_completions_per_user > 0);
  END IF;
END $$;

-- mission_participation: status must be one of the allowed values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'mission_participation_status_check'
  ) THEN
    ALTER TABLE public.mission_participation
      ADD CONSTRAINT mission_participation_status_check
      CHECK (status IN ('joined', 'completed', 'failed', 'expired'));
  END IF;
END $$;

-- ============================================================================
-- 4. VERIFY RLS POLICIES
-- ============================================================================
-- Ensure RLS is enabled and policies are correctly set up.
-- Note: Policies were created in Step 1.1, but we verify they exist.
-- ============================================================================

-- Ensure RLS is enabled on all mission tables
ALTER TABLE public.mission_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mission_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mission_participation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mission_submissions ENABLE ROW LEVEL SECURITY;

-- Verify mission_templates policies exist (recreate if missing)
DO $$
BEGIN
  -- SELECT policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'mission_templates'
      AND policyname = 'Users can view active mission templates'
  ) THEN
    CREATE POLICY "Users can view active mission templates"
      ON public.mission_templates
      FOR SELECT
      TO authenticated
      USING (is_active = true);
  END IF;

  -- INSERT policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'mission_templates'
      AND policyname = 'Users can create mission templates'
  ) THEN
    CREATE POLICY "Users can create mission templates"
      ON public.mission_templates
      FOR INSERT
      TO authenticated
      WITH CHECK (created_by = auth.uid());
  END IF;

  -- UPDATE policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'mission_templates'
      AND policyname = 'Users can update own mission templates'
  ) THEN
    CREATE POLICY "Users can update own mission templates"
      ON public.mission_templates
      FOR UPDATE
      TO authenticated
      USING (created_by = auth.uid())
      WITH CHECK (created_by = auth.uid());
  END IF;

  -- DELETE policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'mission_templates'
      AND policyname = 'Users can delete own mission templates'
  ) THEN
    CREATE POLICY "Users can delete own mission templates"
      ON public.mission_templates
      FOR DELETE
      TO authenticated
      USING (created_by = auth.uid());
  END IF;
END $$;

-- Verify mission_instances policies exist (recreate if missing)
DO $$
BEGIN
  -- SELECT policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'mission_instances'
      AND policyname = 'Users can view mission instances'
  ) THEN
    CREATE POLICY "Users can view mission instances"
      ON public.mission_instances
      FOR SELECT
      TO authenticated
      USING (
        scope = 'global' OR
        (scope = 'session' AND EXISTS (
          SELECT 1 FROM public.session_members
          WHERE session_members.session_id = mission_instances.session_id
            AND session_members.user_id = auth.uid()
        )) OR
        (scope = 'user' AND owner_user_id = auth.uid())
      );
  END IF;

  -- INSERT policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'mission_instances'
      AND policyname = 'Users can create mission instances'
  ) THEN
    CREATE POLICY "Users can create mission instances"
      ON public.mission_instances
      FOR INSERT
      TO authenticated
      WITH CHECK (created_by = auth.uid());
  END IF;

  -- UPDATE policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'mission_instances'
      AND policyname = 'Users can update own mission instances'
  ) THEN
    CREATE POLICY "Users can update own mission instances"
      ON public.mission_instances
      FOR UPDATE
      TO authenticated
      USING (created_by = auth.uid())
      WITH CHECK (created_by = auth.uid());
  END IF;
END $$;

-- Verify mission_participation policies exist (recreate if missing)
DO $$
BEGIN
  -- SELECT policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'mission_participation'
      AND policyname = 'Users can view mission participation'
  ) THEN
    CREATE POLICY "Users can view mission participation"
      ON public.mission_participation
      FOR SELECT
      TO authenticated
      USING (
        user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.mission_instances
          JOIN public.session_members ON session_members.session_id = mission_instances.session_id
          WHERE mission_instances.id = mission_participation.mission_instance_id
            AND mission_instances.scope = 'session'
            AND session_members.user_id = auth.uid()
        )
      );
  END IF;

  -- INSERT policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'mission_participation'
      AND policyname = 'Users can join missions'
  ) THEN
    CREATE POLICY "Users can join missions"
      ON public.mission_participation
      FOR INSERT
      TO authenticated
      WITH CHECK (user_id = auth.uid());
  END IF;

  -- UPDATE policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'mission_participation'
      AND policyname = 'Users can update own mission participation'
  ) THEN
    CREATE POLICY "Users can update own mission participation"
      ON public.mission_participation
      FOR UPDATE
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- Verify mission_submissions policies exist (recreate if missing)
DO $$
BEGIN
  -- SELECT policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'mission_submissions'
      AND policyname = 'Users can view mission submissions'
  ) THEN
    CREATE POLICY "Users can view mission submissions"
      ON public.mission_submissions
      FOR SELECT
      TO authenticated
      USING (
        user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.mission_instances
          JOIN public.session_members ON session_members.session_id = mission_instances.session_id
          WHERE mission_instances.id = mission_submissions.mission_instance_id
            AND mission_instances.scope = 'session'
            AND session_members.user_id = auth.uid()
        )
      );
  END IF;

  -- INSERT policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'mission_submissions'
      AND policyname = 'Users can submit mission proof'
  ) THEN
    CREATE POLICY "Users can submit mission proof"
      ON public.mission_submissions
      FOR INSERT
      TO authenticated
      WITH CHECK (user_id = auth.uid());
  END IF;

  -- UPDATE policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'mission_submissions'
      AND policyname = 'Users can update own mission submissions'
  ) THEN
    CREATE POLICY "Users can update own mission submissions"
      ON public.mission_submissions
      FOR UPDATE
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- ============================================================================
-- 5. RLS TEST QUERIES
-- ============================================================================
-- These test queries should be run manually in Supabase SQL Editor
-- to validate that RLS policies are working correctly.
-- 
-- IMPORTANT: Run these queries as different authenticated users to test
-- access control. You should see different results based on:
-- - User's session membership
-- - User's ownership of missions
-- - Mission scope (global/session/user)
-- ============================================================================

-- ============================================================================
-- TEST 1: mission_templates visibility
-- ============================================================================
-- Expected: User should only see rows where is_active = true
-- ============================================================================
/*
-- Run this as an authenticated user
SELECT 
  id,
  title,
  description,
  category,
  is_active,
  created_by
FROM public.mission_templates
ORDER BY created_at DESC;
*/

-- ============================================================================
-- TEST 2: mission_instances visibility by scope
-- ============================================================================
-- Expected behavior:
-- - Global scope: All authenticated users can see
-- - Session scope: Only session members can see
-- - User scope: Only the owner can see
-- ============================================================================
/*
-- Run this as an authenticated user
SELECT 
  mi.id,
  mi.scope,
  mi.session_id,
  mi.owner_user_id,
  mt.title as mission_title,
  mi.created_by,
  mi.is_public
FROM public.mission_instances mi
JOIN public.mission_templates mt ON mt.id = mi.mission_template_id
ORDER BY mi.created_at DESC;
*/

-- ============================================================================
-- TEST 3: mission_participation access
-- ============================================================================
-- Expected behavior:
-- - User can see their own participation
-- - User can see participation for missions in sessions they belong to
-- ============================================================================
/*
-- Run this as an authenticated user
SELECT 
  mp.id,
  mp.mission_instance_id,
  mp.user_id,
  mp.status,
  mp.joined_at,
  mp.completed_at,
  mi.scope,
  mi.session_id,
  mt.title as mission_title
FROM public.mission_participation mp
JOIN public.mission_instances mi ON mi.id = mp.mission_instance_id
JOIN public.mission_templates mt ON mt.id = mi.mission_template_id
ORDER BY mp.joined_at DESC;
*/

-- ============================================================================
-- TEST 4: mission_submissions visibility
-- ============================================================================
-- Expected behavior:
-- - User can see their own submissions
-- - User can see submissions for missions in sessions they belong to
-- ============================================================================
/*
-- Run this as an authenticated user
SELECT 
  ms.id,
  ms.mission_instance_id,
  ms.user_id,
  ms.media_url,
  ms.location,
  ms.notes,
  ms.is_approved,
  ms.created_at,
  mi.scope,
  mi.session_id,
  mt.title as mission_title
FROM public.mission_submissions ms
JOIN public.mission_instances mi ON mi.id = ms.mission_instance_id
JOIN public.mission_templates mt ON mt.id = mi.mission_template_id
ORDER BY ms.created_at DESC;
*/

-- ============================================================================
-- TEST 5: Foreign key relationships
-- ============================================================================
-- Expected: All joins should work correctly, showing proper relationships
-- ============================================================================
/*
-- Test mission_instances → mission_templates relationship
SELECT 
  mi.id as instance_id,
  mi.scope,
  mt.id as template_id,
  mt.title as template_title,
  mt.category,
  mt.points_reward
FROM public.mission_instances mi
JOIN public.mission_templates mt ON mt.id = mi.mission_template_id
ORDER BY mi.created_at DESC
LIMIT 10;
*/

/*
-- Test mission_participation → mission_instances → mission_templates
SELECT 
  mp.id as participation_id,
  mp.user_id,
  mp.status,
  mi.id as instance_id,
  mi.scope,
  mt.title as mission_title
FROM public.mission_participation mp
JOIN public.mission_instances mi ON mi.id = mp.mission_instance_id
JOIN public.mission_templates mt ON mt.id = mi.mission_template_id
ORDER BY mp.joined_at DESC
LIMIT 10;
*/

/*
-- Test mission_submissions → mission_instances → mission_templates
SELECT 
  ms.id as submission_id,
  ms.user_id,
  ms.media_url,
  ms.is_approved,
  mi.id as instance_id,
  mi.scope,
  mt.title as mission_title
FROM public.mission_submissions ms
JOIN public.mission_instances mi ON mi.id = ms.mission_instance_id
JOIN public.mission_templates mt ON mt.id = mi.mission_template_id
ORDER BY ms.created_at DESC
LIMIT 10;
*/

-- ============================================================================
-- TEST 6: RLS enforcement - attempt unauthorized access
-- ============================================================================
-- These queries should FAIL or return empty results if RLS is working:
-- ============================================================================

/*
-- Try to INSERT a mission_template with created_by != auth.uid()
-- This should FAIL due to RLS policy
INSERT INTO public.mission_templates (
  title,
  description,
  category,
  created_by
) VALUES (
  'Unauthorized Template',
  'This should fail',
  'test',
  '00000000-0000-0000-0000-000000000000'::uuid  -- Different user ID
);
*/

/*
-- Try to UPDATE someone else's mission_template
-- This should FAIL or affect 0 rows
UPDATE public.mission_templates
SET title = 'Hacked Title'
WHERE created_by != auth.uid();
*/

/*
-- Try to INSERT participation for another user
-- This should FAIL due to RLS policy
INSERT INTO public.mission_participation (
  mission_instance_id,
  user_id
) VALUES (
  '00000000-0000-0000-0000-000000000000'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid  -- Different user ID
);
*/

-- ============================================================================
-- TEST 7: Check constraint validation
-- ============================================================================
-- These should FAIL due to check constraints:
-- ============================================================================

/*
-- Try to insert mission_instance with invalid scope
-- This should FAIL
INSERT INTO public.mission_instances (
  mission_template_id,
  scope,
  created_by
) VALUES (
  '00000000-0000-0000-0000-000000000000'::uuid,
  'invalid_scope',  -- Invalid value
  auth.uid()
);
*/

/*
-- Try to insert mission_instance with max_completions_per_user = 0
-- This should FAIL
INSERT INTO public.mission_instances (
  mission_template_id,
  scope,
  max_completions_per_user,
  created_by
) VALUES (
  '00000000-0000-0000-0000-000000000000'::uuid,
  'global',
  0,  -- Invalid: must be > 0
  auth.uid()
);
*/

/*
-- Try to insert participation with invalid status
-- This should FAIL
INSERT INTO public.mission_participation (
  mission_instance_id,
  user_id,
  status
) VALUES (
  '00000000-0000-0000-0000-000000000000'::uuid,
  auth.uid(),
  'invalid_status'  -- Invalid value
);
*/

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- All foreign keys, indexes, constraints, and RLS policies have been verified.
-- Test queries are provided above (commented out) for manual validation.
-- ============================================================================

-- Refresh PostgREST schema cache (important after schema changes)
NOTIFY pgrst, 'reload schema';

