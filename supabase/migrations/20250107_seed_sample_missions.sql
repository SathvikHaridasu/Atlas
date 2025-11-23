-- Seed Sample Mission Templates & Instances
-- This migration creates sample missions for sustainability and exploration categories

-- 1) Create sample mission templates (sustainability + exploration)
INSERT INTO public.mission_templates (
  title,
  description,
  category,
  difficulty,
  points_reward,
  requires_proof_photo,
  requires_proof_location,
  is_active
) VALUES
  -- Sustainability missions
  ('Trash Dash', 'Pick up at least 5 pieces of trash on your run and snap a pic.', 'sustainability', 'easy', 50, true, false, true),
  ('Recycle Run', 'Run to a recycling bin or bottle depot and toss something in.', 'sustainability', 'medium', 50, true, true, true),
  ('Park Clean-Up', 'End your run at a park and clean up a small area (photo proof).', 'sustainability', 'hard', 50, true, true, true),

  -- Exploration missions
  ('New Route Explorer', 'Run in a part of your city you haven''t logged before.', 'exploration', 'easy', 50, false, true, true),
  ('Landmark Hunter', 'Reach a local landmark (bridge, statue, park sign) and record a quick clip.', 'exploration', 'medium', 50, true, true, true),
  ('Sunset Sprint', 'Run during golden hour and capture a photo or clip of the view.', 'exploration', 'easy', 50, true, true, true)
ON CONFLICT DO NOTHING;

-- 2) Create one global mission_instance per template
-- Only create instances for templates that don't already have instances
INSERT INTO public.mission_instances (
  mission_template_id,
  scope,
  session_id,
  owner_user_id,
  start_at,
  end_at,
  max_completions_per_user,
  is_public,
  created_by
)
SELECT
  mt.id as mission_template_id,
  'global'::text as scope,
  null::uuid as session_id,
  null::uuid as owner_user_id,
  now() as start_at,
  null::timestamptz as end_at,
  1 as max_completions_per_user,
  true as is_public,
  null::uuid as created_by
FROM public.mission_templates mt
WHERE mt.title IN (
  'Trash Dash',
  'Recycle Run',
  'Park Clean-Up',
  'New Route Explorer',
  'Landmark Hunter',
  'Sunset Sprint'
)
AND NOT EXISTS (
  SELECT 1
  FROM public.mission_instances mi
  WHERE mi.mission_template_id = mt.id
  AND mi.scope = 'global'
)
ON CONFLICT DO NOTHING;

