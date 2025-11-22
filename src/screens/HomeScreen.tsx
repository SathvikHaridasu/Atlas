import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useRunStats } from '../contexts/RunStatsContext';
import { useAppTheme } from '../contexts/ThemeContext';

export default function HomeScreen() {
  const { user, profile, loading } = useAuth();
  const { points, totalDistanceMeters, elapsedSeconds } = useRunStats();
  const { theme } = useAppTheme();
  const navigation = useNavigation();

  const displayName =
    profile?.full_name ||
    profile?.username ||
    user?.user_metadata?.full_name ||
    (user?.email ? user.email.split('@')[0] : 'Runner');

  const distanceKm = (totalDistanceMeters / 1000).toFixed(2);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleStartRun = () => {
    navigation.navigate('Run' as never);
  };

  const handleViewChallenges = () => {
    navigation.navigate('Challenges' as never);
  };

  const handleGoToSettings = () => {
    navigation.navigate('Settings' as never);
  };

  const handleGoToChat = () => {
    navigation.navigate('Chat' as never);
  };

  const weeklyGoalKm = 10;
  const weekProgress = Math.min(parseFloat(distanceKm) / weeklyGoalKm, 1);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
        <View style={styles.center}>
          <Text style={[styles.loadingText, { color: theme.mutedText }]}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Top row */}
      <View style={styles.topRow}>
        <View style={styles.logoRow}>
          <Ionicons name="footsteps" size={26} color={theme.accent} />
          <Text style={[styles.appTitle, { color: theme.text }]}>Atlas Run</Text>
        </View>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={handleViewChallenges}
          activeOpacity={0.7}
        >
          <MaterialIcons name="emoji-events" size={24} color={theme.accent} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Today stats */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Today</Text>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Ionicons name="walk-outline" size={24} color={theme.accent} />
            <Text style={[styles.statValue, { color: theme.text }]}>{distanceKm}</Text>
            <Text style={[styles.statLabel, { color: theme.mutedText }]}>km</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Ionicons name="time-outline" size={24} color={theme.accent} />
            <Text style={[styles.statValue, { color: theme.text }]}>{formatTime(elapsedSeconds)}</Text>
            <Text style={[styles.statLabel, { color: theme.mutedText }]}>time</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Ionicons name="trophy-outline" size={24} color={theme.accent} />
            <Text style={[styles.statValue, { color: theme.text }]}>{points.toLocaleString()}</Text>
            <Text style={[styles.statLabel, { color: theme.mutedText }]}>points</Text>
          </View>
        </View>

        {/* Personal goals */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Personal goals</Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.goalTitle, { color: theme.text }]}>Run {weeklyGoalKm} km this week</Text>
          <Text style={[styles.goalSubtitle, { color: theme.mutedText }]}>
            You've run {distanceKm} km so far.
          </Text>
          <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
            <View
              style={[
                styles.progressFill,
                { width: `${weekProgress * 100}%`, backgroundColor: theme.accent },
              ]}
            />
          </View>
          <Text style={[styles.progressText, { color: theme.mutedText }]}>
            {Math.round(weekProgress * 100)}% complete
          </Text>
        </View>

        {/* Territory Map card */}
        <TouchableOpacity
          style={[styles.masterMapCard, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={() => navigation.navigate("MasterMap" as never)}
          activeOpacity={0.8}
        >
          <Text style={[styles.masterMapTitle, { color: theme.text }]}>Territory Map</Text>
          <Text style={[styles.masterMapSubtitle, { color: theme.mutedText }]}>
            See who controls your neighbourhood.
          </Text>
        </TouchableOpacity>

        {/* Quick actions */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick actions</Text>
        <View style={styles.quickRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleStartRun}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIcon, { backgroundColor: theme.accent }]}>
              <Ionicons name="play" size={24} color="#000" />
            </View>
            <Text style={[styles.actionLabel, { color: theme.mutedText }]}>Start Run</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleViewChallenges}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIcon, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <MaterialIcons name="emoji-events" size={24} color={theme.accent} />
            </View>
            <Text style={[styles.actionLabel, { color: theme.mutedText }]}>Challenges</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleGoToChat}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIcon, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Ionicons name="chatbubbles-outline" size={24} color={theme.accent} />
            </View>
            <Text style={[styles.actionLabel, { color: theme.mutedText }]}>Group Chat</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 8,
  },
  iconButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    marginTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  goalSubtitle: {
    fontSize: 14,
    marginBottom: 12,
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
  quickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
  },
  actionLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  masterMapCard: {
    marginTop: 16,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  masterMapTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  masterMapSubtitle: {
    marginTop: 4,
    fontSize: 12,
  },
});
