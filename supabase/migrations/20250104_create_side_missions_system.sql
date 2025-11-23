-- ============================================================================
-- Side Missions System - SQL Schema + RLS
-- ============================================================================
-- This migration creates the complete Side Missions system with 4 tables:
-- 1. mission_templates - System-level blueprint for missions
-- 2. mission_instances - Instantiated missions (global/session/user-specific)
-- 3. mission_participation - Tracks users who join/complete missions
-- 4. mission_submissions - Proof objects (photo/video/location)
--
-- All tables include proper RLS policies, foreign keys, and indexes.
-- ============================================================================

-- ============================================================================
-- 1. CREATE TABLE: mission_templates
-- ============================================================================
-- System-level blueprint for missions that can be instantiated.
-- Templates define the structure and requirements of missions.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.mission_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT, -- e.g., 'sustainability', 'exploration', etc.
  difficulty TEXT,
  points_reward INTEGER DEFAULT 0,
  requires_proof_photo BOOLEAN DEFAULT false,
  requires_proof_location BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on mission_templates
ALTER TABLE public.mission_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policy: SELECT - Allow all authenticated users to read active templates
CREATE POLICY "Users can view active mission templates"
  ON public.mission_templates
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- RLS Policy: INSERT - Only allow users to create templates where created_by = auth.uid()
CREATE POLICY "Users can create mission templates"
  ON public.mission_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- RLS Policy: UPDATE - Only allow users to update templates they created
CREATE POLICY "Users can update own mission templates"
  ON public.mission_templates
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- RLS Policy: DELETE - Only allow users to delete templates they created
CREATE POLICY "Users can delete own mission templates"
  ON public.mission_templates
  FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- ============================================================================
-- 2. CREATE TABLE: mission_instances
-- ============================================================================
-- Represents an instantiated mission for:
-- - global: Available to all users
-- - session: Available to members of a specific session
-- - user: Available to a specific user
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.mission_instances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mission_template_id UUID NOT NULL REFERENCES public.mission_templates(id) ON DELETE CASCADE,
  scope TEXT NOT NULL CHECK (scope IN ('global', 'session', 'user')),
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE,
  owner_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  start_at TIMESTAMP WITH TIME ZONE,
  end_at TIMESTAMP WITH TIME ZONE,
  max_completions_per_user INTEGER DEFAULT 1,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  -- Ensure scope-specific fields are set correctly
  CONSTRAINT mission_instance_scope_check CHECK (
    (scope = 'global' AND session_id IS NULL AND owner_user_id IS NULL) OR
    (scope = 'session' AND session_id IS NOT NULL AND owner_user_id IS NULL) OR
    (scope = 'user' AND session_id IS NULL AND owner_user_id IS NOT NULL)
  )
);

-- Enable RLS on mission_instances
ALTER TABLE public.mission_instances ENABLE ROW LEVEL SECURITY;

-- RLS Policy: SELECT - Allow users to see missions based on scope
CREATE POLICY "Users can view mission instances"
  ON public.mission_instances
  FOR SELECT
  TO authenticated
  USING (
    -- Global missions are visible to all authenticated users
    scope = 'global' OR
    -- Session missions are visible to session members
    (scope = 'session' AND EXISTS (
      SELECT 1 FROM public.session_members
      WHERE session_members.session_id = mission_instances.session_id
        AND session_members.user_id = auth.uid()
    )) OR
    -- User-specific missions are visible to the owner
    (scope = 'user' AND owner_user_id = auth.uid())
  );

-- RLS Policy: INSERT - Only allow users to create instances where created_by = auth.uid()
CREATE POLICY "Users can create mission instances"
  ON public.mission_instances
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- RLS Policy: UPDATE - Only allow users to update instances they created
CREATE POLICY "Users can update own mission instances"
  ON public.mission_instances
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- RLS Policy: DELETE - Disabled (missions should not be deleted, only deactivated)
-- No DELETE policy = no one can delete mission instances

