import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

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

// Avatar color palette for initials
const AVATAR_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
  '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52BE80',
];

interface Message {
  id: string;
  content: string | null;
  image_url: string | null;
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
  
  // Otherwise show date
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    hour: displayHours,
    minute: displayMinutes,
  });
}

/**
 * Get avatar color based on user ID
 */
function getAvatarColor(userId: string): string {
  const index = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
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
  senderName 
}) => {
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const avatarUrl = message.profiles?.avatar_url;
  const avatarColor = getAvatarColor(message.user_id);
  const userInitial = getUserInitial(senderName);

  const handleImagePress = () => {
    if (message.image_url) {
      setImageModalVisible(true);
    }
  };

  return (
    <View style={[styles.container, isOwn ? styles.containerOwn : styles.containerOther]}>
      {/* Avatar - Left side for others, right side for own */}
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
        {!isOwn && (
          <Text style={styles.username}>{senderName}</Text>
        )}
        
        {/* Message Bubble */}
        <View style={[
          styles.bubble,
          isOwn ? styles.bubbleOwn : styles.bubbleOther,
          !message.content && message.image_url && styles.imageOnlyBubble
        ]}>
          {/* Image */}
          {message.image_url && (
            <TouchableOpacity onPress={handleImagePress} activeOpacity={0.9}>
              <Image
                source={{ uri: message.image_url }}
                style={[
                  styles.messageImage,
                  message.content && styles.messageImageWithText
                ]}
                contentFit="cover"
                transition={200}
              />
            </TouchableOpacity>
          )}
          
          {/* Text content */}
          {message.content && (
            <Text style={[
              styles.messageText,
              message.image_url && styles.messageTextWithImage
            ]}>
              {message.content}
            </Text>
          )}
        </View>
        
        {/* Timestamp below bubble */}
        <Text style={[
          styles.timestamp,
          isOwn ? styles.timestampOwn : styles.timestampOther
        ]}>
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

      {/* Full-screen image modal */}
      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setImageModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalContainer}
          activeOpacity={1}
          onPress={() => setImageModalVisible(false)}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            {message.image_url && (
              <Image
                source={{ uri: message.image_url }}
                style={styles.fullScreenImage}
                contentFit="contain"
              />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setImageModalVisible(false)}
          >
            <Ionicons name="close" size={32} color="#FFFFFF" />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
    marginBottom: 4,
    marginLeft: 4,
  },
  bubble: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '100%',
    overflow: 'hidden',
  },
  bubbleOwn: {
    backgroundColor: COLORS.bubbleOwn,
  },
  bubbleOther: {
    backgroundColor: COLORS.bubbleOther,
  },
  imageOnlyBubble: {
    padding: 0,
  },
  messageImage: {
    width: 250,
    height: 250,
    borderRadius: 16,
    marginBottom: 0,
  },
  messageImageWithText: {
    marginBottom: 8,
  },
  messageText: {
    fontSize: 15,
    color: COLORS.textWhite,
    lineHeight: 20,
  },
  messageTextWithImage: {
    marginTop: 0,
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
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    padding: 10,
    zIndex: 10,
  },
});
