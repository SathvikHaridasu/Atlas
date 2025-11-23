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
import { useAuth } from '../../contexts/AuthContext';
import {
  getMessages,
  getSession,
  getSessionDares,
  getSessionMembers,
  listenToMembers,
  listenToMessages,
  Message,
  sendMessage,
  Session,
  SessionDare,
  SessionMember,
  submitDare
} from '../../lib/sessionService';

interface Props {
  route?: {
    params: {
      sessionId: string;
    };
  };
}

export default function SessionLobbyScreen({ route }: Props) {
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
  const [dareText, setDareText] = useState('');
  const [chatText, setChatText] = useState('');
  const [submittingDare, setSubmittingDare] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

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

  const handleSubmitDare = async () => {
    if (!dareText.trim()) {
      Alert.alert('Error', 'Please enter a dare');
      return;
    }

    if (!user) return;

    setSubmittingDare(true);
    try {
      await submitDare(user.id, sessionId, dareText.trim());
      setDareText('');
      Alert.alert('Success', 'Dare submitted!');
      loadData(); // Refresh dares
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setSubmittingDare(false);
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

  const hasUserSubmittedDare = dares.some(dare => dare.user_id === user?.id);

  const sortedMembers = [...members].sort((a, b) => b.points - a.points);

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

  const renderMessage = ({ item }: { item: Message }) => {
    return (
      <View style={[
        styles.messageItem,
        item.user_id === user?.id && styles.myMessage
      ]}>
        <Text style={styles.messageSender}>
          {item.profiles?.username || `User ${item.user_id.slice(0, 8)}`}
        </Text>
        <Text style={styles.messageContent}>{item.content}</Text>
        <Text style={styles.messageTime}>
          {new Date(item.created_at).toLocaleTimeString()}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.contentWrapper}>
            {/* Session Detail Section - Scrollable */}
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.header}>
                <Text style={styles.title}>{session.name}</Text>
                <Text style={styles.code}>Join Code: {session.code || session.join_code}</Text>
                <Text style={styles.dates}>
                  Week: {session.week_start} - {session.week_end}
                </Text>
              </View>

              <View style={styles.sessionContent}>
                <Text style={styles.sectionTitle}>Leaderboard</Text>
                {sortedMembers.map((member, index) => (
                  <View key={member.id} style={styles.memberItem}>
                    <Text style={styles.rank}>#{index + 1}</Text>
                    <Text style={styles.memberName}>User {member.user_id.slice(0, 8)}</Text>
                    <Text style={styles.points}>{member.points} pts</Text>
                  </View>
                ))}

                <Text style={styles.sectionTitle}>Members ({members.length})</Text>
                {members.map((member) => (
                  <Text key={member.id} style={styles.memberName}>
                    User {member.user_id.slice(0, 8)}
                  </Text>
                ))}

                {dares.length > 0 && (
                  <>
                    <Text style={styles.sectionTitle}>Submitted Dares ({dares.length})</Text>
                    {dares.map((dare) => (
                      <Text key={dare.id} style={styles.dareText}>
                        {dare.dare_text}
                      </Text>
                    ))}
                  </>
                )}
              </View>

              {/* Chat Section - Render messages as Views inside ScrollView */}
              <View style={styles.chatSection}>
                <Text style={styles.chatTitle}>Group Chat</Text>
                <View style={styles.messagesContainer}>
                  {messages.map((message) => (
                    <View key={message.id}>
                      {renderMessage({ item: message })}
                    </View>
                  ))}
                </View>
              </View>
            </ScrollView>

            {/* Fixed Bottom Inputs */}
            {!hasUserSubmittedDare && (
              <View style={styles.dareInputContainer}>
                <Text style={styles.dareInputLabel}>Submit Your Dare</Text>
                <View style={styles.dareInputRow}>
                  <TextInput
                    style={styles.dareInput}
                    placeholder="Enter your dare..."
                    placeholderTextColor="#9CA3AF"
                    value={dareText}
                    onChangeText={setDareText}
                    multiline
                  />
                  <TouchableOpacity
                    style={[styles.dareButton, submittingDare && styles.buttonDisabled]}
                    onPress={handleSubmitDare}
                    disabled={submittingDare || !dareText.trim()}
                  >
                    {submittingDare ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={styles.dareButtonText}>Submit</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Fixed Bottom Chat Input */}
            <View style={styles.chatInputContainer}>
              <TextInput
                style={styles.chatInput}
                placeholder="Type a message..."
                placeholderTextColor="#9CA3AF"
                value={chatText}
                onChangeText={setChatText}
                editable={!sendingMessage}
                multiline
              />
              <TouchableOpacity
                style={[styles.sendButton, (!chatText.trim() || sendingMessage) && styles.buttonDisabled]}
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
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 20,
  },
  sessionContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  chatSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginTop: 20,
  },
  chatTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  messagesContainer: {
    paddingBottom: 8,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  code: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 4,
    fontWeight: 'bold',
  },
  dates: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  memberItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 5,
  },
  rank: {
    fontWeight: 'bold',
  },
  memberName: {
    flex: 1,
    marginLeft: 10,
  },
  points: {
    fontWeight: 'bold',
    color: '#10B981',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 10,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#10B981',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  dareText: {
    backgroundColor: '#F3F4F6',
    padding: 10,
    borderRadius: 8,
    marginBottom: 5,
  },
  chatContainer: {
    height: 300,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    marginTop: 10,
  },
  messageItem: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    maxWidth: '80%',
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#DBEAFE',
  },
  messageSender: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6B7280',
    marginBottom: 4,
  },
  messageContent: {
    fontSize: 14,
    marginBottom: 4,
  },
  messageTime: {
    fontSize: 10,
    color: '#9CA3AF',
    alignSelf: 'flex-end',
  },
  dareInputContainer: {
    padding: 12,
    borderTopWidth: 0.5,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  dareInputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#111827',
  },
  dareInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  dareInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    minHeight: 40,
    maxHeight: 100,
    textAlignVertical: 'top',
  },
  dareButton: {
    backgroundColor: '#10B981',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: 'center',
    minHeight: 40,
  },
  dareButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 0.5,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  chatInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    fontSize: 14,
    marginRight: 8,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#10B981',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: 'center',
    minHeight: 40,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});