export type GoalType = 'distance' | 'time' | 'sessions' | 'points';

export interface GoalStep {
  id: number;
  label: string;
  target: number;
}

export interface NewGoal {
  title: string;
  type: GoalType;
  target: number;
  steps: GoalStep[];
  durationWeeks: number;
  startDate: Date;
}

export interface UserGoal {
  id: string;
  title: string;
  type: GoalType;
  target: number;
  current: number;
  steps: GoalStep[];
  durationWeeks: number;
  startDate: Date;
  createdAt: Date;
}

