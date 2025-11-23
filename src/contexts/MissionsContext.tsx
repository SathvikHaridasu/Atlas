import React, { createContext, ReactNode, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  fetchMissionInstancesForUser,
  startMission,
  completeMission as completeMissionUtil,
  type MissionWithTemplate,
  type MissionInstance,
  type MissionParticipation,
  type UserMissionStatus,
  type CompleteMissionParams,
} from '../lib/missions';

/**
 * Missions Context State
 */
interface MissionsContextValue {
  // Mission data
  availableMissions: MissionWithTemplate[];
  activeMission: MissionInstance | null;
  participation: Record<string, MissionParticipation>; // key: missionInstanceId
  loading: boolean;
  error: string | null;
  
  // Actions
  refresh: () => Promise<void>;
}

/**
 * Mission Actions Context
 * Separated to avoid unnecessary re-renders
 */
interface MissionActionsContextValue {
  joinMission: (missionInstanceId: string) => Promise<MissionParticipation>;
  completeMission: (params: CompleteMissionParams) => Promise<{ success: boolean }>;
  setActiveMission: (mission: MissionInstance | null) => void;
  clearActiveMission: () => void;
}

// Create contexts
const MissionsContext = createContext<MissionsContextValue | undefined>(undefined);
const MissionActionsContext = createContext<MissionActionsContextValue | undefined>(undefined);

/**
 * MissionsProvider
 * Manages global mission state and provides hooks for accessing mission data
 */
export const MissionsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [availableMissions, setAvailableMissions] = useState<MissionWithTemplate[]>([]);
  const [activeMission, setActiveMission] = useState<MissionInstance | null>(null);
  const [participation, setParticipation] = useState<Record<string, MissionParticipation>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch all missions visible to the current user
   * Includes global, session, and user-specific missions
   * Also fetches participation status for each mission
   */
  const fetchMissions = useCallback(async () => {
    if (!user?.id) {
      setAvailableMissions([]);
      setParticipation({});
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const userMissionStatuses = await fetchMissionInstancesForUser(user.id);

      // Extract mission instances
      const missions = userMissionStatuses.map((status) => status.mission_instance);
      setAvailableMissions(missions);

      // Build participation map
      const participationMap: Record<string, MissionParticipation> = {};
      userMissionStatuses.forEach((status) => {
        if (status.participation) {
          participationMap[status.mission_instance.id] = status.participation;
        }
      });
      setParticipation(participationMap);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch missions';
      console.error('Error fetching missions:', err);
      setError(errorMessage);
      setAvailableMissions([]);
      setParticipation({});
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  /**
   * Refresh mission data
   * Public function that can be called from components
   */
  const refresh = useCallback(async () => {
    await fetchMissions();
  }, [fetchMissions]);

  // Fetch missions when user changes
  useEffect(() => {
    fetchMissions();
  }, [fetchMissions]);

  /**
   * Join a mission
   * Creates a participation record with status='joined'
   */
  const joinMission = useCallback(
    async (missionInstanceId: string): Promise<MissionParticipation> => {
      if (!user?.id) {
        throw new Error('User must be authenticated to join a mission');
      }

      try {
        const participationRecord = await startMission(missionInstanceId, user.id);

        // Update local participation state
        setParticipation((prev) => ({
          ...prev,
          [missionInstanceId]: participationRecord,
        }));

        // Optionally set as active mission
        const mission = availableMissions.find((m) => m.id === missionInstanceId);
        if (mission) {
          setActiveMission(mission);
        }

        return participationRecord;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to join mission';
        console.error('Error joining mission:', err);
        setError(errorMessage);
        throw err;
      }
    },
    [user?.id, availableMissions]
  );

  /**
   * Complete a mission
   * Submits proof (media/location) and updates participation status to 'completed'
   */
  const completeMission = useCallback(
    async (params: CompleteMissionParams): Promise<{ success: boolean }> => {
      if (!user?.id) {
        throw new Error('User must be authenticated to complete a mission');
      }

      try {
        const result = await completeMissionUtil({
          ...params,
          userId: user.id,
        });

        // Update local participation state
        setParticipation((prev) => ({
          ...prev,
          [params.missionInstanceId]: result.participation,
        }));

        // Optionally clear active mission if it was the completed one
        if (activeMission?.id === params.missionInstanceId) {
          setActiveMission(null);
        }

        return { success: true };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to complete mission';
        console.error('Error completing mission:', err);
        setError(errorMessage);
        throw err;
      }
    },
    [user?.id, activeMission]
  );

  /**
   * Set the active mission
   * Used when user starts a mission flow (e.g., opens camera for mission)
   */
  const handleSetActiveMission = useCallback((mission: MissionInstance | null) => {
    setActiveMission(mission);
  }, []);

  /**
   * Clear the active mission
   * Used when user cancels or completes a mission flow
   */
  const handleClearActiveMission = useCallback(() => {
    setActiveMission(null);
  }, []);

  // Context values
  const missionsValue: MissionsContextValue = {
    availableMissions,
    activeMission,
    participation,
    loading,
    error,
    refresh,
  };

  const actionsValue: MissionActionsContextValue = {
    joinMission,
    completeMission,
    setActiveMission: handleSetActiveMission,
    clearActiveMission: handleClearActiveMission,
  };

  return (
    <MissionsContext.Provider value={missionsValue}>
      <MissionActionsContext.Provider value={actionsValue}>
        {children}
      </MissionActionsContext.Provider>
    </MissionsContext.Provider>
  );
};

/**
 * Hook to access mission data and state
 * Returns available missions, active mission, participation status, loading, error, and refresh function
 * 
 * @example
 * const { availableMissions, activeMission, participation, loading, refresh } = useMissions();
 */
export const useMissions = (): MissionsContextValue => {
  const ctx = useContext(MissionsContext);
  if (!ctx) {
    throw new Error('useMissions must be used inside MissionsProvider');
  }
  return ctx;
};

/**
 * Hook to access mission actions
 * Returns functions for joining missions, completing missions, and managing active mission state
 * 
 * @example
 * const { joinMission, completeMission, setActiveMission, clearActiveMission } = useMissionActions();
 */
export const useMissionActions = (): MissionActionsContextValue => {
  const ctx = useContext(MissionActionsContext);
  if (!ctx) {
    throw new Error('useMissionActions must be used inside MissionsProvider');
  }
  return ctx;
};

