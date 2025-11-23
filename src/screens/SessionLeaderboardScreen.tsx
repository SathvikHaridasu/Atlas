import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import { getSession, Session } from '../../lib/sessionService';
import { supabase } from '../../lib/supabaseClient';

interface Props {
  route?: {
    params: {
      sessionId: string;
      sessionName?: string;
    };
  };
  navigation?: any;
}

type LeaderboardRow = {
  user_id: string;
  points: number;
  profiles: {
    id: string;
    username: string | null;
    avatar_url: string | null;
  } | null;
};

type LeaderboardEntry = {
  userId: string;
  points: number;
  displayName: string;
  avatarUrl: string | null;
};

/**
 * Get display name from profile - matches chat logic
 * Note: Email is not stored in profiles table, so we only use username
 */
function getDisplayNameFromProfile(
  profile: LeaderboardRow['profiles'],
  userId: string
): string {
  if (profile?.username) {
    return profile.username;
  }
  // Fallback to shortened user ID
  return `User ${userId.slice(0, 8)}`;
}

export default function SessionLeaderboardScreen({ route, navigation }: Props) {
  const sessionId = route?.params?.sessionId;
  const sessionNameFromRoute = route?.params?.sessionName;

  const [session, setSession] = useState<Session | null>(null);
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionId) {
      loadData();
    }
  }, [sessionId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const sessionData = await getSession(sessionId);
      setSession(sessionData);

      // Fetch members with profiles join
      // NOTE: profiles.id is the primary key (references auth.users.id)
      // session_members.user_id references profiles.id
      const { data, error } = await supabase
        .from('session_members')
        .select(
          `
          user_id,
          points,
          profiles:user_id (
            id,
            username,
            avatar_url
          )
        `
        )
        .eq('session_id', sessionId)
        .order('points', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      const rows = (data ?? []) as LeaderboardRow[];

      // Map to leaderboard entries with display names matching chat logic
      const leaderboard = rows.map((row) => {
        const displayName = getDisplayNameFromProfile(row.profiles, row.user_id);

        return {
          userId: row.user_id,
          points: row.points ?? 0,
          displayName,
          avatarUrl: row.profiles?.avatar_url ?? null,
        };
      });

      setLeaderboardEntries(leaderboard);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#03CA59" />
          <Text style={styles.loadingText}>Loading leaderboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const displayName = sessionNameFromRoute || session?.name || 'Session';

  const renderLeaderboardItem = ({ item, index }: { item: LeaderboardEntry; index: number }) => {
    const rank = index + 1;
    const isFirst = rank === 1;
    const isLast = rank === leaderboardEntries.length && leaderboardEntries.length > 1;

    const initials =
      item.displayName && item.displayName.length > 0
        ? item.displayName[0].toUpperCase()
        : '?';

    return (
      <View
        style={[
          styles.rowCard,
          isFirst && styles.rowFirst,
          isLast && styles.rowLast,
        ]}
      >
        <Text style={styles.rankText}>#{rank}</Text>

        <View style={styles.userInfo}>
          {item.avatarUrl ? (
            <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarFallbackText}>{initials}</Text>
            </View>
          )}

          <View style={styles.nameAndTag}>
            <Text style={styles.displayNameText}>{item.displayName}</Text>
            {isLast && (
              <Text style={styles.dangerTag}>DANGER – at risk of the dare</Text>
            )}
          </View>
        </View>

        <View style={styles.pointsContainer}>
          <Text style={styles.pointsValue}>{item.points}</Text>
          <Text style={styles.pointsLabel}>pts</Text>
          {isFirst && (
            <Ionicons
              name="trophy"
              size={18}
              color="#FFD700"
              style={styles.crownIcon}
            />
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation?.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Leaderboard</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Session Name */}
      <View style={styles.sessionInfo}>
        <Text style={styles.sessionName}>{displayName}</Text>
      </View>

      {/* Leaderboard List */}
      <FlatList
        data={leaderboardEntries}
        keyExtractor={(item) => item.userId}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No members yet</Text>
          </View>
        }
        renderItem={renderLeaderboardItem}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617', // Dark background matching chat theme
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#9CA3AF',
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
    backgroundColor: '#020617',
  },
  backButton: {
    padding: 4,
  },
  placeholder: {
    width: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sessionInfo: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  sessionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: '#0B1220',
    marginBottom: 8,
  },
  rowFirst: {
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  rowLast: {
    borderWidth: 1,
    borderColor: '#c0392b',
  },
  rankText: {
    width: 34,
    fontWeight: '700',
    color: '#FFFFFF',
    fontSize: 15,
    textAlign: 'center',
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  avatarFallback: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginRight: 10,
    backgroundColor: '#2B2B3A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  avatarFallbackText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  nameAndTag: {
    flex: 1,
  },
  displayNameText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  dangerTag: {
    marginTop: 2,
    fontSize: 11,
    color: '#ff6b6b',
    fontWeight: '600',
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointsValue: {
    color: '#03CA59',
    fontWeight: '700',
    fontSize: 14,
    marginRight: 4,
  },
  pointsLabel: {
    color: '#03CA59',
    fontSize: 12,
    marginRight: 6,
  },
  crownIcon: {
    marginLeft: 2,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});


