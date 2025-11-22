import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { createSession, joinSession } from '../../lib/sessionService';
import { supabase } from '../../lib/supabaseClient';

interface Session {
  id: string;
  name: string;
  code: string;
  week_start: string;
  week_end: string;
}

export default function SessionsHomeScreen({ navigation }: any) {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const [sessionPassword, setSessionPassword] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [joinPassword, setJoinPassword] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadSessions();
    }
  }, [user]);

  const loadSessions = async () => {
    if (!user) return;

    try {
      // First get session IDs user is member of
      const { data: memberData, error: memberError } = await supabase
        .from('session_members')
        .select('session_id')
        .eq('user_id', user.id);

      if (memberError) throw memberError;

      if (!memberData || memberData.length === 0) {
        setSessions([]);
        return;
      }

      const sessionIds = memberData.map(m => m.session_id);

      // Then get sessions
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .in('id', sessionIds);

      if (error) throw error;

      const sessionData = data as Session[];
      setSessions(sessionData || []);
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
    if (!sessionName.trim() || !sessionPassword.trim()) {
      Alert.alert('Error', 'Please enter session name and password');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in');
      return;
    }

    setModalLoading(true);
    try {
      const session = await createSession(user.id, sessionName.trim(), sessionPassword.trim());
      setCreateModalVisible(false);
      setSessionName('');
      setSessionPassword('');
      navigation.navigate('SessionLobby', { sessionId: session.id });
      loadSessions(); // Refresh list
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setModalLoading(false);
    }
  };

  const handleJoinSubmit = async () => {
    if (joinCode.length !== 6 || !joinPassword.trim()) {
      Alert.alert('Error', 'Please enter a valid 6-character code and password');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in');
      return;
    }

    setModalLoading(true);
    try {
      const session = await joinSession(user.id, joinCode.toUpperCase(), joinPassword.trim());
      setJoinModalVisible(false);
      setJoinCode('');
      setJoinPassword('');
      navigation.navigate('SessionLobby', { sessionId: session.id });
      loadSessions(); // Refresh list
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setModalLoading(false);
    }
  };

  const handleSessionPress = (session: Session) => {
    navigation.navigate('SessionLobby', { sessionId: session.id });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Sessions</Text>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.button} onPress={handleCreateSession}>
          <Text style={styles.buttonText}>Create Session</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.joinButton]} onPress={handleJoinSession}>
          <Text style={styles.buttonText}>Join Session</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.sessionItem}
            onPress={() => handleSessionPress(item)}
          >
            <Text style={styles.sessionName}>{item.name}</Text>
            <Text style={styles.sessionCode}>Code: {item.code}</Text>
            <Text style={styles.sessionDates}>
              {item.week_start} - {item.week_end}
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No sessions yet. Create or join one!</Text>
        }
      />

      {/* Create Session Modal */}
      <Modal
        visible={createModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create Session</Text>

            <TextInput
              style={styles.input}
              placeholder="Session Name"
              value={sessionName}
              onChangeText={setSessionName}
            />

            <TextInput
              style={styles.input}
              placeholder="Password"
              value={sessionPassword}
              onChangeText={setSessionPassword}
              secureTextEntry
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setCreateModalVisible(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, modalLoading && styles.buttonDisabled]}
                onPress={handleCreateSubmit}
                disabled={modalLoading}
              >
                {modalLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>Create</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Join Session Modal */}
      <Modal
        visible={joinModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setJoinModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Join Session</Text>

            <TextInput
              style={styles.input}
              placeholder="6-character code"
              value={joinCode}
              onChangeText={(text) => setJoinCode(text.toUpperCase().slice(0, 6))}
              maxLength={6}
              autoCapitalize="characters"
            />

            <TextInput
              style={styles.input}
              placeholder="Password"
              value={joinPassword}
              onChangeText={setJoinPassword}
              secureTextEntry
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setJoinModalVisible(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, modalLoading && styles.buttonDisabled]}
                onPress={handleJoinSubmit}
                disabled={modalLoading || joinCode.length !== 6}
              >
                {modalLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>Join</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#10B981',
    borderRadius: 8,
    padding: 12,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  joinButton: {
    backgroundColor: '#2563EB',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  sessionItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  sessionName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  sessionCode: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  sessionDates: {
    fontSize: 12,
    color: '#999',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 50,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    backgroundColor: '#10B981',
    borderRadius: 8,
    padding: 12,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#6B7280',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});