import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppTheme } from '../../contexts/ThemeContext';
import { Goal, GoalType } from '../../types/goal';

interface GoalCardProps {
  goal: Goal;
}

export default function GoalCard({ goal }: GoalCardProps) {
  const { theme } = useAppTheme();

  const formatValue = (value: number, type: GoalType): string => {
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

  const progress = goal.target > 0 ? Math.min(goal.current / goal.target, 1) : 0;
  const progressPercent = Math.round(progress * 100);

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.cardHeader}>
        <MaterialIcons name={getIconName(goal.type)} size={24} color={theme.accent} />
        <View style={styles.cardHeaderText}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>{goal.title}</Text>
          <Text style={[styles.cardSubtitle, { color: theme.mutedText }]}>
            {formatValue(goal.current, goal.type)} / {formatValue(goal.target, goal.type)}
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
          Ends {formatDate(goal.endDate)}
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

