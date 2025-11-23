import React, { createContext, ReactNode, useContext, useState, useEffect } from 'react';
import { Goal, GoalType, getGoalUnitLabel } from '../types/goal';
import { useRunStats } from './RunStatsContext';

interface GoalsContextValue {
  goals: Goal[];
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'currentValue' | 'isActive'>) => void;
  updateGoal: (goalId: string, updates: Partial<Goal>) => void;
  deleteGoal: (goalId: string) => void;
}

const GoalsContext = createContext<GoalsContextValue | undefined>(undefined);

// Seed goals that should always exist
const createSeedGoals = (): Goal[] => {
  const now = new Date().toISOString();
  return [
    {
      id: 'seed_weekly_distance',
      title: 'Weekly Distance',
      type: 'distance',
      targetValue: 10, // km
      currentValue: 0,
      unitLabel: 'km',
      durationWeeks: 1,
      startDate: now,
      createdAt: now,
      timeframe: 'weekly',
      isActive: true,
    },
    {
      id: 'seed_weekly_time',
      title: 'Weekly Time',
      type: 'time',
      targetValue: 60, // 1 hour in minutes
      currentValue: 0,
      unitLabel: 'min',
      durationWeeks: 1,
      startDate: now,
      createdAt: now,
      timeframe: 'weekly',
      isActive: true,
    },
    {
      id: 'seed_points_milestone',
      title: 'Points Milestone',
      type: 'points',
      targetValue: 1000,
      currentValue: 0,
      unitLabel: 'pts',
      durationWeeks: 52, // Year-long goal
      startDate: now,
      createdAt: now,
      timeframe: 'single',
      isActive: true,
    },
    {
      id: 'seed_un_goal_11',
      title: 'UN Goal #11',
      type: 'distance',
      targetValue: 5, // km
      currentValue: 0,
      unitLabel: 'km',
      durationWeeks: 1,
      startDate: now,
      createdAt: now,
      timeframe: 'weekly',
      isActive: true,
    },
  ];
};

// Inner component that uses the hook
const GoalsProviderInner = ({ children }: { children: ReactNode }) => {
  const { totalDistanceMeters, elapsedSeconds, points } = useRunStats();
  const [goals, setGoals] = useState<Goal[]>(() => {
    // Initialize with seed goals
    return createSeedGoals();
  });

  // Sync progress from RunStats to goals
  useEffect(() => {
    setGoals((prevGoals) =>
      prevGoals.map((goal) => {
        let newCurrentValue = goal.currentValue;

        if (goal.type === 'distance' && goal.isActive) {
          // Convert meters to km for distance goals
          const distanceKm = totalDistanceMeters / 1000;
          newCurrentValue = distanceKm;
        } else if (goal.type === 'time' && goal.isActive) {
          // Convert seconds to minutes for time goals
          const timeMinutes = elapsedSeconds / 60;
          newCurrentValue = timeMinutes;
        } else if (goal.type === 'points' && goal.isActive) {
          newCurrentValue = points;
        }

        return { ...goal, currentValue: newCurrentValue };
      })
    );
  }, [totalDistanceMeters, elapsedSeconds, points]);

  const addGoal = (goalData: Omit<Goal, 'id' | 'createdAt' | 'currentValue' | 'isActive'>) => {
    const newGoal: Goal = {
      ...goalData,
      id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      currentValue: 0,
      unitLabel: goalData.unitLabel || getGoalUnitLabel(goalData.type),
      isActive: true, // New goals are active by default
      timeframe: goalData.timeframe || 'single', // Default to 'single' if not specified
    };
    setGoals((prevGoals) => [newGoal, ...prevGoals]); // Add new goal at the top
  };

  const updateGoal = (goalId: string, updates: Partial<Goal>) => {
    setGoals((prevGoals) =>
      prevGoals.map((goal) => (goal.id === goalId ? { ...goal, ...updates } : goal))
    );
  };

  const deleteGoal = (goalId: string) => {
    // Don't allow deleting seed goals
    if (goalId.startsWith('seed_')) {
      // Instead, mark as inactive
      updateGoal(goalId, { isActive: false });
      return;
    }
    setGoals((prevGoals) => prevGoals.filter((goal) => goal.id !== goalId));
  };

  return (
    <GoalsContext.Provider value={{ goals, addGoal, updateGoal, deleteGoal }}>
      {children}
    </GoalsContext.Provider>
  );
};

export const GoalsProvider = ({ children }: { children: ReactNode }) => {
  return <GoalsProviderInner>{children}</GoalsProviderInner>;
};

export const useGoals = () => {
  const ctx = useContext(GoalsContext);
  if (!ctx) throw new Error('useGoals must be used inside GoalsProvider');
  return ctx;
};
