-- Award Mission Points RPC Function
-- This function atomically increments points in session_members when a mission is completed
-- Used by the side missions system to award +50 points per completed mission

-- NOTE: Leaderboard points are stored in `session_members.points`
-- This column is used by SessionLeaderboardScreen to display rankings

CREATE OR REPLACE FUNCTION public.award_mission_points(
  _user_id uuid,
  _session_id uuid,
  _points int
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Atomically increment points for the user in the specified session
  -- Uses COALESCE to handle NULL values (treats NULL as 0)
  UPDATE public.session_members
  SET points = COALESCE(points, 0) + _points
  WHERE user_id = _user_id
    AND session_id = _session_id;
  
  -- If no row exists, this function does nothing (caller should ensure session_members row exists)
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.award_mission_points(uuid, uuid, int) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION public.award_mission_points IS 
  'Atomically awards mission completion points to a user in a specific session. Used by the side missions system.';

