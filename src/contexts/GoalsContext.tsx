import React, { createContext, ReactNode, useContext, useState } from 'react';
import { GoalType } from '../types/goals';

export interface GoalStep {
  id: string;
  label: string;
  targetValue: number;
  currentValue: number;
}

export interface Goal {
  id: string;
  title: string;
  type: GoalType;
  targetValue: number;
  currentValue: number;
  unitLabel: string;
  stepCount: number;
  steps?: GoalStep[]; // mini-goals
  createdAt: string;
}

interface GoalsContextValue {
  goals: Goal[];
  addGoal: (goal: Goal) => void;
  updateGoal: (goal: Goal) => void;
  updateGoalProgress: (id: string, currentValue: number) => void;
}

const GoalsContext = createContext<GoalsContextValue | undefined>(undefined);

export const GoalsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [goals, setGoals] = useState<Goal[]>([
    // Seed with demo goals
    {
      id: 'seed-1',
      title: 'Run 30 km this month',
      type: 'distance',
      targetValue: 30,
      currentValue: 15,
      unitLabel: 'km',
      stepCount: 3,
      steps: [
        { id: 'seed-1-step-1', label: 'Step 1', targetValue: 10, currentValue: 5 },
        { id: 'seed-1-step-2', label: 'Step 2', targetValue: 10, currentValue: 5 },
        { id: 'seed-1-step-3', label: 'Step 3', targetValue: 10, currentValue: 5 },
      ],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'seed-2',
      title: 'Complete 5 runs',
      type: 'sessions',
      targetValue: 5,
      currentValue: 2,
      unitLabel: 'runs',
      stepCount: 3,
      steps: [
        { id: 'seed-2-step-1', label: 'Step 1', targetValue: 2, currentValue: 1 },
        { id: 'seed-2-step-2', label: 'Step 2', targetValue: 2, currentValue: 1 },
        { id: 'seed-2-step-3', label: 'Step 3', targetValue: 1, currentValue: 0 },
      ],
      createdAt: new Date().toISOString(),
    },
  ]);

  const addGoal = (goal: Goal) => {
    setGoals((prev) => [goal, ...prev]); // New goals appear at the top
  };

  const updateGoal = (updated: Goal) => {
    setGoals((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
  };

  const updateGoalProgress = (id: string, currentValue: number) => {
    setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, currentValue } : g)));
  };

  return (
    <GoalsContext.Provider value={{ goals, addGoal, updateGoal, updateGoalProgress }}>
      {children}
    </GoalsContext.Provider>
  );
};

export const useGoals = (): GoalsContextValue => {
  const ctx = useContext(GoalsContext);
  if (!ctx) {
    throw new Error('useGoals must be used within a GoalsProvider');
  }
  return ctx;
};

