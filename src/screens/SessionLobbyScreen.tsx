import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import {
  getMessages,
  getSession,
  getSessionDares,
  getSessionMembers,
  leaveSession,
  listenToMembers,
  listenToMessages,
  Message,
  sendMessage,
  Session,
  SessionDare,
  SessionMember,
  submitDare
} from '../../lib/sessionService';
import { ChatMessageBubble } from '../components/ChatMessageBubble';
import { SessionSettingsModal } from '../components/SessionSettingsModal';

interface Props {
  route?: {
    params: {
      sessionId: string;
    };
  };
  navigation?: any;
}

export default function SessionLobbyScreen({ route, navigation }: Props) {
  const { user } = useAuth();
  const sessionId = route?.params?.sessionId;

  if (!sessionId) {
    return (
      <View style={styles.center}>
        <Text>Session ID missing</Text>
      </View>
    );
  }

  const [session, setSession] = useState<Session | null>(null);
  const [members, setMembers] = useState<SessionMember[]>([]);
  const [dares, setDares] = useState<SessionDare[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatText, setChatText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);

  useEffect(() => {
    loadData();
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;

    // Set up realtime subscriptions
    const unsubscribeMembers = listenToMembers(sessionId, (updatedMembers) => {
      setMembers(updatedMembers);
    });

    const unsubscribeMessages = listenToMessages(sessionId, (updatedMessages) => {
      setMessages(updatedMessages);
    });

    return () => {
      unsubscribeMembers();
      unsubscribeMessages();
    };
  }, [sessionId]);

  const loadData = async () => {
    try {
      const [sessionData, membersData, daresData, messagesData] = await Promise.all([
        getSession(sessionId),
        getSessionMembers(sessionId),
        getSessionDares(sessionId),
        getMessages(sessionId),
      ]);
      setSession(sessionData);
      setMembers(membersData);
      setDares(daresData);
      setMessages(messagesData);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!chatText.trim()) return;

    if (!user) return;

    setSendingMessage(true);
    try {
      await sendMessage(sessionId, user.id, chatText.trim());
      setChatText('');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleLeaveSession = async () => {
    if (!user || !session) return;

    try {
      await leaveSession(sessionId, user.id);
      setSettingsModalVisible(false);
      // Navigate back to sessions list
      if (navigation) {
        navigation.goBack();
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to leave session');
    }
  };

  // Helper function to get display name from message
  const getSenderName = (message: Message): string => {
    const profile = message.profiles;
    if (profile?.username) {
      return profile.username;
    }
    if (profile?.email) {
      return profile.email.split('@')[0];
    }
    // Fallback to shortened user ID
    return `User ${message.user_id.slice(0, 8)}`;
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!session) {
    return (
      <View style={styles.center}>
        <Text>Session not found</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.contentWrapper}>
            {/* Instagram-style Header: Back + Session Name + Settings */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation?.goBack()}
              >
                <Ionicons name="arrow-back" size={24} color="#111827" />
              </TouchableOpacity>
              <Text style={styles.title} numberOfLines={1}>
                {session.name}
              </Text>
              <TouchableOpacity
                style={styles.settingsButton}
                onPress={() => setSettingsModalVisible(true)}
              >
                <Ionicons name="settings-outline" size={24} color="#111827" />
              </TouchableOpacity>
            </View>

            {/* Chat Section - Dark Instagram DM-style */}
            <ScrollView
              style={styles.chatScrollView}
              contentContainerStyle={styles.chatScrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.chatSection}>
                <View style={styles.messagesContainer}>
                  {messages.map((message) => {
                    const isOwn = message.user_id === user?.id;
                    const senderName = getSenderName(message);
                    return (
                      <ChatMessageBubble
                        key={message.id}
                        message={message}
                        isOwn={isOwn}
                        senderName={senderName}
                      />
                    );
                  })}
                  {messages.length === 0 && (
                    <Text style={styles.emptyChatText}>
                      No messages yet. Start the conversation!
                    </Text>
                  )}
                </View>
              </View>
            </ScrollView>

            {/* Fixed Bottom Chat Input - Dark themed */}
            <View style={styles.chatInputContainer}>
              <View style={styles.chatInputWrapper}>
                <TextInput
                  style={styles.chatInput}
                  placeholder="Message..."
                  placeholderTextColor="#6B7280"
                  value={chatText}
                  onChangeText={setChatText}
                  editable={!sendingMessage}
                  multiline
                />
                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    (!chatText.trim() || sendingMessage) && styles.buttonDisabled
                  ]}
                  onPress={handleSendMessage}
                  disabled={sendingMessage || !chatText.trim()}
                >
                  {sendingMessage ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.sendButtonText}>Send</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {/* Session Settings Modal */}
      <SessionSettingsModal
        visible={settingsModalVisible}
        onClose={() => setSettingsModalVisible(false)}
        sessionId={sessionId}
        sessionName={session.name}
        sessionCode={session.code || session.join_code || ''}
        sessionWeekStart={session.week_start || ''}
        sessionWeekEnd={session.week_end || ''}
        onLeaveSuccess={handleLeaveSession}
        members={members}
        dares={dares}
        navigation={navigation}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  contentWrapper: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 4,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    color: '#111827',
    marginHorizontal: 8,
  },
  settingsButton: {
    padding: 4,
  },
  chatScrollView: {
    flex: 1,
  },
  chatScrollContent: {
    flexGrow: 1,
  },
  chatSection: {
    flex: 1,
    backgroundColor: '#020617', // Dark background for chat section
    paddingTop: 12,
    paddingBottom: 12,
    minHeight: '100%',
  },
  messagesContainer: {
    paddingBottom: 8,
    paddingHorizontal: 0,
  },
  emptyChatText: {
    textAlign: 'center',
    color: '#6B7280', // Muted gray text on dark background
    fontSize: 14,
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatInputContainer: {
    backgroundColor: '#020617', // Dark background matching chat section
    paddingHorizontal: 12,
    paddingVertical: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#1F2937', // Subtle border
  },
  chatInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937', // Dark gray container for input
    borderRadius: 24,
    paddingHorizontal: 4,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#374151', // Subtle border
  },
  chatInput: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 15,
    color: '#FFFFFF', // White text
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#03CA59', // Brand green
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: 'center',
    minHeight: 40,
    minWidth: 60,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
