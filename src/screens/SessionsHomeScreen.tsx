import React, { useEffect, useState, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import { useAuth } from '../../contexts/AuthContext';
import { PillButton } from '../components/ui/PillButton';
import { NeonCard } from '../components/ui/NeonCard';
import {
  createSession,
  getUserSessions,
  joinSessionWithCode,
  leaveSession,
} from '../../lib/sessionService';
import { getGroupImageUrl } from '../../lib/storageService';

interface Session {
  id: string;
  name: string;
  status: string;
  created_by: string;
  code: string; // Database column is 'code'
  join_code?: string; // Alias for compatibility
  week_start?: string;
  week_end?: string;
}

interface SessionWithAvatar extends Session {
  groupImageUrl?: string | null;
}

// Alias to keep existing SessionWithProfile references working
type SessionWithProfile = SessionWithAvatar;

export default function SessionsHomeScreen({ navigation }: any) {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SessionWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const swipeableRefs = useRef<{ [key: string]: Swipeable | null }>({});

  useEffect(() => {
    if (user) {
      loadSessions();
    }
  }, [user]);

  const loadSessions = async () => {
    if (!user) return;

    try {
      const userSessions = await getUserSessions(user.id);

      // Load group images for each session
      const sessionsWithAvatars: SessionWithAvatar[] = await Promise.all(
        userSessions.map(async (session: Session) => {
          const groupImageUrl = await getGroupImageUrl(session.id);
          return { ...session, groupImageUrl };
        })
      );

      setSessions(sessionsWithAvatars);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = () => {
    setCreateModalVisible(true);
  };

  const handleJoinSession = () => {
    setJoinModalVisible(true);
  };

  const handleCreateSubmit = async () => {
    if (!sessionName.trim()) {
      Alert.alert('Error', 'Please enter chat name');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in');
      return;
    }

    setModalLoading(true);
    try {
      const session = await createSession(sessionName.trim());
      setCreateModalVisible(false);
      setSessionName('');
      navigation.navigate('SessionLobby', { sessionId: session.id });
      loadSessions(); // Refresh list
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create chat');
    } finally {
      setModalLoading(false);
    }
  };

  const handleJoinSubmit = async () => {
    // Normalize the code: trim whitespace, convert to uppercase
    const normalizedCode = joinCode.trim().toUpperCase();

    // Validate exactly 6 characters
    if (normalizedCode.length !== 6) {
      Alert.alert('Error', 'Join code must be exactly 6 characters');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in');
      return;
    }

    setModalLoading(true);
    try {
      const session = await joinSessionWithCode(user.id, normalizedCode);
      setJoinModalVisible(false);
      setJoinCode('');
      navigation.navigate('SessionLobby', { sessionId: session.id });
      loadSessions(); // Refresh list
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.message || 'Failed to join chat. Please check the code and try again.'
      );
    } finally {
      setModalLoading(false);
    }
  };

  const handleSessionPress = (session: SessionWithProfile) => {
    navigation.navigate('SessionLobby', { sessionId: session.id });
  };

  const handleLeaveChat = async (chat: SessionWithProfile) => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in');
      return;
    }

    // Close swipeable if open
    swipeableRefs.current[chat.id]?.close();

    Alert.alert('Leave Chat', `Are you sure you want to leave "${chat.name}"?`, [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: async () => {
          try {
            await leaveSession(chat.id, user.id);
            // Remove from local list
            setSessions((prev) => prev.filter((s) => s.id !== chat.id));
          } catch (error: any) {
            console.error('Failed to leave chat', error);
            Alert.alert('Error', error.message || 'Could not leave chat.');
          }
        },
      },
    ]);
  };

  const getSessionInitial = (name: string): string => {
    return name.charAt(0).toUpperCase() || 'C';
  };

  const formatDateRange = (start?: string, end?: string): string => {
    if (!start || !end) return '';
    try {
      const startDate = new Date(start);
      const endDate = new Date(end);
      const startFormatted = startDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      const endFormatted = endDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      return `${startFormatted} - ${endFormatted}`;
    } catch {
      return `${start} - ${end}`;
    }
  };

  const renderRightActions = (session: SessionWithProfile) => (
    <TouchableOpacity style={styles.swipeDelete} onPress={() => handleLeaveChat(session)}>
      <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
      <Text style={styles.swipeDeleteText}>Leave</Text>
    </TouchableOpacity>
  );

  const renderChatItem = ({ item }: { item: SessionWithProfile }) => {
    const avatarUrl = item.groupImageUrl || null;
    const initial = getSessionInitial(item.name);
    const dateRange = formatDateRange(item.week_start, item.week_end);

    return (
      <Swipeable
        ref={(ref) => {
          if (ref) {
            swipeableRefs.current[item.id] = ref;
          }
        }}
        renderRightActions={() => renderRightActions(item)}
        rightThreshold={40}
      >
        <NeonCard
          onPress={() => handleSessionPress(item)}
          style={styles.chatCard}
        >
          <View style={styles.chatCardInner}>
            {/* Left accent dot */}
            <View style={styles.accentDot} />
            
            {/* Left avatar */}
            <View style={styles.avatarContainer}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} contentFit="cover" />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarInitial}>{initial}</Text>
                </View>
              )}
            </View>

            {/* Middle text */}
            <View style={styles.chatTextContainer}>
              <Text style={styles.chatName}>{item.name}</Text>
              <Text style={styles.chatCode}>Join Code: {item.code || item.join_code}</Text>
              {dateRange && <Text style={styles.chatDates}>{dateRange}</Text>}
            </View>

            {/* Right arrow */}
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </View>
        </NeonCard>
      </Swipeable>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" />
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#03CA59" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" />

      <View style={styles.container}>
        <View style={styles.buttonRow}>
          <PillButton
            label="Create Chat"
            onPress={handleCreateSession}
            variant="primary"
            style={styles.buttonWrapper}
          />
          <PillButton
            label="Join Chat"
            onPress={handleJoinSession}
            variant="blue"
            style={styles.buttonWrapper}
          />
        </View>

        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id}
          renderItem={renderChatItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No chats yet. Create or join one!</Text>
            </View>
          }
        />
      </View>

      {/* Create Chat Modal */}
      <Modal
        visible={createModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create Chat</Text>

            <TextInput
              style={styles.input}
              placeholder="Chat Name"
              placeholderTextColor="#6B7280"
              value={sessionName}
              onChangeText={setSessionName}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setCreateModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalPrimaryButton,
                  modalLoading && styles.buttonDisabled,
                ]}
                onPress={handleCreateSubmit}
                disabled={modalLoading}
              >
                {modalLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalButtonText}>Create</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Join Chat Modal */}
      <Modal
        visible={joinModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setJoinModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Join Chat</Text>

            <TextInput
              style={styles.input}
              placeholder="6-character join code"
              placeholderTextColor="#6B7280"
              value={joinCode}
              onChangeText={(text) => setJoinCode(text.toUpperCase().slice(0, 6))}
              maxLength={6}
              autoCapitalize="characters"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setJoinModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalPrimaryButton,
                  modalLoading && styles.buttonDisabled,
                ]}
                onPress={handleJoinSubmit}
                disabled={modalLoading || joinCode.trim().length !== 6}
              >
                {modalLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalButtonText}>Join</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000',
  },
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#F9FAFB',
    marginTop: 12,
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: 12,
    gap: 12,
  },
  buttonWrapper: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  chatCard: {
    marginBottom: 12,
    width: '100%',
    alignSelf: 'stretch',
  },
  chatCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: -18,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  accentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(3, 202, 89, 0.4)',
    marginRight: 12,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#111827',
  },
  avatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#03CA59',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  chatTextContainer: {
    flex: 1,
  },
  // Legacy session styles (kept to avoid changing anything else, even if unused now)
  sessionItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sessionItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sessionAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sessionAvatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    backgroundColor: '#03CA59',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sessionAvatarInitial: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  sessionInfo: {
    flex: 1,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  chatCode: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 4,
  },
  chatDates: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 4,
  },
  swipeDelete: {
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderRadius: 18,
    marginRight: 20,
    marginTop: 12,
  },
  swipeDeleteText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#9CA3AF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#0B1220',
    borderRadius: 18,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F9FAFB',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#1F2937',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: '#020617',
    color: '#F9FAFB',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    borderRadius: 12,
    padding: 14,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  modalPrimaryButton: {
    backgroundColor: '#03CA59',
  },
  cancelButton: {
    backgroundColor: '#374151',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});