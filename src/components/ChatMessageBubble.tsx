import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

// Color constants matching the dark Instagram DM theme with green accent
const COLORS = {
  backgroundDark: '#020617', // Dark background
  bubbleOwn: '#03CA59', // Brand green for own messages
  bubbleOther: '#262b35', // Dark gray for other messages
  textWhite: '#FFFFFF',
  textLightGray: '#E5E7EB',
  textMuted: '#9CA3AF',
  textTimestamp: '#6B7280',
};

interface Message {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles?: {
    username?: string;
    email?: string;
  };
}

interface ChatMessageBubbleProps {
  message: Message;
  isOwn: boolean;
  senderName: string;
}

/**
 * Helper function to format timestamp in a readable format
 */
function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  
  // Get hours and minutes
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, '0');
  
  // If same day, show time only
  if (date.toDateString() === now.toDateString()) {
    return `${displayHours}:${displayMinutes} ${ampm}`;
  }
  
  // Otherwise show date
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    hour: displayHours,
    minute: displayMinutes,
  });
}

export const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({ 
  message, 
  isOwn, 
  senderName 
}) => {
  return (
    <View style={[styles.container, isOwn ? styles.containerOwn : styles.containerOther]}>
      {/* Username above bubble (only show for other users) */}
      {!isOwn && (
        <Text style={styles.username}>{senderName}</Text>
      )}
      
      {/* Message Bubble */}
      <View style={[
        styles.bubble,
        isOwn ? styles.bubbleOwn : styles.bubbleOther
      ]}>
        <Text style={styles.messageText}>
          {message.content}
        </Text>
      </View>
      
      {/* Timestamp below bubble */}
      <Text style={[
        styles.timestamp,
        isOwn ? styles.timestampOwn : styles.timestampOther
      ]}>
        {formatTime(message.created_at)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    alignSelf: 'flex-start',
    maxWidth: '70%',
  },
  containerOwn: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  containerOther: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  username: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textLightGray,
    marginBottom: 4,
    marginLeft: 4,
  },
  bubble: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '100%',
  },
  bubbleOwn: {
    backgroundColor: COLORS.bubbleOwn,
  },
  bubbleOther: {
    backgroundColor: COLORS.bubbleOther,
  },
  messageText: {
    fontSize: 15,
    color: COLORS.textWhite,
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 10,
    color: COLORS.textTimestamp,
    marginTop: 4,
  },
  timestampOwn: {
    textAlign: 'right',
    marginRight: 4,
  },
  timestampOther: {
    textAlign: 'left',
    marginLeft: 4,
  },
});
