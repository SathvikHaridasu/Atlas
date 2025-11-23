import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Color constants matching the dark Instagram DM theme with green accent
const COLORS = {
  backgroundDark: '#020617', // Dark background
  bubbleOwnStart: '#03CA59', // Brand green for own messages (gradient start)
  bubbleOwnEnd: '#16DB7E', // Lighter green for own messages (gradient end)
  bubbleOtherStart: '#2563EB', // Blue for received messages (gradient start)
  bubbleOtherEnd: '#4F46E5', // Purple-blue for received messages (gradient end)
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
  // Gradient colors for own vs received messages
  const bubbleColors = isOwn
    ? [COLORS.bubbleOwnStart, COLORS.bubbleOwnEnd] // Green gradient for own messages
    : [COLORS.bubbleOtherStart, COLORS.bubbleOtherEnd]; // Blue gradient for received messages

  return (
    <View style={[styles.messageRow, isOwn ? styles.messageRowOwn : styles.messageRowOther]}>
      {/* Username above bubble (only show for other users) */}
      {!isOwn && (
        <Text style={styles.username}>{senderName}</Text>
      )}
      
      {/* Message Bubble with Gradient */}
      <LinearGradient
        colors={bubbleColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.bubbleBase,
          isOwn ? styles.bubbleOwn : styles.bubbleOther
        ]}
      >
        <Text style={styles.messageText}>
          {message.content}
        </Text>
      </LinearGradient>
      
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
  messageRow: {
    marginVertical: 4,
    paddingHorizontal: 12,
    maxWidth: '72%',
  },
  messageRowOwn: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  messageRowOther: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  username: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textLightGray,
    marginBottom: 2,
    marginLeft: 4,
  },
  bubbleBase: {
    maxWidth: '100%',
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  bubbleOwn: {
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    color: COLORS.textWhite,
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 10,
    color: COLORS.textTimestamp,
    marginTop: 2,
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
