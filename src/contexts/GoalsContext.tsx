import React, { createContext, ReactNode, useContext, useState } from 'react';
import { Goal, GoalType } from '../types/goal';

interface GoalsContextValue {
  goals: Goal[];
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'current'>) => void;
  updateGoal: (goalId: string, updates: Partial<Goal>) => void;
  deleteGoal: (goalId: string) => void;
}

const GoalsContext = createContext<GoalsContextValue | undefined>(undefined);

export const GoalsProvider = ({ children }: { children: ReactNode }) => {
  const [goals, setGoals] = useState<Goal[]>([]);

  const addGoal = (goalData: Omit<Goal, 'id' | 'createdAt' | 'current'>) => {
    const newGoal: Goal = {
      ...goalData,
      id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      current: 0,
      steps: goalData.steps.map((step) => ({
        ...step,
        current: 0,
      })),
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

