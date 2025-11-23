/**
 * Video Catalog Screen
 * Displays all uploaded videos with playback controls
 */

import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useAppTheme } from '../contexts/ThemeContext';
import { fetchVideos, deleteVideo } from '../../lib/videoService';
import { VideoMetadata } from '../types/video';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const VIDEO_ITEM_HEIGHT = 250;

export default function VideoCatalogScreen() {
  const { user } = useAuth();
  const { theme } = useAppTheme();
  const [videos, setVideos] = useState<VideoMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const videoRefs = useRef<{ [key: string]: Video | null }>({});

  // Fetch videos when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadVideos();
      return () => {
        // Cleanup: stop all videos when leaving screen
        Object.values(videoRefs.current).forEach((videoRef) => {
          if (videoRef) {
            videoRef.unloadAsync().catch(console.error);
          }
        });
        videoRefs.current = {};
      };
    }, [])
  );

  const loadVideos = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedVideos = await fetchVideos(50);
      setVideos(fetchedVideos);
    } catch (err: any) {
      console.error('Error loading videos:', err);
      setError(err.message || 'Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  const handlePlayPause = async (videoId: string, videoUrl: string) => {
    const videoRef = videoRefs.current[videoId];

    if (!videoRef) {
      // Video ref will be set by the ref callback
      return;
    }

    const status = await videoRef.getStatusAsync();
    
    if (status.isLoaded) {
      if (status.isPlaying) {
        await videoRef.pauseAsync();
        setPlayingVideoId(null);
      } else {
        await videoRef.playAsync();
        setPlayingVideoId(videoId);
      }
    }
  };

  const handleDelete = async (videoId: string) => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to delete videos');
      return;
    }

    Alert.alert(
      'Delete Video',
      'Are you sure you want to delete this video? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Stop and unload video if playing
              const videoRef = videoRefs.current[videoId];
              if (videoRef) {
                await videoRef.unloadAsync();
                delete videoRefs.current[videoId];
              }

              // Delete from backend
              await deleteVideo(videoId, user.id);

              // Remove from local state
              setVideos((prev) => prev.filter((v) => v.id !== videoId));
              
              if (playingVideoId === videoId) {
                setPlayingVideoId(null);
              }

              Alert.alert('Success', 'Video deleted successfully');
            } catch (err: any) {
              console.error('Error deleting video:', err);
              Alert.alert('Error', err.message || 'Failed to delete video');
            }
          },
        },
      ]
    );
  };

  const renderVideoItem = ({ item }: { item: VideoMetadata }) => {
    const isPlaying = playingVideoId === item.id;
    const videoRef = videoRefs.current[item.id];

    return (
      <View style={[styles.videoItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
        {/* Video Player */}
        <View style={styles.videoContainer}>
          <Video
            ref={(ref) => {
              if (ref && item.id) {
                videoRefs.current[item.id] = ref;
              }
            }}
            source={{ uri: item.video_url }}
            style={styles.video}
            resizeMode={ResizeMode.CONTAIN}
            useNativeControls={false}
            isLooping={false}
            shouldPlay={isPlaying}
            onPlaybackStatusUpdate={(status: AVPlaybackStatus) => {
              if (status.isLoaded && status.didJustFinish) {
                setPlayingVideoId(null);
              }
            }}
          />

          {/* Play/Pause Overlay */}
          <TouchableOpacity
            style={styles.playButton}
            onPress={() => handlePlayPause(item.id!, item.video_url)}
            activeOpacity={0.8}
          >
            <View style={[styles.playButtonCircle, { backgroundColor: 'rgba(0, 0, 0, 0.6)' }]}>
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={32}
                color="#FFFFFF"
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* Video Info */}
        <View style={styles.videoInfo}>
          <View style={styles.videoInfoHeader}>
            <Text style={[styles.videoTitle, { color: theme.text }]} numberOfLines={1}>
              {item.title || 'Untitled Video'}
            </Text>
            {user && item.user_id === user.id && (
              <TouchableOpacity
                onPress={() => handleDelete(item.id!)}
                style={styles.deleteButton}
                activeOpacity={0.8}
              >
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
              </TouchableOpacity>
            )}
          </View>

          {item.description && (
            <Text style={[styles.videoDescription, { color: theme.mutedText }]} numberOfLines={2}>
              {item.description}
            </Text>
          )}

          <View style={styles.videoMetadata}>
            {item.duration && (
              <Text style={[styles.metadataText, { color: theme.mutedText }]}>
                {formatDuration(item.duration)}
              </Text>
            )}
            {item.created_at && (
              <Text style={[styles.metadataText, { color: theme.mutedText }]}>
                {formatDate(item.created_at)}
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  if (loading && videos.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={[styles.loadingText, { color: theme.mutedText }]}>Loading videos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && videos.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={[styles.errorText, { color: theme.text }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.accent }]}
            onPress={loadVideos}
            activeOpacity={0.8}
          >
            <Text style={[styles.retryButtonText, { color: '#020617' }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Video Catalog</Text>
        <TouchableOpacity onPress={loadVideos} activeOpacity={0.8}>
          <Ionicons name="refresh" size={24} color={theme.accent} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={videos}
        renderItem={renderVideoItem}
        keyExtractor={(item) => item.id || `video-${item.video_url}`}
        contentContainerStyle={styles.listContent}
        refreshing={loading}
        onRefresh={loadVideos}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="videocam-off-outline" size={64} color={theme.mutedText} />
            <Text style={[styles.emptyText, { color: theme.mutedText }]}>
              No videos yet. Record and upload your first video!
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

/**
 * Format duration in seconds to MM:SS format
 */
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Format date string to readable format
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  videoItem: {
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  videoContainer: {
    width: '100%',
    height: VIDEO_ITEM_HEIGHT,
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  videoPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoInfo: {
    padding: 12,
  },
  videoInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  videoTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  deleteButton: {
    padding: 4,
  },
  videoDescription: {
    fontSize: 14,
    marginBottom: 8,
  },
  videoMetadata: {
    flexDirection: 'row',
    gap: 12,
  },
  metadataText: {
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
});

