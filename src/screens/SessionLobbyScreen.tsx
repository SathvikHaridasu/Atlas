import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
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
    if (sessionId) {
      const unsubscribeMembers = listenToMembers(sessionId, (updatedMembers) => {
        setMembers(updatedMembers);
      });

      const unsubscribeMessages = listenToMessages(sessionId, setMessages);

      return () => {
        unsubscribeMembers();
        unsubscribeMessages();
      };
    }
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

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <View style={styles.header}>
        <Text style={styles.title}>{session.name}</Text>
        <Text style={styles.code}>Join Code: {session.join_code}</Text>
        <Text style={styles.dates}>
          Week: {session.week_start} - {session.week_end}
        </Text>
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
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
        )}
        ListHeaderComponent={() => (
          <View style={styles.sessionContent}>
            <Text style={styles.sectionTitle}>Leaderboard</Text>
            <FlatList
              data={sortedMembers}
              keyExtractor={(item) => item.id}
              renderItem={({ item, index }) => (
                <View style={styles.memberItem}>
                  <Text style={styles.rank}>#{index + 1}</Text>
                  <Text style={styles.memberName}>User {item.user_id.slice(0, 8)}</Text>
                  <Text style={styles.points}>{item.points} pts</Text>
                </View>
              )}
              scrollEnabled={false}
            />

            <Text style={styles.sectionTitle}>Members ({members.length})</Text>
            {members.map((member) => (
              <Text key={member.id} style={styles.memberName}>
                User {member.user_id.slice(0, 8)}
              </Text>
            ))}

            {!hasUserSubmittedDare && (
              <>
                <Text style={styles.sectionTitle}>Submit Your Dare</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your dare..."
                  value={dareText}
                  onChangeText={setDareText}
                  multiline
                />
                <TouchableOpacity
                  style={[styles.button, submittingDare && styles.buttonDisabled]}
                  onPress={handleSubmitDare}
                  disabled={submittingDare}
                >
                  {submittingDare ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.buttonText}>Submit Dare</Text>
                  )}
                </TouchableOpacity>
              </>
            )}

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

            <Text style={styles.chatTitle}>Group Chat</Text>
          </View>
        )}
        ListFooterComponent={() => (
          <View style={styles.chatInputContainer}>
            <TextInput
              style={styles.chatInput}
              placeholder="Type a message..."
              value={chatText}
              onChangeText={setChatText}
              editable={!sendingMessage}
            />
            <TouchableOpacity
              style={[styles.sendButton, sendingMessage && styles.buttonDisabled]}
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
        )}
        contentContainerStyle={styles.messagesList}
        inverted={true}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sessionContent: {
    padding: 20,
  },
  chatSection: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  chatTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    padding: 15,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  content: {
    padding: 20,
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
  messagesList: {
    flex: 1,
    padding: 10,
  },
  messageItem: {
    backgroundColor: '#F9FAFB',
    padding: 8,
    borderRadius: 8,
    marginBottom: 5,
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
    marginBottom: 2,
  },
  messageContent: {
    fontSize: 14,
    marginBottom: 2,
  },
  messageTime: {
    fontSize: 10,
    color: '#9CA3AF',
    alignSelf: 'flex-end',
  },
  chatInputContainer: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#D1D5DB',
  },
  chatInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    fontSize: 14,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: '#10B981',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    justifyContent: 'center',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});