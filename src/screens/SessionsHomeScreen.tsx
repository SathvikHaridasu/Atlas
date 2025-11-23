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
import { Ionicons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import { useAuth } from '../../contexts/AuthContext';
import { PillButton } from '../components/ui/PillButton';
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
        <TouchableOpacity
          style={styles.chatItem}
          onPress={() => handleSessionPress(item)}
          activeOpacity={0.8}
        >
          {/* Avatar + status dot */}
          <View style={styles.avatarWrapper}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarCircle} contentFit="cover" />
            ) : (
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitial}>{initial}</Text>
              </View>
            )}
            {/* Optional: status dot for active chats */}
            {/* <View style={styles.statusDot} /> */}
          </View>

          {/* Text content */}
          <View style={styles.chatTextContainer}>
            <Text style={styles.chatTitle} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.chatSubtitle} numberOfLines={1}>
              Join Code: {item.code || item.join_code}
            </Text>
            {dateRange && (
              <Text style={styles.chatMeta} numberOfLines={1}>
                {dateRange}
              </Text>
            )}
          </View>

          {/* Right chevron */}
          <View style={styles.chatRight}>
            <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.5)" />
          </View>
        </TouchableOpacity>
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
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft} />
          <Text style={styles.headerTitle}>Chats</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Create/Join buttons */}
        <View style={styles.actionRow}>
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

        {/* Chats list */}
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id}
          renderItem={renderChatItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 10,
  },
  headerLeft: {
    width: 24,
  },
  headerRight: {
    width: 24,
    alignItems: 'flex-end',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
  },
  buttonWrapper: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#050A0E',
    marginBottom: 6,
  },
  avatarWrapper: {
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#03CA59',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 18,
  },
  statusDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#03CA59',
    borderWidth: 2,
    borderColor: '#000000',
  },
  chatTextContainer: {
    flex: 1,
  },
  chatTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  chatSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    marginBottom: 1,
  },
  chatMeta: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
  },
  chatRight: {
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
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