import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';

interface Message {
  id: string;
  text: string;
  sender: string;
  senderId: string;
  timestamp: Date;
  isMine: boolean;
}

export default function ChatScreen() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hey team! Who wants to run together this weekend?',
      sender: 'Alex',
      senderId: 'alex123',
      timestamp: new Date(Date.now() - 3600000),
      isMine: false,
    },
    {
      id: '2',
      text: 'I\'m in! Let\'s do a 5k route.',
      sender: 'You',
      senderId: user?.id || 'me',
      timestamp: new Date(Date.now() - 3300000),
      isMine: true,
    },
    {
      id: '3',
      text: 'Perfect! Meet at the park at 8am?',
      sender: 'Sarah',
      senderId: 'sarah456',
      timestamp: new Date(Date.now() - 3000000),
      isMine: false,
    },
  ]);
  const [inputText, setInputText] = useState('');

  const handleSend = () => {
    if (inputText.trim()) {
      const newMessage: Message = {
        id: Date.now().toString(),
        text: inputText.trim(),
        sender: 'You',
        senderId: user?.id || 'me',
        timestamp: new Date(),
        isMine: true,
      };
      setMessages([...messages, newMessage]);
      setInputText('');
    }
  };

  const formatTime = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[styles.messageContainer, item.isMine ? styles.messageRight : styles.messageLeft]}>
      {!item.isMine && (
        <Text style={styles.senderName}>{item.sender}</Text>
      )}
      <View style={[styles.messageBubble, item.isMine ? styles.bubbleMine : styles.bubbleOther]}>
        <Text style={[styles.messageText, item.isMine ? styles.textMine : styles.textOther]}>
          {item.text}
        </Text>
      </View>
      <Text style={styles.timestamp}>{formatTime(item.timestamp)}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatarStack}>
              <View style={[styles.avatarSmall, styles.avatar1]} />
              <View style={[styles.avatarSmall, styles.avatar2]} />
              <View style={[styles.avatarSmall, styles.avatar3]} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.groupName}>Neighbourhood Runners</Text>
              <Text style={styles.memberCount}>12 members online</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.infoButton} activeOpacity={0.7}>
            <Ionicons name="information-circle-outline" size={24} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Challenge Pill */}
        <View style={styles.challengePill}>
          <MaterialIcons name="emoji-events" size={16} color="#03CA59" />
          <Text style={styles.challengeText}>
            Run 3km together today to earn bonus points
          </Text>
        </View>

        {/* Messages List */}
        <FlatList
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          inverted={false}
        />

        {/* Input Bar */}
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachButton} activeOpacity={0.7}>
            <Ionicons name="attach-outline" size={24} color="#9CA3AF" />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor="#6B7280"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, inputText.trim() && styles.sendButtonActive]}
            onPress={handleSend}
            activeOpacity={0.8}
            disabled={!inputText.trim()}
          >
            <Ionicons
              name="send"
              size={20}
              color={inputText.trim() ? '#000' : '#6B7280'}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020202',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#101010',
    borderBottomWidth: 1,
    borderBottomColor: '#181818',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarStack: {
    flexDirection: 'row',
    marginRight: 12,
  },
  avatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#101010',
  },
  avatar1: {
    backgroundColor: '#03CA59',
    zIndex: 3,
  },
  avatar2: {
    backgroundColor: '#2563EB',
    marginLeft: -12,
    zIndex: 2,
  },
  avatar3: {
    backgroundColor: '#EF4444',
    marginLeft: -12,
    zIndex: 1,
  },
  headerText: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F9FAFB',
  },
  memberCount: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  infoButton: {
    padding: 4,
  },
  challengePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(3, 202, 89, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(3, 202, 89, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
  },
  challengeText: {
    fontSize: 12,
    color: '#03CA59',
    marginLeft: 8,
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '80%',
  },
  messageLeft: {
    alignSelf: 'flex-start',
  },
  messageRight: {
    alignSelf: 'flex-end',
  },
  senderName: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
    marginLeft: 4,
  },
  messageBubble: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  bubbleMine: {
    backgroundColor: '#03CA59',
  },
  bubbleOther: {
    backgroundColor: '#181818',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  textMine: {
    color: '#000',
    fontWeight: '500',
  },
  textOther: {
    color: '#F9FAFB',
  },
  timestamp: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#101010',
    borderTopWidth: 1,
    borderTopColor: '#181818',
  },
  attachButton: {
    padding: 8,
    marginRight: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#181818',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#F9FAFB',
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#181818',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendButtonActive: {
    backgroundColor: '#03CA59',
  },
});