-- ============================================================================
-- 3. CREATE TABLE: mission_participation
-- ============================================================================
-- Tracks users who join or complete a mission instance.
-- Status can be: 'joined', 'completed', 'failed', 'expired'
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.mission_participation (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mission_instance_id UUID NOT NULL REFERENCES public.mission_instances(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'joined' CHECK (status IN ('joined', 'completed', 'failed', 'expired')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  -- Ensure one participation record per user per mission instance
  UNIQUE(mission_instance_id, user_id)
);

-- Enable RLS on mission_participation
ALTER TABLE public.mission_participation ENABLE ROW LEVEL SECURITY;

-- RLS Policy: SELECT - Users can see their own participation and participation in their sessions
CREATE POLICY "Users can view mission participation"
  ON public.mission_participation
  FOR SELECT
  TO authenticated
  USING (
    -- Users can see their own participation
    user_id = auth.uid() OR
    -- Users can see participation for missions in sessions they belong to (for leaderboards)
    EXISTS (
      SELECT 1 FROM public.mission_instances
      JOIN public.session_members ON session_members.session_id = mission_instances.session_id
      WHERE mission_instances.id = mission_participation.mission_instance_id
        AND mission_instances.scope = 'session'
        AND session_members.user_id = auth.uid()
    )
  );

-- RLS Policy: INSERT - Users can only insert participation for themselves
CREATE POLICY "Users can join missions"
  ON public.mission_participation
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- RLS Policy: UPDATE - Users can only update their own participation
CREATE POLICY "Users can update own mission participation"
  ON public.mission_participation
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policy: DELETE - Disabled (participation records should not be deleted)
-- No DELETE policy = no one can delete participation records

-- ============================================================================
-- 4. CREATE TABLE: mission_submissions
-- ============================================================================
-- Proof objects (photo/video/location) submitted by users for mission completion.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.mission_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mission_instance_id UUID NOT NULL REFERENCES public.mission_instances(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  media_url TEXT,
  location JSONB, -- Stores location data as JSON: {latitude: number, longitude: number}
  notes TEXT,
  is_approved BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on mission_submissions
ALTER TABLE public.mission_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: SELECT - Users can see their own submissions and submissions in their sessions
CREATE POLICY "Users can view mission submissions"
  ON public.mission_submissions
  FOR SELECT
  TO authenticated
  USING (
    -- Users can see their own submissions
    user_id = auth.uid() OR
    -- Session members can see submissions for missions in their session (for feed/leaderboard)
    EXISTS (
      SELECT 1 FROM public.mission_instances
      JOIN public.session_members ON session_members.session_id = mission_instances.session_id
      WHERE mission_instances.id = mission_submissions.mission_instance_id
        AND mission_instances.scope = 'session'
        AND session_members.user_id = auth.uid()
    )
  );

-- RLS Policy: INSERT - Users can only insert submissions for themselves
CREATE POLICY "Users can submit mission proof"
  ON public.mission_submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- RLS Policy: UPDATE - Users can only update their own submissions
CREATE POLICY "Users can update own mission submissions"
  ON public.mission_submissions
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policy: DELETE - Disabled (submissions should not be deleted)
-- No DELETE policy = no one can delete submissions

-- ============================================================================
-- 5. CREATE INDEXES
-- ============================================================================
-- Add indexes for common query patterns to improve performance.
-- ============================================================================

-- Indexes for mission_instances
CREATE INDEX IF NOT EXISTS idx_mission_instances_scope ON public.mission_instances(scope);
CREATE INDEX IF NOT EXISTS idx_mission_instances_session_id ON public.mission_instances(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mission_instances_owner_user_id ON public.mission_instances(owner_user_id) WHERE owner_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mission_instances_template_id ON public.mission_instances(mission_template_id);
CREATE INDEX IF NOT EXISTS idx_mission_instances_created_by ON public.mission_instances(created_by);

-- Indexes for mission_participation
CREATE INDEX IF NOT EXISTS idx_mission_participation_instance_id ON public.mission_participation(mission_instance_id);
CREATE INDEX IF NOT EXISTS idx_mission_participation_user_id ON public.mission_participation(user_id);
CREATE INDEX IF NOT EXISTS idx_mission_participation_status ON public.mission_participation(status);
CREATE INDEX IF NOT EXISTS idx_mission_participation_user_status ON public.mission_participation(user_id, status);

-- Indexes for mission_submissions
CREATE INDEX IF NOT EXISTS idx_mission_submissions_instance_id ON public.mission_submissions(mission_instance_id);
CREATE INDEX IF NOT EXISTS idx_mission_submissions_user_id ON public.mission_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_mission_submissions_created_at ON public.mission_submissions(created_at DESC);

-- Indexes for mission_templates
CREATE INDEX IF NOT EXISTS idx_mission_templates_is_active ON public.mission_templates(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_mission_templates_category ON public.mission_templates(category) WHERE category IS NOT NULL;

-- ============================================================================
-- 6. COMMENTS
-- ============================================================================
-- Add helpful comments to document the schema.
-- ============================================================================

COMMENT ON TABLE public.mission_templates IS 'System-level blueprint for missions that can be instantiated';
COMMENT ON TABLE public.mission_instances IS 'Instantiated missions for global, session, or user-specific scope';
COMMENT ON TABLE public.mission_participation IS 'Tracks users who join or complete mission instances';
COMMENT ON TABLE public.mission_submissions IS 'Proof objects (photo/video/location) submitted by users for mission completion';

COMMENT ON COLUMN public.mission_instances.scope IS 'Scope of the mission: global (all users), session (session members), or user (specific user)';
COMMENT ON COLUMN public.mission_instances.max_completions_per_user IS 'Maximum number of times a user can complete this mission instance';
COMMENT ON COLUMN public.mission_participation.status IS 'Status: joined, completed, failed, or expired';
COMMENT ON COLUMN public.mission_submissions.location IS 'Location data stored as JSONB: {latitude: number, longitude: number}';

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- All tables, RLS policies, foreign keys, and indexes have been created.
-- The Side Missions system is now ready for use.
-- ============================================================================

