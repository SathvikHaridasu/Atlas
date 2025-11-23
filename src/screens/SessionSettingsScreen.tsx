import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { leaveSession as leaveSessionService, getSessionMembers, SessionMember } from '../../lib/sessionService';
import { copyToClipboard } from '../../lib/clipboard';

interface Props {
  route?: {
    params: {
      sessionId: string;
      sessionName: string;
      sessionCode: string;
      sessionWeekStart?: string;
      sessionWeekEnd?: string;
    };
  };
  navigation?: any;
}

export default function SessionSettingsScreen({ route, navigation }: Props) {
  const { user } = useAuth();
  const sessionId = route?.params?.sessionId;
  const sessionName = route?.params?.sessionName || 'Session';
  const sessionCode = route?.params?.sessionCode || '';
  const sessionWeekStart = route?.params?.sessionWeekStart;
  const sessionWeekEnd = route?.params?.sessionWeekEnd;

  const [members, setMembers] = useState<SessionMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (sessionId) {
      loadMembers();
    }
  }, [sessionId]);

  const loadMembers = async () => {
    try {
      const membersData = await getSessionMembers(sessionId);
      setMembers(membersData);
    } catch (error: any) {
      console.error('Error loading members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyJoinCode = async () => {
    if (!sessionCode) return;
    await copyToClipboard(sessionCode, 'Join code');
  };

  const handleViewLeaderboard = () => {
    if (navigation) {
      navigation.navigate('SessionLeaderboard', {
        sessionId,
        sessionName,
      });
    }
  };

  const handleViewMembers = () => {
    // Show member count in alert for now
    Alert.alert(
      'Members',
      `${sessionName} has ${members.length} member${members.length !== 1 ? 's' : ''}.`,
      [{ text: 'OK' }]
    );
  };

  const handleLeaveSession = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to leave a session.');
      return;
    }

    Alert.alert(
      'Leave Session',
      `Are you sure you want to leave "${sessionName}"? You won't be able to see messages or participate until you rejoin.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            setLeaving(true);
            try {
              await leaveSessionService(sessionId, user.id);
              if (navigation) {
                navigation.goBack(); // Go back to chat screen
                navigation.goBack(); // Then go back to sessions list
              }
            } catch (error: any) {
              console.error('[LEAVE SESSION] error', error);
              Alert.alert('Error', error.message || 'Failed to leave session. Please try again.');
            } finally {
              setLeaving(false);
            }
          },
        },
      ]
    );
  };

  const getSessionInitial = (name: string): string => {
    return name.charAt(0).toUpperCase();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Instagram-style Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation?.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Session Info</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Top Section - Big Avatar + Name */}
        <View style={styles.topSection}>
          <View style={styles.bigAvatar}>
            <Text style={styles.bigAvatarText}>
              {getSessionInitial(sessionName)}
            </Text>
          </View>
          <Text style={styles.sessionName}>{sessionName}</Text>
          <Text style={styles.sessionSubtitle}>Session chat</Text>
        </View>

        {/* Settings Rows */}
        <View style={styles.settingsSection}>
          {/* Join Code Row - Prominently Displayed */}
          <TouchableOpacity
            style={styles.settingsRow}
            onPress={handleCopyJoinCode}
            activeOpacity={0.7}
          >
            <View style={styles.settingsRowLeft}>
              <Ionicons name="key-outline" size={24} color="#FFFFFF" />
              <View style={styles.settingsRowText}>
                <Text style={styles.settingsRowTitle}>Join Code</Text>
                <Text style={styles.settingsRowSubtitle}>{sessionCode}</Text>
              </View>
            </View>
            <Ionicons name="copy-outline" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Week Dates */}
          {sessionWeekStart && sessionWeekEnd && (
            <View style={styles.settingsRow}>
              <View style={styles.settingsRowLeft}>
                <Ionicons name="calendar-outline" size={24} color="#FFFFFF" />
                <View style={styles.settingsRowText}>
                  <Text style={styles.settingsRowTitle}>Week</Text>
                  <Text style={styles.settingsRowSubtitle}>
                    {sessionWeekStart} - {sessionWeekEnd}
                  </Text>
                </View>
              </View>
            </View>
          )}

          <View style={styles.divider} />

          {/* View Leaderboard */}
          <TouchableOpacity
            style={styles.settingsRow}
            onPress={handleViewLeaderboard}
          >
            <View style={styles.settingsRowLeft}>
              <Ionicons name="trophy-outline" size={24} color="#FFFFFF" />
              <Text style={styles.settingsRowTitle}>View Leaderboard</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          {/* View Members */}
          <TouchableOpacity
            style={styles.settingsRow}
            onPress={handleViewMembers}
          >
            <View style={styles.settingsRowLeft}>
              <Ionicons name="people-outline" size={24} color="#FFFFFF" />
              <Text style={styles.settingsRowTitle}>
                View Members ({members.length})
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Mute Notifications (Placeholder) */}
          <View style={styles.settingsRow}>
            <View style={styles.settingsRowLeft}>
              <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
              <Text style={styles.settingsRowTitle}>Mute Notifications</Text>
            </View>
            <View style={styles.toggle}>
              <View style={styles.toggleCircle} />
            </View>
          </View>

          {/* Report Session (Placeholder) */}
          <TouchableOpacity style={styles.settingsRow}>
            <View style={styles.settingsRowLeft}>
              <Ionicons name="flag-outline" size={24} color="#FFFFFF" />
              <Text style={styles.settingsRowTitle}>Report Session</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Leave Session Button */}
        <TouchableOpacity
          style={[styles.leaveButton, leaving && styles.leaveButtonDisabled]}
          onPress={handleLeaveSession}
          disabled={leaving}
        >
          {leaving ? (
            <ActivityIndicator color="#EF4444" size="small" />
          ) : (
            <Text style={styles.leaveButtonText}>Leave Session</Text>
          )}
        </TouchableOpacity>

        {/* Something isn't working */}
        <TouchableOpacity style={styles.helpRow}>
          <Text style={styles.helpText}>Something isn't working</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#020617',
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerPlaceholder: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  topSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  bigAvatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#03CA59',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  bigAvatarText: {
    color: '#FFFFFF',
    fontSize: 40,
    fontWeight: '600',
  },
  sessionName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  sessionSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  settingsSection: {
    paddingVertical: 8,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#020617',
  },
  settingsRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingsRowText: {
    marginLeft: 12,
    flex: 1,
  },
  settingsRowTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  settingsRowSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#1F2937',
    marginVertical: 4,
    marginHorizontal: 20,
  },
  toggle: {
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#374151',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
  },
  leaveButton: {
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 16,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leaveButtonDisabled: {
    opacity: 0.5,
  },
  leaveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  helpRow: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },
  helpText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});

