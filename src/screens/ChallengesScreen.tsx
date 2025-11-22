import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../contexts/ThemeContext';
import { GoalType, UserGoal } from '../types/goals';

export default function ChallengesScreen() {
  const { theme } = useAppTheme();
  const navigation = useNavigation();

  // Mock user goals for initial display
  const mockGoals: UserGoal[] = [
    {
      id: '1',
      title: 'Run 30 km this month',
      type: 'distance',
      target: 30,
      current: 15,
      steps: [],
      durationWeeks: 4,
      startDate: new Date(),
      createdAt: new Date(),
    },
    {
      id: '2',
      title: 'Complete 5 runs',
      type: 'sessions',
      target: 5,
      current: 2,
      steps: [],
      durationWeeks: 2,
      startDate: new Date(),
      createdAt: new Date(),
    },
  ];

  const getGoalIcon = (type: GoalType): string => {
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

  const getGoalUnit = (type: GoalType): string => {
    switch (type) {
      case 'distance':
        return 'km';
      case 'time':
        return 'min';
      case 'sessions':
        return 'runs';
      case 'points':
        return 'pts';
      default:
        return '';
    }
  };

  const formatProgress = (goal: UserGoal): string => {
    const unit = getGoalUnit(goal.type);
    return `${goal.current} / ${goal.target} ${unit}`;
  };

  const handleCreateGoal = () => {
    navigation.navigate('CreateGoal' as never);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: theme.text }]}>Your Goals</Text>
        <Text style={[styles.subtitle, { color: theme.mutedText }]}>
          Create and track your own running challenges
        </Text>

        {/* Create Goal Button */}
        <TouchableOpacity
          style={[styles.createCard, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={handleCreateGoal}
          activeOpacity={0.8}
        >
          <View style={styles.createCardContent}>
            <View style={[styles.createIcon, { backgroundColor: theme.accent }]}>
              <MaterialIcons name="add" size={24} color="#020617" />
            </View>
            <View style={styles.createCardText}>
              <Text style={[styles.createCardTitle, { color: theme.text }]}>Create a new goal</Text>
              <Text style={[styles.createCardSubtitle, { color: theme.mutedText }]}>
                Set your own distance, time, or session target
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* User Goals List */}
        {mockGoals.map((goal) => {
          const progress = Math.min(goal.current / goal.target, 1);
          return (
            <View
              key={goal.id}
              style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
            >
              <View style={styles.cardHeader}>
                <MaterialIcons name={getGoalIcon(goal.type) as any} size={24} color={theme.accent} />
                <View style={styles.cardHeaderText}>
                  <Text style={[styles.cardTitle, { color: theme.text }]}>{goal.title}</Text>
                  <Text style={[styles.cardSubtitle, { color: theme.mutedText }]}>
                    {formatProgress(goal)}
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
              <Text style={[styles.progressText, { color: theme.mutedText }]}>
                {Math.round(progress * 100)}% complete
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 24,
  },
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
  progressText: {
    fontSize: 12,
  },
  createCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
  },
  createCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  createIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  createCardText: {
    flex: 1,
  },
  createCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  createCardSubtitle: {
    fontSize: 14,
  },
});

