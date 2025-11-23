export type GoalType = 'distance' | 'time' | 'sessions' | 'points';

export interface GoalStep {
  id: string;
  name: string;
  target: number; // Target value for this step
  current: number; // Current progress
}

export interface Goal {
  id: string;
  title: string;
  type: GoalType;
  target: number; // Total target value
  current: number; // Current progress
  steps: GoalStep[];
  durationWeeks: number;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
}

