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
import { useAppTheme } from '../contexts/ThemeContext';

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
  const { theme } = useAppTheme();
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
        <Text style={[styles.senderName, { color: theme.mutedText }]}>{item.sender}</Text>
      )}
      <View style={[styles.messageBubble, item.isMine ? [styles.bubbleMine, { backgroundColor: theme.accent }] : [styles.bubbleOther, { backgroundColor: theme.card }]]}>
        <Text style={[styles.messageText, item.isMine ? styles.textMine : { color: theme.text }]}>
          {item.text}
        </Text>
      </View>
      <Text style={[styles.timestamp, { color: theme.mutedText }]}>{formatTime(item.timestamp)}</Text>
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
        <View style={[styles.inputContainer, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
          <TouchableOpacity style={styles.attachButton} activeOpacity={0.7}>
            <Ionicons name="attach-outline" size={24} color={theme.mutedText} />
          </TouchableOpacity>
          <TextInput
            style={[styles.input, { backgroundColor: theme.border, color: theme.text }]}
            placeholder="Type a message..."
            placeholderTextColor={theme.mutedText}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, { backgroundColor: theme.border }, inputText.trim() && [styles.sendButtonActive, { backgroundColor: theme.accent }]]}
            onPress={handleSend}
            activeOpacity={0.8}
            disabled={!inputText.trim()}
          >
            <Ionicons
              name="send"
              size={20}
              color={inputText.trim() ? '#000' : theme.mutedText}
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
    borderBottomWidth: 1,
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
  },
  memberCount: {
    fontSize: 12,
    marginTop: 2,
  },
  infoButton: {
    padding: 4,
  },
  challengePill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
  },
  challengeText: {
    fontSize: 12,
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
    marginBottom: 4,
    marginLeft: 4,
  },
  messageBubble: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  bubbleMine: {
    // backgroundColor set inline with theme.accent
  },
  bubbleOther: {
    // backgroundColor set inline with theme.card
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  textMine: {
    color: '#000',
    fontWeight: '500',
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  attachButton: {
    padding: 8,
    marginRight: 8,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendButtonActive: {
    // backgroundColor set inline with theme.accent
  },
});
