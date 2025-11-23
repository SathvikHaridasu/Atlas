import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../../contexts/ThemeContext';
import { GoalType } from '../../types/goal';

interface SummaryCardProps {
  goalType: GoalType;
  targetValue: number;
  stepCount: number;
  durationWeeks: number;
  startMode: 'today' | 'custom';
  startDate: Date | null;
}

export default function SummaryCard({
  goalType,
  targetValue,
  stepCount,
  durationWeeks,
  startMode,
  startDate,
}: SummaryCardProps) {
  const { theme } = useAppTheme();

  const formatTarget = (value: number, type: GoalType): string => {
    switch (type) {
      case 'distance':
        return `${value.toFixed(1)} km`;
      case 'time':
        return `${value} min`;
      case 'sessions':
        return `${value} run${value !== 1 ? 's' : ''}`;
      case 'points':
        return `${value.toLocaleString()} pts`;
      default:
        return `${value}`;
    }
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const today = new Date();
  const computedStartDate = startMode === 'today' ? today : startDate || today;
  const computedEndDate = new Date(computedStartDate);
  computedEndDate.setDate(computedEndDate.getDate() + durationWeeks * 7);

  const stepText = stepCount === 1 ? 'step' : 'steps';
  const weekText = durationWeeks === 1 ? 'week' : 'weeks';

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Text style={[styles.cardTitle, { color: theme.text }]}>Summary</Text>
      <Text style={[styles.summaryLine, { color: theme.text }]}>
        You'll {goalType === 'distance' ? 'run' : goalType === 'time' ? 'spend' : 'complete'}{' '}
        <Text style={{ color: theme.accent, fontWeight: '700' }}>
          {formatTarget(targetValue, goalType)}
        </Text>{' '}
        over{' '}
        <Text style={{ color: theme.accent, fontWeight: '700' }}>
          {stepCount} {stepText}
        </Text>{' '}
        in{' '}
        <Text style={{ color: theme.accent, fontWeight: '700' }}>
          {durationWeeks} {weekText}
        </Text>
        .
      </Text>
      <Text style={[styles.timeline, { color: theme.mutedText }]}>
        {startMode === 'today' ? 'Starts today' : `Starts ${formatDate(computedStartDate)}`} • Ends{' '}
        {formatDate(computedEndDate)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  summaryLine: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8,
  },
  timeline: {
    fontSize: 13,
    lineHeight: 18,
  },
});

