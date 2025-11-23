import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import React, { useRef, useState } from 'react';
import {
  ActionSheetIOS,
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
import { useAuth } from '../../contexts/AuthContext';
import { useAppTheme } from '../contexts/ThemeContext';
import { uploadImageToStorage } from '../../lib/storageService';
import { getGroupImageUrl } from '../../lib/storageService';

interface Message {
  id: string;
  text: string;
  sender: string;
  senderId: string;
  timestamp: Date;
  isMine: boolean;
  imageUrl?: string;
}

interface ChatScreenProps {
  route?: {
    params?: {
      sessionId?: string;
      sessionName?: string;
    };
  };
}

export default function ChatScreen({ route }: ChatScreenProps = {}) {
  const { user } = useAuth();
  const { theme } = useAppTheme();
  const navigation = useNavigation();
  const sessionId = route?.params?.sessionId;
  const sessionName = route?.params?.sessionName;
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
      text: "I'm in! Let's do a 5k route.",
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
    {
      id: '4',
      text: 'Here\'s the route I was thinking!',
      sender: 'Alex',
      senderId: 'alex123',
      timestamp: new Date(Date.now() - 2700000),
      isMine: false,
      imageUrl: 'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=400&h=400&fit=crop',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [groupImageUrl, setGroupImageUrl] = useState<string | null>(null);
  const messagesListRef = useRef<FlatList>(null);

  // Load group image if sessionId is available
  React.useEffect(() => {
    if (sessionId) {
      getGroupImageUrl(sessionId).then(setGroupImageUrl);
    }
  }, [sessionId]);

  const handlePickImageFromLibrary = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission needed',
          'Please grant access to your photos to send images.'
        );
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
        Alert.alert(
          'Permission needed',
          'Please grant access to your camera to take photos.'
        );
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
      // Android: Show alert with options
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

  const handleSend = async () => {
    const hasText = inputText.trim().length > 0;
    const hasImages = selectedImages.length > 0;

    if (!hasText && !hasImages) return;
    if (!user) return;

    // If sessionId exists, use sendMessage
    if (sessionId) {
      try {
        const { sendMessage } = await import('../../lib/sessionService');
        await sendMessage(sessionId, user.id, inputText.trim());

        setInputText('');
        setTimeout(() => {
          messagesListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } catch (error: any) {
        Alert.alert('Error', error.message);
      } finally {
        setUploadingImage(false);
      }
    } else {
      // Fallback for non-session chats (mock behavior)
      if (hasText || hasImages) {
        if (hasImages && selectedImages.length > 1) {
          selectedImages.forEach((imageUri, index) => {
            const newMessage: Message = {
              id: `${Date.now()}-${index}`,
              text: index === 0 && hasText ? inputText.trim() : '',
              sender: 'You',
              senderId: user?.id || 'me',
              timestamp: new Date(),
              isMine: true,
              imageUrl: imageUri,
            };
            setMessages((prev) => [...prev, newMessage]);
          });
        } else {
          const newMessage: Message = {
            id: Date.now().toString(),
            text: inputText.trim(),
            sender: 'You',
            senderId: user?.id || 'me',
            timestamp: new Date(),
            isMine: true,
            imageUrl: selectedImages[0] || undefined,
          };
          setMessages((prev) => [...prev, newMessage]);
        }

        setInputText('');
        setSelectedImages([]);
        setTimeout(() => {
          messagesListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    }
  };

  const formatTime = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  const handleViewLeaderboard = () => {
    navigation.navigate('Leaderboard' as never, {
      sessionId,
      sessionName,
    } as never);
  };

  const handleOpenCamera = () => {
    if (!sessionId) {
      Alert.alert('Error', 'Session ID is required to upload a dare video.');
      return;
    }
    (navigation as any).navigate('Camera', { sessionId });
  };

  const handleOpenSettings = () => {
    if (!sessionId || !sessionName) {
      Alert.alert('Error', 'Session information is missing.');
      return;
    }
    // Navigate to SessionSettings - sessionCode will be fetched in the settings screen if needed
    (navigation as any).navigate('SessionSettings', {
      sessionId,
      sessionName,
      sessionCode: '', // Default empty, can be fetched from session data if needed
    });
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[styles.messageContainer, item.isMine ? styles.messageRight : styles.messageLeft]}>
      {!item.isMine && (
        <Text style={[styles.senderName, { color: theme.mutedText }]}>{item.sender}</Text>
      )}
      <View
        style={[
          styles.messageBubble,
          item.isMine
            ? [styles.bubbleMine, { backgroundColor: theme.accent }]
            : [styles.bubbleOther, { backgroundColor: theme.card }],
          item.imageUrl && !item.text && styles.imageOnlyBubble,
        ]}
      >
        {item.imageUrl && (
          <Image
            source={{ uri: item.imageUrl }}
            style={[
              styles.messageImage,
              item.text && styles.messageImageWithText,
            ]}
            contentFit="cover"
            transition={200}
          />
        )}
        {item.text ? (
          <Text
            style={[
              styles.messageText,
              item.isMine ? styles.textMine : { color: theme.text },
              item.imageUrl && styles.messageTextWithImage,
            ]}
          >
            {item.text}
          </Text>
        ) : null}
      </View>
      <Text style={[styles.timestamp, { color: theme.mutedText }]}>{formatTime(item.timestamp)}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.contentWrapper}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
              <View style={styles.headerLeft}>
                <View style={styles.avatarStack}>
                  <View style={[styles.avatarSmall, styles.avatar1]} />
                  <View style={[styles.avatarSmall, styles.avatar2]} />
                  <View style={[styles.avatarSmall, styles.avatar3]} />
                </View>
                <View style={styles.headerText}>
                  {groupImageUrl ? (
                    <Image source={{ uri: groupImageUrl }} style={styles.groupAvatarSmall} contentFit="cover" />
                  ) : (
                    <View style={[styles.groupAvatarPlaceholder, { backgroundColor: theme.accent }]}>
                      <Text style={styles.groupAvatarInitial}>
                        {sessionName ? sessionName.charAt(0).toUpperCase() : 'G'}
                      </Text>
                    </View>
                  )}
                  <View style={styles.headerTextContent}>
                    <Text 
                      style={[styles.groupName, { color: theme.text }]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {sessionName || 'Neighbourhood Runners'}
                    </Text>
                    <Text 
                      style={[styles.memberCount, { color: theme.mutedText }]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      12 members online
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.headerRight}>
                <TouchableOpacity
                  style={styles.headerIconButton}
                  onPress={handleOpenCamera}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="camera-outline" size={24} color={theme.accent} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.headerIconButton}
                  onPress={handleViewLeaderboard}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="trophy-outline" size={24} color={theme.accent} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.headerIconButton}
                  onPress={handleOpenSettings}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="settings-outline" size={24} color={theme.mutedText} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Challenge Pill */}
            <View style={styles.challengePill}>
              <MaterialIcons name="emoji-events" size={16} color="#03CA59" />
              <Text style={styles.challengeText}>
                Run 3km together today to earn bonus points
              </Text>
            </View>

            {/* Messages List - FlatList only, no ScrollView wrapper */}
            <FlatList
              ref={messagesListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item) => item.id}
              style={styles.messagesList}
              contentContainerStyle={styles.messagesContent}
              keyboardShouldPersistTaps="handled"
              inverted={false}
            />

            {/* Image Preview Section */}
            {selectedImages.length > 0 && (
              <View style={[styles.imagePreviewContainer, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
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

            {/* Fixed Bottom Input Bar */}
            <View
              style={[
                styles.inputContainer,
                { backgroundColor: theme.card, borderTopColor: theme.border },
              ]}
            >
              <TouchableOpacity
                style={styles.attachButton}
                onPress={handlePickImage}
                activeOpacity={0.7}
              >
                <Ionicons name="image-outline" size={24} color={theme.mutedText} />
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
                style={[
                  styles.sendButton,
                  { backgroundColor: theme.border },
                  (inputText.trim() || selectedImages.length > 0) && [
                    styles.sendButtonActive,
                    { backgroundColor: theme.accent },
                  ],
                ]}
                onPress={handleSend}
                activeOpacity={0.8}
                disabled={
                  (!inputText.trim() && selectedImages.length === 0) || uploadingImage
                }
              >
                {uploadingImage ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <Ionicons
                    name="send"
                    size={20}
                    color={inputText.trim() || selectedImages.length > 0 ? '#000' : theme.mutedText}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    minHeight: 56,
    overflow: 'visible', // Ensure icons aren't clipped
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    flexShrink: 1,
    marginRight: 8,
    minWidth: 0, // Allow shrinking below content size
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
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0, // Allow shrinking below content size
  },
  groupAvatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  groupAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupAvatarInitial: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  headerTextContent: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0, // Allow shrinking below content size
  },
  groupName: {
    fontSize: 16,
    fontWeight: '700',
    flexShrink: 1,
  },
  memberCount: {
    fontSize: 12,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginLeft: 8,
    flexShrink: 0,
    flexGrow: 0,
    zIndex: 10,
    width: 'auto', // Explicit width to prevent shrinking
  },
  headerIconButton: {
    padding: 8,
    marginLeft: 8,
    minWidth: 40,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
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
    overflow: 'hidden',
  },
  bubbleMine: {
    // backgroundColor set inline with theme.accent
  },
  bubbleOther: {
    // backgroundColor set inline with theme.card
  },
  imageOnlyBubble: {
    padding: 0,
  },
  messageImage: {
    width: 250,
    height: 250,
    borderRadius: 12,
    marginBottom: 0,
  },
  messageImageWithText: {
    marginBottom: 8,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  messageTextWithImage: {
    marginTop: 0,
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
  imagePreviewContainer: {
    borderTopWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
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
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
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