import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppTheme } from '../../contexts/ThemeContext';
import { Goal, GoalType, formatGoalProgress } from '../../types/goal';

interface GoalCardProps {
  goal: Goal;
}

export default function GoalCard({ goal }: GoalCardProps) {
  const { theme } = useAppTheme();

  const getIconName = (type: GoalType): keyof typeof MaterialIcons.glyphMap => {
    switch (type) {
      case 'distance':
        return 'straighten';
      case 'time':
        return 'timer';
      case 'sessions':
        return 'directions-run';
      case 'points':
        return 'emoji-events';
      default:
        return 'flag';
    }
  };

  const progress = goal.targetValue > 0 ? Math.min(goal.currentValue / goal.targetValue, 1) : 0;
  const progressPercent = Math.round(progress * 100);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatTimeProgress = (currentMinutes: number, targetMinutes: number): string => {
    const formatTime = (minutes: number): string => {
      const h = Math.floor(minutes / 60);
      const m = Math.floor(minutes % 60);
      if (h > 0) {
        return `${h}h ${m}m`;
      }
      return `${m}m`;
    };
    return `${formatTime(currentMinutes)} / ${formatTime(targetMinutes)}`;
  };

  const getProgressText = (): string => {
    if (goal.type === 'time') {
      return formatTimeProgress(goal.currentValue, goal.targetValue);
    }
    return formatGoalProgress(goal.currentValue, goal.targetValue, goal.unitLabel);
  };

  const endDate = new Date(goal.startDate);
  endDate.setDate(endDate.getDate() + goal.durationWeeks * 7);

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.cardHeader}>
        <MaterialIcons name={getIconName(goal.type)} size={24} color={theme.accent} />
        <View style={styles.cardHeaderText}>
          <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={1} ellipsizeMode="tail">
            {goal.title}
          </Text>
          <Text
            style={[styles.cardSubtitle, { color: theme.mutedText }]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {getProgressText()}
          </Text>
        </View>
      </View>
      <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
        <View
          style={[
            styles.progressFill,
            { width: `${progress * 100}%`, backgroundColor: theme.accent },
          ]}
        />
      </View>
      <View style={styles.cardFooter}>
        <Text style={[styles.progressText, { color: theme.mutedText }]}>
          {progressPercent}% complete
        </Text>
        <Text style={[styles.dateText, { color: theme.mutedText }]}>
          Ends {formatDate(endDate.toISOString())}
        </Text>
      </View>
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderText: {
    marginLeft: 12,
    flex: 1,
    flexShrink: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 12,
  },
  dateText: {
    fontSize: 12,
  },
});
