import React, { useEffect, useState, useRef } from 'react';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useAuth } from '../../contexts/AuthContext';
import { useAppTheme } from '../contexts/ThemeContext';
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
} from '../../lib/sessionService';
import { uploadImageToStorage } from '../../lib/storageService';
import { getGroupImageUrl } from '../../lib/storageService';
import { ChatMessageBubble } from '../components/ChatMessageBubble';
import { SessionSettingsScreen } from '../screens/SessionSettingsScreen';

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
  const { theme } = useAppTheme();
  const sessionId = route?.params?.sessionId;
  const messagesListRef = useRef<FlatList>(null);

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
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [groupImageUrl, setGroupImageUrl] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    loadGroupImage();
  }, [sessionId]);

  const loadGroupImage = async () => {
    if (sessionId) {
      const url = await getGroupImageUrl(sessionId);
      setGroupImageUrl(url);
    }
  };

  useEffect(() => {
    if (!sessionId) return;

    // Set up realtime subscriptions
    const unsubscribeMembers = listenToMembers(sessionId, (updatedMembers) => {
      setMembers(updatedMembers);
    });

    const unsubscribeMessages = listenToMessages(sessionId, (updatedMessages) => {
      setMessages(updatedMessages);
      // Auto-scroll to bottom when new message arrives
      setTimeout(() => {
        messagesListRef.current?.scrollToEnd({ animated: true });
      }, 100);
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

  const handlePickImageFromLibrary = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant access to your photos to send images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets) {
        const imageUris = result.assets.map((asset) => asset.uri);
        setSelectedImages((prev) => [...prev, ...imageUris]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant access to your camera to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImages((prev) => [...prev, result.assets[0].uri]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const handlePickImage = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Library'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            handleTakePhoto();
          } else if (buttonIndex === 2) {
            handlePickImageFromLibrary();
          }
        }
      );
    } else {
      Alert.alert(
        'Select Image',
        'Choose an option',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Take Photo', onPress: handleTakePhoto },
          { text: 'Choose from Library', onPress: handlePickImageFromLibrary },
        ],
        { cancelable: true }
      );
    }
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = async () => {
    const hasText = chatText.trim().length > 0;
    const hasImages = selectedImages.length > 0;

    if (!hasText && !hasImages) return;
    if (!user) return;

    setSendingMessage(true);
    setUploadingImage(true);

    try {
      // If there are images, upload them first
      if (hasImages) {
        for (const imageUri of selectedImages) {
          try {
            // Upload image to Supabase Storage
            const imageUrl = await uploadImageToStorage(imageUri, 'chat-images', sessionId);
            
            // Send message with image
            const textToSend = selectedImages.indexOf(imageUri) === 0 && hasText ? chatText.trim() : null;
            await sendMessage(sessionId, user.id, textToSend, imageUrl);
          } catch (error: any) {
            console.error('Error uploading image:', error);
            Alert.alert('Error', `Failed to upload image: ${error.message}`);
            return;
          }
        }
      } else {
        // Send text-only message
        await sendMessage(sessionId, user.id, chatText.trim(), null);
      }

      setChatText('');
      setSelectedImages([]);
      
      // Scroll to bottom after sending
      setTimeout(() => {
        messagesListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setSendingMessage(false);
      setUploadingImage(false);
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

  // Get session initial for avatar
  const getSessionInitial = (name: string): string => {
    return name.charAt(0).toUpperCase();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#03CA59" />
      </View>
    );
  }

  if (!session) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Session not found</Text>
      </View>
    );
  }

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwn = item.user_id === user?.id;
    const senderName = getSenderName(item);
    return (
      <ChatMessageBubble
        message={item}
        isOwn={isOwn}
        senderName={senderName}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.contentWrapper}>
            {/* Instagram-style Dark Header */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => navigation?.goBack()}
              >
                <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>

              <View style={styles.headerCenter}>
                {groupImageUrl ? (
                  <Image source={{ uri: groupImageUrl }} style={styles.groupAvatar} contentFit="cover" />
                ) : (
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>
                      {getSessionInitial(session.name)}
                    </Text>
                  </View>
                )}
                <Text style={styles.sessionTitle} numberOfLines={1}>
                  {session.name}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => {
                  if (navigation) {
                    navigation.navigate('SessionSettings', {
                      sessionId,
                      sessionName: session.name,
                      sessionCode: session.code || session.join_code || '',
                      sessionWeekStart: session.week_start || '',
                      sessionWeekEnd: session.week_end || '',
                    });
                  }
                }}
              >
                <Ionicons name="settings-outline" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Chat Section - Full-bleed Dark */}
            <FlatList
              ref={messagesListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={renderMessage}
              contentContainerStyle={styles.messagesContainer}
              style={styles.chatSection}
              inverted={false}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyChatText}>
                    No messages yet. Start the conversation!
                  </Text>
                </View>
              }
            />

            {/* Image Preview Section */}
            {selectedImages.length > 0 && (
              <View style={styles.imagePreviewContainer}>
                <FlatList
                  horizontal
                  data={selectedImages}
                  keyExtractor={(item, index) => `${item}-${index}`}
                  renderItem={({ item, index }) => (
                    <View style={styles.imagePreviewWrapper}>
                      <Image source={{ uri: item }} style={styles.imagePreview} contentFit="cover" />
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() => handleRemoveImage(index)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="close-circle" size={24} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  )}
                  contentContainerStyle={styles.imagePreviewList}
                  showsHorizontalScrollIndicator={false}
                />
              </View>
            )}

            {/* Instagram-style Input Bar */}
            <View style={styles.inputContainer}>
              <TouchableOpacity
                style={styles.cameraButton}
                onPress={handlePickImage}
                disabled={sendingMessage || uploadingImage}
              >
                <Ionicons name="image-outline" size={24} color="#9CA3AF" />
              </TouchableOpacity>

              <TextInput
                style={styles.input}
                placeholder="Message..."
                placeholderTextColor="#6B7280"
                value={chatText}
                onChangeText={setChatText}
                editable={!sendingMessage && !uploadingImage}
                multiline
              />

              <TouchableOpacity
                style={[
                  styles.sendButton,
                  ((!chatText.trim() && selectedImages.length === 0) || sendingMessage || uploadingImage) &&
                    styles.sendButtonDisabled,
                ]}
                onPress={handleSendMessage}
                disabled={
                  sendingMessage ||
                  uploadingImage ||
                  (!chatText.trim() && selectedImages.length === 0)
                }
              >
                {sendingMessage || uploadingImage ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Ionicons
                    name="paper-plane-outline"
                    size={18}
                    color="#FFFFFF"
                    style={styles.sendIcon}
                  />
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
    backgroundColor: '#020617',
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
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#020617',
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerButton: {
    padding: 6,
    minWidth: 36,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#03CA59',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  groupAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  imagePreviewContainer: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#050816',
    borderTopWidth: 1,
    borderTopColor: '#1F2937',
  },
  imagePreviewList: {
    gap: 8,
  },
  imagePreviewWrapper: {
    position: 'relative',
    marginRight: 8,
  },
  imagePreview: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#020617',
    borderRadius: 12,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  chatSection: {
    flex: 1,
    backgroundColor: '#020617',
  },
  messagesContainer: {
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyChatText: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 14,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#020617',
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    paddingBottom: 4,
    backgroundColor: '#050816',
    borderTopWidth: 1,
    borderTopColor: '#1F2937',
  },
  cameraButton: {
    padding: 8,
    marginRight: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#1F2937',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#FFFFFF',
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#03CA59',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 40,
    minWidth: 40,
    width: 40,
    height: 40,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendIcon: {
    transform: [{ rotate: '45deg' }],
  },
});
