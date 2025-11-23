import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useRunStats } from '../contexts/RunStatsContext';
import { useAppTheme } from '../contexts/ThemeContext';
import { useGoals } from '../contexts/GoalsContext';
import GoalCard from '../components/goals/GoalCard';

export default function ChallengesScreen() {
  const { points, totalDistanceMeters, elapsedSeconds } = useRunStats();
  const { theme } = useAppTheme();
  const { goals } = useGoals();
  const navigation = useNavigation();

  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    if (h > 0) {
      return `${h}h ${m}m`;
    }
    return `${m}m ${s}s`;
  };

  // Goals
  const weeklyDistanceGoal = 10; // km
  const weeklyTimeGoal = 3600; // 1 hour in seconds
  const pointsMilestone = 1000;

  const distanceKm = totalDistanceMeters / 1000;
  const distanceProgress = Math.min(distanceKm / weeklyDistanceGoal, 1);
  const timeProgress = Math.min(elapsedSeconds / weeklyTimeGoal, 1);
  const pointsProgress = Math.min(points / pointsMilestone, 1);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: theme.text }]}>Personal Goals</Text>
        <Text style={[styles.subtitle, { color: theme.mutedText }]}>
          Track your progress and unlock achievements
        </Text>

        {/* Create Goal Button */}
        <TouchableOpacity
          style={[styles.createGoalCard, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={() => navigation.navigate('CreateGoal' as never)}
          activeOpacity={0.8}
        >
          <View style={[styles.createGoalIcon, { backgroundColor: 'rgba(3,202,89,0.15)' }]}>
            <MaterialIcons name="add" size={24} color={theme.accent} />
          </View>
          <View style={styles.createGoalTextContainer}>
            <Text style={[styles.createGoalTitle, { color: theme.text }]}>Create a new goal</Text>
            <Text style={[styles.createGoalSubtitle, { color: theme.mutedText }]}>
              Set your own distance, time, or session target.
            </Text>
          </View>
        </TouchableOpacity>

        {/* Your Goals Section */}
        {goals.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Your Goals</Text>
            {goals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} />
            ))}
          </>
        )}

        {/* System Goals Section */}
        <Text style={[styles.sectionTitle, { color: theme.text, marginTop: goals.length > 0 ? 8 : 0 }]}>
          Weekly Goals
        </Text>

        {/* Weekly Distance Goal */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="straighten" size={24} color={theme.accent} />
            <View style={styles.cardHeaderText}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Weekly Distance</Text>
              <Text style={[styles.cardSubtitle, { color: theme.mutedText }]}>
                {distanceKm.toFixed(2)} / {weeklyDistanceGoal} km
              </Text>
            </View>
          </View>
          <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
            <View
              style={[
                styles.progressFill,
                { width: `${distanceProgress * 100}%`, backgroundColor: theme.accent },
              ]}
            />
          </View>
          <Text style={[styles.progressText, { color: theme.mutedText }]}>
            {Math.round(distanceProgress * 100)}% complete
          </Text>
        </View>

        {/* Weekly Time Goal */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="timer" size={24} color={theme.accent} />
            <View style={styles.cardHeaderText}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Weekly Time</Text>
              <Text style={[styles.cardSubtitle, { color: theme.mutedText }]}>
                {formatTime(elapsedSeconds)} / {formatTime(weeklyTimeGoal)}
              </Text>
            </View>
          </View>
          <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
            <View
              style={[
                styles.progressFill,
                { width: `${timeProgress * 100}%`, backgroundColor: theme.accent },
              ]}
            />
          </View>
          <Text style={[styles.progressText, { color: theme.mutedText }]}>
            {Math.round(timeProgress * 100)}% complete
          </Text>
        </View>

        {/* Points Milestone */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="emoji-events" size={24} color={theme.accent} />
            <View style={styles.cardHeaderText}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Points Milestone</Text>
              <Text style={[styles.cardSubtitle, { color: theme.mutedText }]}>
                {points.toLocaleString()} / {pointsMilestone.toLocaleString()} points
              </Text>
            </View>
          </View>
          <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
            <View
              style={[
                styles.progressFill,
                { width: `${pointsProgress * 100}%`, backgroundColor: theme.accent },
              ]}
            />
          </View>
          <Text style={[styles.progressText, { color: theme.mutedText }]}>
            {Math.round(pointsProgress * 100)}% complete
          </Text>
        </View>

        {/* UN Goal Challenge */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="public" size={24} color={theme.accent} />
            <View style={styles.cardHeaderText}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>UN Goal #11</Text>
              <Text style={[styles.cardSubtitle, { color: theme.mutedText }]}>
                Sustainable Cities
              </Text>
            </View>
          </View>
          <Text style={[styles.challengeText, { color: theme.mutedText }]}>
            Run 5km this week to contribute to sustainable urban mobility. Every kilometer counts
            towards making cities more walkable and sustainable.
          </Text>
          <View style={[styles.progressBar, { backgroundColor: theme.border, marginTop: 12 }]}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min((distanceKm / 5) * 100, 100)}%`,
                  backgroundColor: theme.accent,
                },
              ]}
            />
          </View>
        </View>
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
  challengeText: {
    fontSize: 14,
    lineHeight: 20,
  },
  createGoalCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  createGoalIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  createGoalTextContainer: {
    flex: 1,
  },
  createGoalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  createGoalSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    marginTop: 8,
  },
});

