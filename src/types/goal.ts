export type GoalType = 'distance' | 'time' | 'sessions' | 'points' | 'custom';
export type GoalTimeframe = 'weekly' | 'monthly' | 'single';

export interface Goal {
  id: string;
  title: string;
  type: GoalType;
  targetValue: number;     // e.g. 22
  currentValue: number;     // e.g. 5.5
  unitLabel: string;       // 'km' | 'min' | 'runs' | 'pts'
  durationWeeks: number;
  startDate: string;       // ISO string
  createdAt: string;       // ISO string
  timeframe?: GoalTimeframe; // 'weekly' | 'monthly' | 'single'
  isActive: boolean;        // Whether the goal is currently active
}

// Helper to map goal type → unit label
export const getGoalUnitLabel = (type: GoalType): string => {
  switch (type) {
    case 'distance':
      return 'km';
    case 'time':
      return 'min';
    case 'sessions':
      return 'runs';
    case 'points':
    default:
      return 'pts';
  }
};

// Universal formatter for showing progress text
export const formatGoalProgress = (
  currentValue: number,
  targetValue: number,
  unitLabel: string,
): string => {
  const current = Number(currentValue.toFixed(1));
  const target = Number(targetValue.toFixed(1));
  return `${current} / ${target} ${unitLabel}`;
};
