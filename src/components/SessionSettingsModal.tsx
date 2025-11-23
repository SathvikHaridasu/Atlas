import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { leaveSession as leaveSessionService } from '../../lib/sessionService';
import { copyToClipboard } from '../../lib/clipboard';

interface SessionSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  sessionId: string;
  sessionName: string;
  sessionCode?: string;
  sessionWeekStart?: string;
  sessionWeekEnd?: string;
  onLeaveSuccess?: () => void;
  members?: Array<{ id: string; user_id: string; profiles?: { username?: string } }>;
  dares?: Array<{ id: string; dare_text: string; user_id: string }>;
  navigation?: any;
}

export const SessionSettingsModal: React.FC<SessionSettingsModalProps> = ({
  visible,
  onClose,
  sessionId,
  sessionName,
  sessionCode,
  sessionWeekStart,
  sessionWeekEnd,
  onLeaveSuccess,
  members = [],
  dares = [],
  navigation,
}) => {
  const { user } = useAuth();
  const [muteNotifications, setMuteNotifications] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const handleLeaveSession = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to leave a session.');
      return;
    }

    // Confirm before leaving
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
              Alert.alert('Success', `You left "${sessionName}"`);
              onClose();
              if (onLeaveSuccess) {
                onLeaveSuccess();
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

  const handleViewLeaderboard = () => {
    onClose();
    if (navigation) {
      navigation.navigate('SessionLeaderboard', {
        sessionId,
        sessionName,
      });
    }
  };

  const handleViewMembers = () => {
    // For now, show an alert with member count
    // Can be expanded to navigate to a dedicated members screen
    Alert.alert(
      'Members',
      `${sessionName} has ${members.length} member${members.length !== 1 ? 's' : ''}.`,
      [{ text: 'OK' }]
    );
  };

  const handleViewDares = () => {
    if (dares.length === 0) {
      Alert.alert('Submitted Dares', 'No dares have been submitted yet.', [{ text: 'OK' }]);
      return;
    }

    const daresText = dares.map((dare, index) => `${index + 1}. ${dare.dare_text}`).join('\n\n');
    Alert.alert(
      'Submitted Dares',
      daresText,
      [{ text: 'OK' }]
    );
  };

  const handleCopyJoinCode = async () => {
    if (!sessionCode) return;
    await copyToClipboard(sessionCode, 'Join code');
  };

  const handleReportSession = () => {
    // Placeholder - just log for now
    console.log('[REPORT SESSION]', { sessionId, sessionName });
    Alert.alert(
      'Report Session',
      'Report functionality will be available soon.',
      [{ text: 'OK' }]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Settings for {sessionName}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#111827" />
            </TouchableOpacity>
          </View>

          {/* Scrollable Content */}
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* Session Info Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Session Info</Text>
              
              {/* Join Code */}
              {sessionCode && (
                <TouchableOpacity
                  style={styles.infoRow}
                  onPress={handleCopyJoinCode}
                  activeOpacity={0.7}
                >
                  <View style={styles.infoRowContent}>
                    <Ionicons name="key-outline" size={22} color="#111827" />
                    <View style={styles.infoTextContainer}>
                      <Text style={styles.infoLabel}>Join Code</Text>
                      <Text style={styles.infoValue}>{sessionCode}</Text>
                    </View>
                  </View>
                  <Ionicons name="copy-outline" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              )}

              {/* Week Dates */}
              {sessionWeekStart && sessionWeekEnd && (
                <View style={styles.infoRow}>
                  <View style={styles.infoRowContent}>
                    <Ionicons name="calendar-outline" size={22} color="#111827" />
                    <View style={styles.infoTextContainer}>
                      <Text style={styles.infoLabel}>Week</Text>
                      <Text style={styles.infoValue}>
                        {sessionWeekStart} - {sessionWeekEnd}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* Navigation Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Actions</Text>
              
              {/* View Leaderboard */}
              <TouchableOpacity
                style={styles.option}
                onPress={handleViewLeaderboard}
              >
                <Ionicons name="trophy-outline" size={22} color="#111827" />
                <Text style={styles.optionText}>View Leaderboard</Text>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>

              {/* View Members */}
              <TouchableOpacity
                style={styles.option}
                onPress={handleViewMembers}
              >
                <Ionicons name="people-outline" size={22} color="#111827" />
                <Text style={styles.optionText}>View Members ({members.length})</Text>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>

              {/* View Submitted Dares */}
              <TouchableOpacity
                style={styles.option}
                onPress={handleViewDares}
              >
                <Ionicons name="list-outline" size={22} color="#111827" />
                <Text style={styles.optionText}>View Submitted Dares ({dares.length})</Text>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {/* Settings Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Settings</Text>
              
              {/* Mute Notifications */}
              <TouchableOpacity
                style={styles.option}
                onPress={() => setMuteNotifications(!muteNotifications)}
              >
                <Ionicons
                  name={muteNotifications ? "notifications-off-outline" : "notifications-outline"}
                  size={22}
                  color="#111827"
                />
                <Text style={styles.optionText}>Mute Notifications</Text>
                <View style={[
                  styles.toggle,
                  muteNotifications && styles.toggleActive
                ]}>
                  <View style={[
                    styles.toggleCircle,
                    muteNotifications && styles.toggleCircleActive
                  ]} />
                </View>
              </TouchableOpacity>

              {/* Report Session */}
              <TouchableOpacity
                style={styles.option}
                onPress={handleReportSession}
              >
                <Ionicons name="flag-outline" size={22} color="#111827" />
                <Text style={styles.optionText}>Report Session</Text>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Leave Session */}
            <TouchableOpacity
              style={[styles.option, styles.leaveOption]}
              onPress={handleLeaveSession}
              disabled={leaving}
            >
              {leaving ? (
                <ActivityIndicator color="#EF4444" size="small" />
              ) : (
                <Ionicons name="exit-outline" size={22} color="#EF4444" />
              )}
              <Text style={[styles.optionText, styles.leaveText]}>
                Leave Session
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34, // Safe area bottom
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  infoRowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  options: {
    paddingVertical: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  leaveOption: {
    marginTop: 8,
  },
  leaveText: {
    color: '#EF4444',
    fontWeight: '600',
  },
  toggle: {
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#D1D5DB',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: '#03CA59',
  },
  toggleCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
  },
  toggleCircleActive: {
    alignSelf: 'flex-end',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
    marginHorizontal: 20,
  },
});
