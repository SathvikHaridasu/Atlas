import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';

// Color constants matching the dark Instagram DM theme with green accent
const COLORS = {
  backgroundDark: '#020617', // Dark background
  bubbleOwnStart: '#03CA59', // Brand green for own messages
  bubbleOwnEnd: '#16DB7E', // Lighter green for own messages
  bubbleOtherStart: '#2563EB', // Blue for received messages
  bubbleOtherEnd: '#4F46E5', // Purple-blue for received messages
  textWhite: '#FFFFFF',
  textLightGray: '#E5E7EB',
  textMuted: '#9CA3AF',
  textTimestamp: '#6B7280',
};

// Avatar color palette for initials
const AVATAR_COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#FFA07A',
  '#98D8C8',
  '#F7DC6F',
  '#BB8FCE',
  '#85C1E2',
  '#F8B739',
  '#52BE80',
];

interface Message {
  id: string;
  content: string | null;
  created_at: string;
  user_id: string;
  profiles?: {
    username?: string;
    email?: string;
    avatar_url?: string | null;
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

  // Otherwise show date + time
  const datePart = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  return `${datePart} ${displayHours}:${displayMinutes} ${ampm}`;
}

/**
 * Get avatar color based on user ID
 */
function getAvatarColor(userId: string): string {
  const index = userId
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

/**
 * Get user initial from name or email
 */
function getUserInitial(senderName: string): string {
  return senderName.charAt(0).toUpperCase();
}

export const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({
  message,
  isOwn,
  senderName,
}) => {
  const avatarUrl = message.profiles?.avatar_url;
  const avatarColor = getAvatarColor(message.user_id);
  const userInitial = getUserInitial(senderName);

  return (
    <View style={[styles.container, isOwn ? styles.containerOwn : styles.containerOther]}>
      {/* Avatar - Left side for others */}
      {!isOwn && (
        <View style={styles.avatarContainer}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} contentFit="cover" />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: avatarColor }]}>
              <Text style={styles.avatarInitial}>{userInitial}</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.messageWrapper}>
        {/* Username above bubble (only show for other users) */}
        {!isOwn && <Text style={styles.username}>{senderName}</Text>}

        {/* Message Bubble */}
        <View
          style={[
            styles.bubble,
            isOwn ? styles.bubbleOwn : styles.bubbleOther,
          ]}
        >
          {/* Text content */}
          {message.content && (
            <Text style={styles.messageText}>
              {message.content}
            </Text>
          )}
        </View>

        {/* Timestamp below bubble */}
        <Text
          style={[
            styles.timestamp,
            isOwn ? styles.timestampOwn : styles.timestampOther,
          ]}
        >
          {formatTime(message.created_at)}
        </Text>
      </View>

      {/* Avatar - Right side for own messages */}
      {isOwn && (
        <View style={styles.avatarContainer}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} contentFit="cover" />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: avatarColor }]}>
              <Text style={styles.avatarInitial}>{userInitial}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 4,
    alignSelf: 'flex-start',
    maxWidth: '85%',
    alignItems: 'flex-end',
  },
  containerOwn: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  containerOther: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
  },
  avatarContainer: {
    marginHorizontal: 8,
    marginBottom: 4,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: COLORS.backgroundDark,
  },
  avatarPlaceholder: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.backgroundDark,
  },
  avatarInitial: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textWhite,
  },
  messageWrapper: {
    flex: 1,
    maxWidth: '100%',
  },
  username: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textLightGray,
    marginBottom: 2,
    marginLeft: 4,
  },
  bubble: {
    maxWidth: '100%',
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 8,
    overflow: 'hidden',
  },
  bubbleOwn: {
    backgroundColor: COLORS.bubbleOwnStart,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: COLORS.bubbleOtherStart,
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