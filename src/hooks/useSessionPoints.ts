import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';

/**
 * Hook to fetch user's total points across all sessions
 * NOTE: Leaderboard points are stored in `session_members.points`
 * This hook sums points from all sessions the user is a member of
 */
export function useSessionPoints() {
  const { user } = useAuth();
  const [totalPoints, setTotalPoints] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setTotalPoints(0);
      setLoading(false);
      return;
    }

    async function fetchPoints() {
      try {
        setLoading(true);

        // Sum points from all sessions the user is in
        const { data, error } = await supabase
          .from('session_members')
          .select('points')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching session points:', error);
          setTotalPoints(0);
          return;
        }

        // Sum all points across sessions
        const total = (data || []).reduce((sum, member) => {
          return sum + (member.points || 0);
        }, 0);

        setTotalPoints(total);
      } catch (err) {
        console.error('Error in fetchPoints:', err);
        setTotalPoints(0);
      } finally {
        setLoading(false);
      }
    }

    fetchPoints();
  }, [user]);

  const refreshPoints = async () => {
    if (!user) {
      setTotalPoints(0);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('session_members')
        .select('points')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error refreshing session points:', error);
        return;
      }

      const total = (data || []).reduce((sum, member) => {
        return sum + (member.points || 0);
      }, 0);

      setTotalPoints(total);
    } catch (err) {
      console.error('Error refreshing points:', err);
    }
  };

  return { totalPoints, loading, refreshPoints };
}

