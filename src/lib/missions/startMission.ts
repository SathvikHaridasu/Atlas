import { supabase } from '../supabaseClient';
import type { MissionParticipation } from './types';

/**
 * Start a mission by creating a participation record
 * 
 * Steps:
 * 1. Check if mission_participation row already exists for (missionInstanceId, userId)
 *    - If exists, return the existing row
 * 2. If not, insert a new participation record with status = 'joined'
 * 3. Return the participation row
 * 
 * @param missionInstanceId - The mission instance ID to start
 * @param userId - The authenticated user's ID
 * @returns The participation record (existing or newly created)
 */
export async function startMission(
  missionInstanceId: string,
  userId: string
): Promise<MissionParticipation> {
  try {
    // 1. Check if participation already exists
    const { data: existingParticipation, error: checkError } = await supabase
      .from('mission_participation')
      .select('*')
      .eq('mission_instance_id', missionInstanceId)
      .eq('user_id', userId)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 is "not found" which is fine, but other errors are not
      console.error('Supabase error:', checkError);
      throw new Error('Failed to check existing mission participation');
    }

    // If participation already exists, return it
    if (existingParticipation) {
      return existingParticipation as MissionParticipation;
    }

    // 2. Insert new participation record
    const { data: newParticipation, error: insertError } = await supabase
      .from('mission_participation')
      .insert({
        mission_instance_id: missionInstanceId,
        user_id: userId,
        status: 'joined',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Supabase error:', insertError);
      
      // Handle specific RLS errors
      if (insertError.code === '42501') {
        throw new Error(
          'Unable to start mission. Please ensure you are authenticated and have permission to join this mission.'
        );
      }

      // Handle duplicate key error (race condition)
      if (insertError.code === '23505' || insertError.message?.includes('duplicate')) {
        // Participation was created by another request, fetch it
        const { data: fetchedParticipation, error: fetchError } = await supabase
          .from('mission_participation')
          .select('*')
          .eq('mission_instance_id', missionInstanceId)
          .eq('user_id', userId)
          .single();

        if (fetchError || !fetchedParticipation) {
          throw new Error('Failed to start mission: Unable to retrieve participation record');
        }

        return fetchedParticipation as MissionParticipation;
      }

      throw new Error(`Failed to start mission: ${insertError.message}`);
    }

    if (!newParticipation) {
      throw new Error('Failed to start mission: No data returned');
    }

    return newParticipation as MissionParticipation;
  } catch (error) {
    // Re-throw if it's already an Error with a message
    if (error instanceof Error) {
      throw error;
    }
    // Otherwise wrap in Error
    console.error('Unexpected error:', error);
    throw new Error('Failed to start mission');
  }
}

