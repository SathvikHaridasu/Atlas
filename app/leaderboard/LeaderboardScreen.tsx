import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useAppTheme } from '../../src/contexts/ThemeContext';
import {
  getSession,
  getSessionMembers,
  listenToMembers,
  Session,
  SessionMember,
} from '../../lib/sessionService';
import { supabase } from '../../lib/supabaseClient';

interface LeaderboardScreenProps {
  navigation?: any;
  route?: {
    params?: {
      sessionId?: string;
      sessionName?: string;
    };
  };
}

interface LeaderboardUser {
  id: string;
  userId: string;
  username: string;
  points: number;
  avatar: string | null;
  isCurrentUser: boolean;
}

export default function LeaderboardScreen({
  navigation,
  route,
}: LeaderboardScreenProps = {}) {
  const { user } = useAuth();
  const { theme } = useAppTheme();
  const sessionId = route?.params?.sessionId;
  const sessionNameFromRoute = route?.params?.sessionName;

  const [session, setSession] = useState<Session | null>(null);
  const [members, setMembers] = useState<SessionMember[]>([]);
  const [leaderboardUsers, setLeaderboardUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.5)).current;

  // Fetch session members and their profiles
  const loadLeaderboardData = async () => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [sessionData, membersData] = await Promise.all([
        getSession(sessionId),
        getSessionMembers(sessionId),
      ]);

      setSession(sessionData);
      setMembers(membersData);

      // Fetch profiles for all members
      const userIds = membersData.map((m) => m.user_id);
      if (userIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, username, avatar_url, full_name')
          .in('user_id', userIds);

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
        }

        // Combine members with their profile data
        const usersWithProfiles: LeaderboardUser[] = membersData.map((member) => {
          const profile = profiles?.find((p) => p.user_id === member.user_id);
          const username =
            profile?.username ||
            profile?.full_name ||
            (profile?.user_id ? `User ${profile.user_id.slice(0, 8)}` : 'Unknown User');
          const avatar = profile?.avatar_url || null;

          return {
            id: member.id,
            userId: member.user_id,
            username,
            points: member.points,
            avatar,
            isCurrentUser: member.user_id === user?.id,
          };
        });

        // Sort by points (descending)
        usersWithProfiles.sort((a, b) => b.points - a.points);
        setLeaderboardUsers(usersWithProfiles);
      } else {
        setLeaderboardUsers([]);
      }
    } catch (error: any) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sessionId) {
      loadLeaderboardData();

      // Set up real-time subscription for member changes
      const unsubscribe = listenToMembers(sessionId, async (updatedMembers) => {
        setMembers(updatedMembers);

        // Update leaderboard with new member data
        const userIds = updatedMembers.map((m) => m.user_id);
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, username, avatar_url, full_name')
            .in('user_id', userIds);

          const usersWithProfiles: LeaderboardUser[] = updatedMembers.map((member) => {
            const profile = profiles?.find((p) => p.user_id === member.user_id);
            const username =
              profile?.username ||
              profile?.full_name ||
              (profile?.user_id ? `User ${profile.user_id.slice(0, 8)}` : 'Unknown User');
            const avatar = profile?.avatar_url || null;

            return {
              id: member.id,
              userId: member.user_id,
              username,
              points: member.points,
              avatar,
              isCurrentUser: member.user_id === user?.id,
            };
          });

          usersWithProfiles.sort((a, b) => b.points - a.points);
          setLeaderboardUsers(usersWithProfiles);
        } else {
          setLeaderboardUsers([]);
        }
      });

      return () => {
        unsubscribe();
      };
    } else {
      // No sessionId - show empty state
      setLoading(false);
      setLeaderboardUsers([]);
    }
  }, [sessionId, user?.id]);

  const handleBack = () => {
    if (navigation) {
      navigation.goBack();
    }
  };

  // Animate crown glow for first place
  useEffect(() => {
    const glowAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.5,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    glowAnimation.start();

    return () => glowAnimation.stop();
  }, []);

  // Animate pulsing for last place
  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    return () => pulseAnimation.stop();
  }, []);

  const renderLeaderboardItem = ({ item, index }: { item: LeaderboardUser; index: number }) => {
    const isFirstPlace = index === 0;
    const isLastPlace = index === leaderboardUsers.length - 1 && leaderboardUsers.length > 1;
    const rank = index + 1;

    const glowOpacity = glowAnim.interpolate({
      inputRange: [0.5, 1],
      outputRange: [0.3, 0.7],
    });

    return (
      <Animated.View
        style={[
          styles.card,
          {
            backgroundColor: theme.card,
            borderColor: isFirstPlace
              ? '#FFD700'
              : isLastPlace
              ? '#EF4444'
              : theme.border,
            borderWidth: isFirstPlace || isLastPlace ? 2 : 1,
            transform: isLastPlace ? [{ scale: pulseAnim }] : undefined,
            shadowColor: isFirstPlace ? '#FFD700' : isLastPlace ? '#EF4444' : '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isFirstPlace ? 0.4 : isLastPlace ? 0.3 : 0.1,
            shadowRadius: isFirstPlace ? 8 : isLastPlace ? 6 : 4,
            elevation: isFirstPlace ? 8 : isLastPlace ? 6 : 3,
          },
        ]}
      >
        {/* First place golden glow effect */}
        {isFirstPlace && (
          <Animated.View
            style={[
              styles.glowOverlay,
              {
                opacity: glowOpacity,
                backgroundColor: '#FFD700',
              },
            ]}
            pointerEvents="none"
          />
        )}

        {/* Crown icon for first place */}
        {isFirstPlace && (
          <View style={styles.crownContainer}>
            <Animated.View
              style={[
                styles.crownWrapper,
                {
                  opacity: glowAnim,
                },
              ]}
            >
              <MaterialIcons name="emoji-events" size={32} color="#FFD700" />
            </Animated.View>
          </View>
        )}

        {/* Last place warning label */}
        {isLastPlace && (
          <View style={styles.warningLabel}>
            <Ionicons name="warning" size={16} color="#EF4444" />
            <Text style={styles.warningText}>Risk of Dare</Text>
          </View>
        )}

        <View style={styles.cardContent}>
          {/* Rank */}
          <View style={styles.rankContainer}>
            <Text
              style={[
                styles.rankText,
                {
                  color: isFirstPlace ? '#FFD700' : isLastPlace ? '#EF4444' : theme.text,
                },
              ]}
            >
              #{rank}
            </Text>
          </View>

          {/* Avatar */}
          <View style={styles.avatarContainer}>
            {item.avatar ? (
              <Image source={{ uri: item.avatar }} style={styles.avatar} contentFit="cover" />
            ) : (
              <View
                style={[
                  styles.avatar,
                  styles.avatarPlaceholder,
                  { backgroundColor: theme.border },
                ]}
              >
                <Text style={[styles.avatarInitial, { color: theme.text }]}>
                  {item.username.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            {isFirstPlace && (
              <View style={styles.avatarBadge}>
                <MaterialIcons name="star" size={12} color="#FFD700" />
              </View>
            )}
            {item.isCurrentUser && (
              <View style={[styles.currentUserBadge, { backgroundColor: theme.accent }]}>
                <Text style={styles.currentUserBadgeText}>You</Text>
              </View>
            )}
          </View>

          {/* User Info */}
          <View style={styles.userInfo}>
            <Text
              style={[
                styles.username,
                {
                  color: theme.text,
                  fontWeight: isFirstPlace ? '700' : '600',
                },
              ]}
            >
              {item.username}
            </Text>
            {isFirstPlace && (
              <Text style={styles.championLabel}>🏆 Champion</Text>
            )}
          </View>

          {/* Points */}
          <View style={styles.pointsContainer}>
            <Text
              style={[
                styles.pointsText,
                {
                  color: isFirstPlace ? '#FFD700' : isLastPlace ? '#EF4444' : theme.accent,
                },
              ]}
            >
              {item.points.toLocaleString()}
            </Text>
            <Text style={[styles.pointsLabel, { color: theme.mutedText }]}>pts</Text>
          </View>
        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={['top', 'left', 'right']}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Leaderboard</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Session Name */}
      {(sessionNameFromRoute || session?.name) && (
        <View style={[styles.sessionInfo, { borderBottomColor: theme.border }]}>
          <Text style={[styles.sessionName, { color: theme.text }]}>
            {sessionNameFromRoute || session?.name || 'Session'}
          </Text>
          <Text style={[styles.memberCount, { color: theme.mutedText }]}>
            {leaderboardUsers.length} {leaderboardUsers.length === 1 ? 'member' : 'members'}
          </Text>
        </View>
      )}

      {/* Leaderboard List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={[styles.loadingText, { color: theme.mutedText }]}>
            Loading leaderboard...
          </Text>
        </View>
      ) : leaderboardUsers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="leaderboard" size={64} color={theme.mutedText} />
          <Text style={[styles.emptyText, { color: theme.mutedText }]}>
            {sessionId ? 'No members yet' : 'No session selected'}
          </Text>
          <Text style={[styles.emptySubtext, { color: theme.mutedText }]}>
            {sessionId
              ? 'Members will appear here once they join'
              : 'Join or create a session to see the leaderboard'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={leaderboardUsers}
          renderItem={renderLeaderboardItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  headerRight: {
    width: 32,
  },
  sessionInfo: {
    padding: 16,
    borderBottomWidth: 1,
  },
  sessionName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  memberCount: {
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
    paddingTop: 20,
  },
  card: {
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  glowOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
  },
  crownContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
  },
  crownWrapper: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 20,
    padding: 4,
  },
  warningLabel: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 10,
  },
  warningText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#EF4444',
    marginLeft: 4,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  rankContainer: {
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: 20,
    fontWeight: '800',
  },
  avatarContainer: {
    marginLeft: 8,
    marginRight: 12,
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 20,
    fontWeight: '700',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  currentUserBadge: {
    position: 'absolute',
    top: -4,
    left: -4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  currentUserBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#000',
  },
  userInfo: {
    flex: 1,
    marginLeft: 8,
  },
  username: {
    fontSize: 16,
    marginBottom: 2,
  },
  championLabel: {
    fontSize: 12,
    color: '#FFD700',
    fontWeight: '600',
    marginTop: 2,
  },
  pointsContainer: {
    alignItems: 'flex-end',
  },
  pointsText: {
    fontSize: 20,
    fontWeight: '800',
  },
  pointsLabel: {
    fontSize: 12,
    marginTop: 2,
  },
});

