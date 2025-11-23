import React, { createContext, ReactNode, useContext, useState } from 'react';
import { Goal, GoalType, getGoalUnitLabel } from '../types/goal';

interface GoalsContextValue {
  goals: Goal[];
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'currentValue'>) => void;
  updateGoal: (goalId: string, updates: Partial<Goal>) => void;
  deleteGoal: (goalId: string) => void;
}

const GoalsContext = createContext<GoalsContextValue | undefined>(undefined);

export const GoalsProvider = ({ children }: { children: ReactNode }) => {
  const [goals, setGoals] = useState<Goal[]>([]);

  const addGoal = (goalData: Omit<Goal, 'id' | 'createdAt' | 'currentValue'>) => {
    const newGoal: Goal = {
      ...goalData,
      id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      currentValue: 0,
      unitLabel: goalData.unitLabel || getGoalUnitLabel(goalData.type),
    };
    setGoals((prevGoals) => [newGoal, ...prevGoals]); // Add new goal at the top
  };

  const updateGoal = (goalId: string, updates: Partial<Goal>) => {
    setGoals((prevGoals) =>
      prevGoals.map((goal) => (goal.id === goalId ? { ...goal, ...updates } : goal))
    );
  };

  const deleteGoal = (goalId: string) => {
    setGoals((prevGoals) => prevGoals.filter((goal) => goal.id !== goalId));
  };

  return (
    <GoalsContext.Provider value={{ goals, addGoal, updateGoal, deleteGoal }}>
      {children}
    </GoalsContext.Provider>
  );
};

export const useGoals = () => {
  const ctx = useContext(GoalsContext);
  if (!ctx) throw new Error('useGoals must be used inside GoalsProvider');
  return ctx;
};
