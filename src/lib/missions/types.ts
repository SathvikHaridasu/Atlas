/**
 * TypeScript types for the Side Missions system
 * These types match the database schema from Steps 1.1 and 1.2
 */

/**
 * Mission Template - System-level blueprint for missions
 */
export interface MissionTemplate {
  id: string;
  title: string;
  description: string | null;
  category: string | null; // e.g., 'sustainability', 'exploration', etc.
  difficulty: string | null;
  points_reward: number;
  requires_proof_photo: boolean;
  requires_proof_location: boolean;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
}

/**
 * Mission Instance - Instantiated mission for global/session/user scope
 */
export interface MissionInstance {
  id: string;
  mission_template_id: string;
  scope: 'global' | 'session' | 'user';
  session_id: string | null;
  owner_user_id: string | null;
  start_at: string | null;
  end_at: string | null;
  max_completions_per_user: number;
  is_public: boolean;
  created_at: string;
  created_by: string;
}

/**
 * Mission Participation - Tracks users who join/complete missions
 */
export interface MissionParticipation {
  id: string;
  mission_instance_id: string;
  user_id: string;
  status: 'joined' | 'completed' | 'failed' | 'expired';
  joined_at: string;
  completed_at: string | null;
}

/**
 * Mission Submission - Proof objects (photo/video/location) for mission completion
 */
export interface MissionSubmission {
  id: string;
  mission_instance_id: string;
  user_id: string;
  media_url: string | null;
  location: {
    latitude: number;
    longitude: number;
  } | null;
  notes: string | null;
  is_approved: boolean;
  created_at: string;
}

/**
 * Combined view: Mission Instance with its Template
 */
export interface MissionWithTemplate extends MissionInstance {
  mission_template: MissionTemplate;
}

/**
 * User Mission Status - Mission with user's participation status
 */
export interface UserMissionStatus {
  mission_instance: MissionWithTemplate;
  participation: MissionParticipation | null;
}

