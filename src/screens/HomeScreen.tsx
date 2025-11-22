import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';

export default function HomeScreen() {
  const { user, profile, loading } = useAuth();
  const navigation = useNavigation();

  const displayName =
    profile?.username ||
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    (user?.email ? user.email.split('@')[0] : 'Runner');

  // Placeholder stats (will be wired to real data later)
  const todayStats = {
    distance: '0.0',
    time: '0:00',
    points: '0',
  };

  const weekProgress = 0.4; // 40% progress

  const handleStartRun = () => {
    navigation.navigate('Run' as never);
  };

  const handleViewChallenges = () => {
    // TODO: Navigate to challenges screen
  };

  const handleGoToSettings = () => {
    navigation.navigate('Settings' as never);
  };

  const handleGoToChat = () => {
    navigation.navigate('Chat' as never);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoToSettings} activeOpacity={0.7}>
            <View style={styles.avatar}>
              {profile?.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
              )}
            </View>
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.nameText}>{displayName}</Text>
          </View>
        </View>

        {/* Today Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="walk-outline" size={24} color="#03CA59" />
            <Text style={styles.statValue}>{todayStats.distance}</Text>
            <Text style={styles.statLabel}>km</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="time-outline" size={24} color="#03CA59" />
            <Text style={styles.statValue}>{todayStats.time}</Text>
            <Text style={styles.statLabel}>time</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="trophy-outline" size={24} color="#03CA59" />
            <Text style={styles.statValue}>{todayStats.points}</Text>
            <Text style={styles.statLabel}>points</Text>
          </View>
        </View>

        {/* This Week Progress Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>This Week</Text>
            <Text style={styles.cardSubtitle}>4.2 / 10 km</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${weekProgress * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>{Math.round(weekProgress * 100)}% complete</Text>
        </View>

        {/* Challenges Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="emoji-events" size={24} color="#03CA59" />
            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle}>UN Goal #11</Text>
              <Text style={styles.cardSubtitle}>Sustainable Cities</Text>
            </View>
          </View>
          <Text style={styles.challengeText}>
            Run 5km this week to contribute to sustainable urban mobility
          </Text>
          <TouchableOpacity style={styles.challengeButton} onPress={handleViewChallenges} activeOpacity={0.8}>
            <Text style={styles.challengeButtonText}>View Challenges</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleStartRun} activeOpacity={0.8}>
            <View style={[styles.actionIcon, { backgroundColor: '#03CA59' }]}>
              <Ionicons name="play" size={24} color="#000" />
            </View>
            <Text style={styles.actionLabel}>Start Run</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleGoToChat} activeOpacity={0.8}>
            <View style={styles.actionIcon}>
              <Ionicons name="chatbubbles-outline" size={24} color="#03CA59" />
            </View>
            <Text style={styles.actionLabel}>Group Chat</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleStartRun} activeOpacity={0.8}>
            <View style={styles.actionIcon}>
              <MaterialIcons name="alt-route" size={24} color="#03CA59" />
            </View>
            <Text style={styles.actionLabel}>Add Route</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020202',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#9CA3AF',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#03CA59',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
  },
  headerText: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  nameText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F9FAFB',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#101010',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F9FAFB',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#101010',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
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
    color: '#F9FAFB',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 2,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#181818',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#03CA59',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  challengeText: {
    fontSize: 14,
    color: '#9CA3AF',
    lineHeight: 20,
    marginBottom: 12,
  },
  challengeButton: {
    backgroundColor: 'rgba(3, 202, 89, 0.1)',
    borderWidth: 1,
    borderColor: '#03CA59',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  challengeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#03CA59',
  },
  quickActions: {
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
    backgroundColor: '#181818',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
