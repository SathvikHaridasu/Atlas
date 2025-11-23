import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import HeaderHomeButton from '../components/HeaderHomeButton';
import { useAppTheme } from '../contexts/ThemeContext';
import { useCurrentProfile } from '../hooks/useCurrentProfile';
import type { RootStackParamList } from '../navigation/RootNavigator';

type ProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Profile'>;

export default function ProfileScreen() {
  const { user } = useAuth();
  const { theme } = useAppTheme();
  const { profile, loading } = useCurrentProfile();
  const navigation = useNavigation<ProfileScreenNavigationProp>();

  const displayName =
    profile?.display_name ||
    profile?.full_name ||
    profile?.username ||
    user?.user_metadata?.full_name ||
    (user?.email ? user.email.split('@')[0] : 'User');

  const username = profile?.username || user?.email?.split('@')[0] || 'username';
  const avatarUrl = profile?.avatar_url;
  const bio = profile?.bio;

  const handleEditProfile = () => {
    // Profile is in drawer, need to navigate via parent stack navigator
    const parentNavigator = navigation.getParent();
    if (parentNavigator) {
      (parentNavigator as any).navigate('EditProfileScreen');
    } else {
      navigation.navigate('EditProfileScreen' as never);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.accent} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Home Button */}
      <View style={styles.homeButtonContainer}>
        <HeaderHomeButton />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: theme.accent }]}>
                <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
              </View>
            )}
          </View>

          <Text style={[styles.displayName, { color: theme.text }]}>{displayName}</Text>
          {username && (
            <Text style={[styles.username, { color: theme.mutedText }]}>@{username}</Text>
          )}

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.text }]}>0</Text>
              <Text style={[styles.statLabel, { color: theme.mutedText }]}>Dares</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.text }]}>0</Text>
              <Text style={[styles.statLabel, { color: theme.mutedText }]}>Followers</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.text }]}>0</Text>
              <Text style={[styles.statLabel, { color: theme.mutedText }]}>Following</Text>
            </View>
          </View>

          {/* Edit Profile Button */}
          <TouchableOpacity
            style={[styles.editButton, { borderColor: theme.accent }]}
            onPress={handleEditProfile}
            activeOpacity={0.8}
          >
            <Text style={[styles.editButtonText, { color: theme.accent }]}>Edit profile</Text>
          </TouchableOpacity>

          {/* Bio */}
          {bio && (
            <View style={styles.bioContainer}>
              <Text style={[styles.bioText, { color: theme.text }]}>{bio}</Text>
            </View>
          )}
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
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  homeButtonContainer: {
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  profileHeader: {
    alignItems: 'center',
    paddingTop: 20,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#03CA59',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '700',
    color: '#000',
  },
  displayName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(3, 202, 89, 0.25)',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
  },
  editButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 2,
    backgroundColor: 'transparent',
    marginBottom: 20,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  bioContainer: {
    width: '100%',
    paddingHorizontal: 16,
  },
  bioText: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
  },
});
