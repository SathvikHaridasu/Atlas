import { supabase } from '../supabaseClient';
import type {
  MissionInstance,
  MissionTemplate,
  MissionWithTemplate,
  UserMissionStatus,
} from './types';

/**
 * Fetch all global missions (available to all authenticated users)
 * Returns mission instances where:
 * - scope = 'global'
 * - is_public = true
 * - mission_templates.is_active = true
 */
export async function fetchGlobalMissions(): Promise<MissionWithTemplate[]> {
  const { data, error } = await supabase
    .from('mission_instances')
    .select(`
      *,
      mission_template:mission_templates (*)
    `)
    .eq('scope', 'global')
    .eq('is_public', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Supabase error:', error);
    throw new Error('Failed to fetch global missions');
  }

  if (!data) {
    return [];
  }

  // Filter to only include missions with active templates
  // and map to proper types
  return data
    .filter((item) => item.mission_template && (item.mission_template as MissionTemplate).is_active)
    .map((item) => ({
      ...item,
      mission_template: item.mission_template as MissionTemplate,
    })) as MissionWithTemplate[];
}

/**
 * Fetch missions for a specific session
 * Returns mission instances where:
 * - scope = 'session'
 * - session_id = sessionId
 * Includes the mission template via join
 */
export async function fetchSessionMissions(sessionId: string): Promise<MissionWithTemplate[]> {
  const { data, error } = await supabase
    .from('mission_instances')
    .select(`
      *,
      mission_template:mission_templates (*)
    `)
    .eq('scope', 'session')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Supabase error:', error);
    throw new Error('Failed to fetch session missions');
  }

  if (!data) {
    return [];
  }

  return data.map((item) => ({
    ...item,
    mission_template: item.mission_template as MissionTemplate,
  })) as MissionWithTemplate[];
}

/**
 * Fetch user-specific missions
 * Returns mission instances where:
 * - scope = 'user'
 * - owner_user_id = userId
 */
export async function fetchUserMissions(userId: string): Promise<MissionWithTemplate[]> {
  const { data, error } = await supabase
    .from('mission_instances')
    .select(`
      *,
      mission_template:mission_templates (*)
    `)
    .eq('scope', 'user')
    .eq('owner_user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Supabase error:', error);
    throw new Error('Failed to fetch user missions');
  }

  if (!data) {
    return [];
  }

  return data.map((item) => ({
    ...item,
    mission_template: item.mission_template as MissionTemplate,
  })) as MissionWithTemplate[];
}

/**
 * Fetch all missions a user is allowed to see
 * Returns:
 * - Global missions (scope = 'global', is_public = true)
 * - Session missions (only for sessions the user belongs to)
 * - User-owned missions (scope = 'user', owner_user_id = userId)
 * 
 * Also includes the user's participation status for each mission
 */
export async function fetchMissionInstancesForUser(
  userId: string
): Promise<UserMissionStatus[]> {
  try {
    // 1. Get global missions
    const globalMissions = await fetchGlobalMissions();

    // 2. Get session IDs where user is a member
    const { data: memberData, error: memberError } = await supabase
      .from('session_members')
      .select('session_id')
      .eq('user_id', userId);

    if (memberError) {
      console.error('Supabase error:', memberError);
      throw new Error('Failed to fetch user session memberships');
    }

    const sessionIds = memberData?.map((m) => m.session_id) || [];

    // 3. Get session missions for user's sessions
    let sessionMissions: MissionWithTemplate[] = [];
    if (sessionIds.length > 0) {
      const { data: sessionData, error: sessionError } = await supabase
        .from('mission_instances')
        .select(`
          *,
          mission_template:mission_templates (*)
        `)
        .eq('scope', 'session')
        .in('session_id', sessionIds)
        .order('created_at', { ascending: false });

      if (sessionError) {
        console.error('Supabase error:', sessionError);
        throw new Error('Failed to fetch session missions');
      }

      sessionMissions = (sessionData || []).map((item) => ({
        ...item,
        mission_template: item.mission_template as MissionTemplate,
      })) as MissionWithTemplate[];
    }

    // 4. Get user-owned missions
    const userMissions = await fetchUserMissions(userId);

    // 5. Combine all missions
    const allMissions = [...globalMissions, ...sessionMissions, ...userMissions];

    // 6. Get participation status for each mission
    const missionInstanceIds = allMissions.map((m) => m.id);

    let participations: Array<{ mission_instance_id: string; participation: any }> = [];
    if (missionInstanceIds.length > 0) {
      const { data: participationData, error: participationError } = await supabase
        .from('mission_participation')
        .select('*')
        .eq('user_id', userId)
        .in('mission_instance_id', missionInstanceIds);

      if (participationError) {
        console.error('Supabase error:', participationError);
        // Don't throw - just continue without participation data
      } else {
        participations = (participationData || []).map((p) => ({
          mission_instance_id: p.mission_instance_id,
          participation: p,
        }));
      }
    }

    // 7. Combine missions with participation status
    const result: UserMissionStatus[] = allMissions.map((mission) => {
      const participation = participations.find(
        (p) => p.mission_instance_id === mission.id
      )?.participation || null;

      return {
        mission_instance: mission,
        participation,
      };
    });

    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    console.error('Unexpected error:', error);
    throw new Error('Failed to fetch missions for user');
  }
}

