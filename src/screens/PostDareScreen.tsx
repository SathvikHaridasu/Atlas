/**
 * PostDareScreen
 * Screen for posting a recorded dare video to the feed
 * Includes title, description inputs, and video preview
 */

import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { VideoView, useVideoPlayer } from 'expo-video';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { MissionCongratsModal } from '../components/MissionCongratsModal';
import { useFeed } from '../contexts/FeedContext';
import { useMissions, useMissionActions } from '../contexts/MissionsContext';
import { useAppTheme } from '../contexts/ThemeContext';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { FeedPost } from '../types/feed';
import { uploadVideo } from '../../lib/videoService';
import { useAuth } from '../../contexts/AuthContext';
import { MISSION_REWARD_POINTS } from '../lib/missions/constants';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type PostDareScreenRouteProp = RouteProp<RootStackParamList, 'PostDare'>;

export default function PostDareScreen() {
  const navigation = useNavigation();
  const route = useRoute<PostDareScreenRouteProp>();
  const { theme } = useAppTheme();
  const { addPost } = useFeed();
  const { user } = useAuth();
  const { availableMissions } = useMissions();
  const { completeMission, clearActiveMission } = useMissionActions();

  // Get params from navigation
  const videoUri = route.params?.videoUri;
  const sessionId = route.params?.sessionId;
  const activeMissionInstanceId = route.params?.activeMissionInstanceId ?? null;

  // Get active mission if mission ID is provided
  const activeMission = React.useMemo(() => {
    if (!activeMissionInstanceId) return null;
    return availableMissions.find((m) => m.id === activeMissionInstanceId) ?? null;
  }, [availableMissions, activeMissionInstanceId]);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  
  // Mission congrats modal state
  const [showMissionCongrats, setShowMissionCongrats] = useState(false);
  const [completedMissionTitle, setCompletedMissionTitle] = useState<string | undefined>(undefined);

  // Video player for preview
  const player = useVideoPlayer(videoUri || '', (player) => {
    player.loop = true;
    player.muted = true;
  });

  // Validate params on mount
  useEffect(() => {
    if (!videoUri) {
      Alert.alert('Error', 'Video URI is missing. Please record a video first.', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
      return;
    }

    if (!sessionId) {
      Alert.alert('Error', 'Session ID is missing. Please try again.', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
      return;
    }
  }, [videoUri, sessionId, navigation]);

  const handlePost = async () => {
    // Validate all required fields
    if (!videoUri) {
      Alert.alert('Error', 'Video URI is missing. Please record a video first.');
      return;
    }

    if (!sessionId) {
      Alert.alert('Error', 'Session ID is missing. Please try again.');
      return;
    }

    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title for your dare video.');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description for your dare video.');
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'User information is missing. Please sign in again.');
      return;
    }

    setIsPosting(true);

    try {
      // Get current location if available (for mission completion)
      let currentLocation: { latitude: number; longitude: number } | null = null;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({});
          currentLocation = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
        }
      } catch (locationError) {
        console.warn('Could not get location for mission:', locationError);
        // Continue without location - it's optional
      }

      // Upload video to Supabase Storage
      const publicUrl = await uploadVideo(videoUri, user.id, {
        title: title.trim(),
        description: description.trim(),
        onProgress: (progress) => {
          // Progress tracking can be added here if needed
          console.log('Upload progress:', progress.percentage);
        },
      });

      // Create feed post
      const post: FeedPost = {
        id: `post_${Date.now()}`,
        userId: sessionId,
        type: 'video',
        videoUri: publicUrl, // Use the uploaded public URL
        createdAt: new Date().toISOString(),
        caption: description.trim(),
        durationSeconds: undefined, // Can be calculated if needed
      };

      // Add post to feed context
      addPost(post);

      // Complete mission if active
      if (activeMissionInstanceId && activeMission) {
        try {
          await completeMission({
            missionInstanceId: activeMissionInstanceId,
            mediaUrl: publicUrl,
            location: currentLocation,
            notes: description.trim(),
          });
          clearActiveMission();

          // Trigger haptic feedback for success
          try {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch (hapticError) {
            // Haptics not available, continue
          }

          // Set mission title and show congrats modal
          setCompletedMissionTitle(
            activeMission.mission_template?.title ?? 'Side Mission'
          );
          setShowMissionCongrats(true);
        } catch (missionError: any) {
          console.error('Error completing mission:', missionError);
          // Show success for feed post but warn about mission
          Alert.alert(
            'Video Posted',
            'Your video was posted to the feed, but we couldn\'t complete the mission. Try again later.',
            [
              {
                text: 'OK',
                onPress: () => {
                  navigation.goBack();
                },
              },
            ]
          );
        }
      } else {
        // Show success message (no mission)
        Alert.alert('Success', 'Your dare video has been posted to the feed!', [
          {
            text: 'OK',
            onPress: () => {
              // Navigate back to previous screen
              navigation.goBack();
            },
          },
        ]);
      }
    } catch (error: any) {
      console.error('Error posting dare video:', error);
      Alert.alert(
        'Upload Failed',
        error.message || 'Failed to upload and post video. Please try again.'
      );
      setIsPosting(false);
    }
  };

  const handleCancel = () => {
    if (isPosting) {
      Alert.alert(
        'Upload in Progress',
        'Video is currently uploading. Please wait or discard the upload.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert('Discard Video?', 'Are you sure you want to discard this video?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => navigation.goBack(),
      },
    ]);
  };

  // Don't render if params are missing (will show alert and navigate back)
  if (!videoUri || !sessionId) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={theme.accent} />
          <Text style={[styles.errorText, { color: theme.text }]}>
            Missing required information
          </Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.accent }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleCancel}
            disabled={isPosting}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={28} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Post Dare Video</Text>
          <View style={styles.closeButton} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Video Preview */}
          <View style={[styles.videoPreviewContainer, { backgroundColor: theme.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Video Preview</Text>
            {videoUri ? (
              <View style={styles.videoWrapper}>
                <VideoView
                  player={player}
                  style={styles.videoPreview}
                  contentFit="cover"
                  nativeControls={true}
                  fullscreenOptions={{ enterFullscreenButton: false }}
                />
              </View>
            ) : (
              <View style={[styles.videoPlaceholder, { backgroundColor: theme.background }]}>
                <Ionicons name="videocam-outline" size={48} color={theme.mutedText} />
                <Text style={[styles.placeholderText, { color: theme.mutedText }]}>
                  No video available
                </Text>
              </View>
            )}
          </View>

          {/* Title Input */}
          <View style={[styles.inputSection, { backgroundColor: theme.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Title *</Text>
            <Text style={[styles.inputHint, { color: theme.mutedText }]}>
              Give your dare video a title
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.background,
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
              placeholder="Enter video title..."
              placeholderTextColor={theme.mutedText}
              value={title}
              onChangeText={setTitle}
              editable={!isPosting}
              maxLength={100}
              autoCapitalize="words"
            />
          </View>

          {/* Mission Info Banner */}
          {activeMission && (
            <View style={[styles.missionInfoBanner, { backgroundColor: `${theme.accent}15`, borderColor: theme.accent }]}>
              <Ionicons name="target" size={20} color={theme.accent} style={{ marginRight: 12 }} />
              <View style={styles.missionInfoText}>
                <Text style={[styles.missionInfoTitle, { color: theme.text }]}>
                  Side Mission Active
                </Text>
                <Text style={[styles.missionInfoSubtitle, { color: theme.mutedText }]}>
                  This video will be used as proof for: {activeMission.mission_template.title}
                </Text>
                <Text style={[styles.missionInfoPoints, { color: theme.accent }]}>
                  +{activeMission.mission_template.points_reward} pts on completion
                </Text>
              </View>
            </View>
          )}

          {/* Description Input */}
          <View style={[styles.inputSection, { backgroundColor: theme.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Description *</Text>
            <Text style={[styles.inputHint, { color: theme.mutedText }]}>
              Describe your dare video{activeMission ? ' (this will also be used as mission proof)' : ''}
            </Text>
            <TextInput
              style={[
                styles.textArea,
                {
                  backgroundColor: theme.background,
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
              placeholder="Enter video description..."
              placeholderTextColor={theme.mutedText}
              value={description}
              onChangeText={setDescription}
              editable={!isPosting}
              multiline
              numberOfLines={4}
              maxLength={500}
              textAlignVertical="top"
            />
            <Text style={[styles.characterCount, { color: theme.mutedText }]}>
              {description.length}/500
            </Text>
          </View>

          {/* Post Button */}
          <TouchableOpacity
            style={[
              styles.postButton,
              {
                backgroundColor: isPosting || !title.trim() || !description.trim()
                  ? theme.border
                  : theme.accent,
              },
            ]}
            onPress={handlePost}
            disabled={isPosting || !title.trim() || !description.trim()}
            activeOpacity={0.8}
          >
            {isPosting ? (
              <ActivityIndicator size="small" color="#020617" />
            ) : (
              <Text style={styles.postButtonText}>Post to Feed</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Mission Congrats Modal */}
      <MissionCongratsModal
        visible={showMissionCongrats}
        missionTitle={completedMissionTitle}
        pointsAwarded={MISSION_REWARD_POINTS}
        onClose={() => {
          setShowMissionCongrats(false);
          // Navigate back after closing modal
          navigation.goBack();
        }}
      />
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
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  videoPreviewContainer: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  videoWrapper: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  videoPreview: {
    width: '100%',
    height: '100%',
  },
  videoPlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  placeholderText: {
    marginTop: 8,
    fontSize: 14,
  },
  inputSection: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  inputHint: {
    fontSize: 12,
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    fontSize: 16,
  },
  textArea: {
    minHeight: 120,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    fontSize: 16,
  },
  characterCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  postButton: {
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  postButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#020617',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: {
    color: '#020617',
    fontSize: 16,
    fontWeight: '700',
  },
  missionInfoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  missionInfoText: {
    flex: 1,
  },
  missionInfoTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  missionInfoSubtitle: {
    fontSize: 12,
    marginBottom: 4,
  },
  missionInfoPoints: {
    fontSize: 12,
    fontWeight: '600',
  },
});

