import { supabase } from '../supabaseClient';
import { MISSION_REWARD_POINTS } from './constants';
import type { MissionParticipation, MissionSubmission } from './types';

export interface CompleteMissionParams {
  missionInstanceId: string;
  userId: string;
  mediaUrl?: string | null;
  location?: {
    latitude: number;
    longitude: number;
  } | null;
  notes?: string | null;
}

export interface CompleteMissionResult {
  submission: MissionSubmission;
  participation: MissionParticipation;
}

/**
 * Complete a mission by submitting proof and updating participation status
 * 
 * Steps:
 * 1. Insert into mission_submissions with proof data
 * 2. Update mission_participation: status = 'completed', completed_at = now()
 * 3. Return both the submission and updated participation records
 * 
 * @param params - Mission completion parameters
 * @returns The submission and updated participation records
 */
export async function completeMission(
  params: CompleteMissionParams
): Promise<CompleteMissionResult> {
  const { missionInstanceId, userId, mediaUrl, location, notes } = params;

  try {
    // 1. Insert mission submission
    const submissionData: {
      mission_instance_id: string;
      user_id: string;
      media_url?: string | null;
      location?: { latitude: number; longitude: number } | null;
      notes?: string | null;
      is_approved: boolean;
    } = {
      mission_instance_id: missionInstanceId,
      user_id: userId,
      is_approved: true,
    };

    if (mediaUrl !== undefined) {
      submissionData.media_url = mediaUrl;
    }

    if (location !== undefined) {
      submissionData.location = location;
    }

    if (notes !== undefined) {
      submissionData.notes = notes;
    }

    const { data: submission, error: submissionError } = await supabase
      .from('mission_submissions')
      .insert(submissionData)
      .select()
      .single();

    if (submissionError) {
      console.error('Supabase error:', submissionError);
      
      // Handle specific RLS errors
      if (submissionError.code === '42501') {
        throw new Error(
          'Unable to submit mission proof. Please ensure you are authenticated and have permission to submit for this mission.'
        );
      }

      throw new Error(`Failed to submit mission proof: ${submissionError.message}`);
    }

    if (!submission) {
      throw new Error('Failed to submit mission proof: No data returned');
    }

    // 2. Update mission participation status
    const { data: updatedParticipation, error: updateError } = await supabase
      .from('mission_participation')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('mission_instance_id', missionInstanceId)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Supabase error:', updateError);
      
      // Handle specific RLS errors
      if (updateError.code === '42501') {
        throw new Error(
          'Unable to update mission participation. Please ensure you are authenticated and have permission to update your participation.'
        );
      }

      // If participation doesn't exist, we should create it first
      if (updateError.code === 'PGRST116') {
        // Create participation record if it doesn't exist
        const { data: newParticipation, error: createError } = await supabase
          .from('mission_participation')
          .insert({
            mission_instance_id: missionInstanceId,
            user_id: userId,
            status: 'completed',
            completed_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (createError || !newParticipation) {
          throw new Error('Failed to update mission participation: Unable to create participation record');
        }

        return {
          submission: submission as MissionSubmission,
          participation: newParticipation as MissionParticipation,
        };
      }

      throw new Error(`Failed to update mission participation: ${updateError.message}`);
    }

    if (!updatedParticipation) {
      throw new Error('Failed to update mission participation: No data returned');
    }

    // 3. Award points to user's leaderboard score
    // NOTE: Leaderboard points are stored in `session_members.points`
    // This column is used by SessionLeaderboardScreen to display rankings
    // If the mission is session-scoped, add points to that session
    // If global/user-scoped, add points to all sessions the user is in
    try {
      // First, get the mission instance to check if it has a session_id
      const { data: missionInstance, error: missionError } = await supabase
        .from('mission_instances')
        .select('session_id')
        .eq('id', missionInstanceId)
        .single();

      if (!missionError && missionInstance) {
        if (missionInstance.session_id) {
          // Session-scoped mission: add points to that specific session using RPC
          const { error: pointsError } = await supabase.rpc('award_mission_points', {
            _user_id: userId,
            _session_id: missionInstance.session_id,
            _points: MISSION_REWARD_POINTS,
          });

          if (pointsError) {
            console.error('Failed to award mission points via RPC:', pointsError);
            // Do NOT throw here — mission completion should still succeed
          } else {
            console.log(
              '[Missions] Completed mission',
              missionInstanceId,
              'for user',
              userId,
              '— awarded',
              MISSION_REWARD_POINTS,
              'points to session',
              missionInstance.session_id
            );
          }
        } else {
          // Global or user-scoped mission: add points to all sessions the user is in
          const { data: userSessions, error: sessionsError } = await supabase
            .from('session_members')
            .select('session_id')
            .eq('user_id', userId);

          if (!sessionsError && userSessions && userSessions.length > 0) {
            // Award points to all sessions using RPC
            for (const session of userSessions) {
              const { error: pointsError } = await supabase.rpc('award_mission_points', {
                _user_id: userId,
                _session_id: session.session_id,
                _points: MISSION_REWARD_POINTS,
              });

              if (pointsError) {
                console.error(
                  `Failed to award mission points to session ${session.session_id}:`,
                  pointsError
                );
              }
            }

            console.log(
              '[Missions] Completed mission',
              missionInstanceId,
              'for user',
              userId,
              '— awarded',
              MISSION_REWARD_POINTS,
              'points to',
              userSessions.length,
              'session(s)'
            );
          }
        }
      }
    } catch (pointsError) {
      // Log error but don't fail mission completion
      console.error('Error awarding mission points:', pointsError);
      // Mission completion should still succeed even if points update fails
    }

    return {
      submission: submission as MissionSubmission,
      participation: updatedParticipation as MissionParticipation,
    };
  } catch (error) {
    // Re-throw if it's already an Error with a message
    if (error instanceof Error) {
      throw error;
    }
    // Otherwise wrap in Error
    console.error('Unexpected error:', error);
    throw new Error('Failed to complete mission');
  }
}

