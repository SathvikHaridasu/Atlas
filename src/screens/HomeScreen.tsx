import { Ionicons } from '@expo/vector-icons';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Polygon, Region } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { useRunStats } from '../contexts/RunStatsContext';
import { useAppTheme } from '../contexts/ThemeContext';
import type { RootTabParamList } from '../navigation/RootNavigator';
import { SAMPLE_ZONES } from '../lib/sampleZones';
import { NeonCard } from '../components/ui/NeonCard';
import { PillButton } from '../components/ui/PillButton';

type HomeScreenNavigationProp = BottomTabNavigationProp<RootTabParamList, 'Home'>;

export default function HomeScreen() {
  const { user, profile, loading } = useAuth();
  const { points, totalDistanceMeters, elapsedSeconds } = useRunStats();
  const { theme } = useAppTheme();
  const navigation = useNavigation<HomeScreenNavigationProp>();

  const handleOpenDrawer = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  const [miniRegion, setMiniRegion] = useState<Region | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  const myZones = SAMPLE_ZONES.filter((z) => z.group === "ME");

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
    navigation.navigate('Chats');
  };

  const weeklyGoalKm = 10;
  const weekProgress = Math.min(parseFloat(distanceKm) / weeklyGoalKm, 1);

  useEffect(() => {
    const loadLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setLocationError("Location permission denied");
          return;
        }

        const loc = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = loc.coords;

        setMiniRegion({
          latitude,
          longitude,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        });
      } catch (err) {
        console.warn("Error getting home location", err);
        setLocationError("Error getting location");
      }
    };

    loadLocation();
  }, []);

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
          <TouchableOpacity onPress={handleOpenDrawer} activeOpacity={0.7} style={styles.menuButton}>
            <Ionicons name="menu" size={24} color={theme.text} />
          </TouchableOpacity>
          <Ionicons name="footsteps" size={26} color={theme.accent} />
          <Text style={[styles.appTitle, { color: theme.text }]}>Atlas Run</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome message */}
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeLabel}>Welcome back,</Text>
          <Text style={styles.welcomeName}>{displayName}</Text>
        </View>

        {/* Today stats */}
        <Text style={styles.sectionTitle}>Today</Text>
        <View style={styles.statsRow}>
          <NeonCard style={styles.statCardWrapper}>
            <Ionicons name="walk-outline" size={24} color="#03CA59" style={styles.statIcon} />
            <Text style={styles.statValue}>{distanceKm}</Text>
            <Text style={styles.statLabel}>km</Text>
            <LinearGradient
              colors={['transparent', 'rgba(3, 202, 89, 0.06)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
          </NeonCard>
          <NeonCard style={styles.statCardWrapper}>
            <Ionicons name="time-outline" size={24} color="#03CA59" style={styles.statIcon} />
            <Text style={styles.statValue}>{formatTime(elapsedSeconds)}</Text>
            <Text style={styles.statLabel}>time</Text>
            <LinearGradient
              colors={['transparent', 'rgba(3, 202, 89, 0.06)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
          </NeonCard>
          <NeonCard style={styles.statCardWrapper}>
            <Ionicons name="trophy-outline" size={24} color="#03CA59" style={styles.statIcon} />
            <Text style={styles.statValue}>{points.toLocaleString()}</Text>
            <Text style={styles.statLabel}>points</Text>
            <LinearGradient
              colors={['transparent', 'rgba(3, 202, 89, 0.06)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
          </NeonCard>
        </View>

        {/* Personal goals */}
        <Text style={styles.sectionTitle}>Personal goals</Text>
        <NeonCard highlight>
          <Text style={styles.goalTitle}>Run {weeklyGoalKm} km this week</Text>
          <Text style={styles.goalSubtitle}>
            You've run {distanceKm} km so far.
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${weekProgress * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {Math.round(weekProgress * 100)}% complete
          </Text>
        </NeonCard>

        {/* Mini Map card */}
        <NeonCard>
          <View style={styles.miniMapHeader}>
            <Text style={styles.masterMapTitle}>Your territory</Text>
            <TouchableOpacity onPress={() => navigation.navigate("MasterMap" as never)}>
              <Text style={styles.miniMapLink}>Open map</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.miniMapContainer}>
            {miniRegion ? (
              <MapView
                style={StyleSheet.absoluteFill}
                provider="google"
                initialRegion={miniRegion}
                showsUserLocation
                scrollEnabled={false}
                zoomEnabled={false}
                pitchEnabled={false}
                rotateEnabled={false}
                pointerEvents="none"
              >
                {myZones.map((zone) => (
                  <Polygon
                    key={zone.id}
                    coordinates={zone.coordinates}
                    strokeWidth={2}
                    strokeColor="rgba(3,202,89,1)"
                    fillColor="rgba(3,202,89,0.3)"
                  />
                ))}
              </MapView>
            ) : (
              <View style={styles.miniMapPlaceholder}>
                <Text style={styles.miniMapPlaceholderText}>
                  {locationError ?? "Loading your area..."}
                </Text>
              </View>
            )}
          </View>
        </NeonCard>

        {/* Quick actions */}
        <Text style={styles.sectionTitle}>Quick actions</Text>
        <View style={styles.quickRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleStartRun}
            activeOpacity={0.8}
          >
            <View style={styles.actionIconPrimary}>
              <Ionicons name="play" size={24} color="#000" />
            </View>
            <Text style={styles.actionLabel}>Start Run</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleViewChallenges}
            activeOpacity={0.8}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="flag-outline" size={24} color="#03CA59" />
            </View>
            <Text style={styles.actionLabel}>Goals</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleGoToChat}
            activeOpacity={0.8}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="chatbubbles-outline" size={24} color="#03CA59" />
            </View>
            <Text style={styles.actionLabel}>Group Chats</Text>
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
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButton: {
    marginRight: 12,
    padding: 4,
  },
  appTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  welcomeContainer: {
    marginTop: 8,
    marginBottom: 20,
  },
  welcomeLabel: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 2,
  },
  welcomeName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    marginTop: 24,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 8,
  },
  statCardWrapper: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    minHeight: 100,
  },
  statIcon: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  goalSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 12,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginTop: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#03CA59',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 8,
  },
  quickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 20,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    backgroundColor: '#050A0E',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionIconPrimary: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    backgroundColor: '#03CA59',
    shadowColor: '#03CA59',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  actionLabel: {
    fontSize: 13,
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  miniMapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  masterMapTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  miniMapContainer: {
    height: 140,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#050505',
  },
  miniMapLink: {
    fontSize: 14,
    color: '#03CA59',
    fontWeight: '600',
  },
  miniMapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniMapPlaceholderText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
});
