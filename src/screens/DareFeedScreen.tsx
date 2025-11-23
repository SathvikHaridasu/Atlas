import { useFocusEffect } from '@react-navigation/native';
import { VideoView, useVideoPlayer } from 'expo-video';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewToken,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../contexts/ThemeContext';
import { fetchVideos } from '../../lib/videoService';
import { VideoMetadata } from '../types/video';
import FullScreenVideoModal from '../components/FullScreenVideoModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const VIDEO_PREVIEW_HEIGHT = 400;

// Separate component for video preview item to use hooks
interface VideoPreviewItemProps {
  video: VideoMetadata;
  index: number;
  isVisible: boolean;
  onPress: () => void;
}

const VideoPreviewItem = React.memo(function VideoPreviewItem({ 
  video, 
  index, 
  isVisible, 
  onPress 
}: VideoPreviewItemProps) {
  const [hasError, setHasError] = useState(false);
  
  // Create video player - useVideoPlayer manages its own lifecycle
  const player = useVideoPlayer(video.video_url, (player) => {
    player.loop = true;
    player.muted = true;
    console.log(`[VideoPreviewItem ${index}] Player initialized for:`, video.video_url);
  });

  // Monitor player status and handle ready state
  useEffect(() => {
    if (!player) return;

    console.log(`[VideoPreviewItem ${index}] Setting up status monitoring`);
    
    // Check initial status
    const checkStatus = () => {
      try {
        const currentStatus = player.status;
        console.log(`[VideoPreviewItem ${index}] Current status:`, currentStatus);
        
        if (currentStatus === 'readyToPlay' || currentStatus === 'ready') {
          console.log(`[VideoPreviewItem ${index}] Video ready to play`);
          // Only play if visible
          if (isVisible) {
            player.play();
          }
        } else if (currentStatus === 'error') {
          // Access error details from player - try multiple possible properties
          const playerAny = player as any;
          const errorDetails = 
            playerAny.error || 
            playerAny.currentItem?.error || 
            playerAny.status?.error ||
            playerAny._error ||
            null;
          
          console.error(`[VideoPreviewItem ${index}] Video error state detected`);
          console.error(`[VideoPreviewItem ${index}] Error details:`, {
            error: errorDetails,
            errorMessage: errorDetails?.message || errorDetails?.localizedDescription || errorDetails?.description || 'Unknown error',
            errorCode: errorDetails?.code || errorDetails?.errorCode || 'N/A',
            errorDomain: errorDetails?.domain || 'N/A',
            fullError: errorDetails ? JSON.stringify(errorDetails, Object.getOwnPropertyNames(errorDetails), 2) : 'No error object found',
            playerStatus: currentStatus,
            playerProperties: Object.keys(playerAny).filter(k => k.includes('error') || k.includes('Error')),
            videoUrl: video.video_url,
          });
          
          // Try to access player's internal state
          try {
            console.error(`[VideoPreviewItem ${index}] Player object keys:`, Object.keys(playerAny).slice(0, 20));
          } catch (e) {
            // Ignore if we can't access keys
          }
          
          setHasError(true);
        }
      } catch (err) {
        console.error(`[VideoPreviewItem ${index}] Error checking status:`, err);
      }
    };

    // Check status immediately
    checkStatus();

    // Poll status periodically until ready (max 5 seconds)
    const interval = setInterval(() => {
      checkStatus();
    }, 500);

    const timeout = setTimeout(() => {
      clearInterval(interval);
    }, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
      console.log(`[VideoPreviewItem ${index}] Cleaning up status monitoring`);
    };
  }, [player, index, isVisible]);

  // Control playback based on visibility
  useEffect(() => {
    if (!player) return;

    const currentStatus = player.status;
    console.log(`[VideoPreviewItem ${index}] Visibility changed. isVisible: ${isVisible}, status: ${currentStatus}`);

    // Only control playback if player is ready
    if (currentStatus === 'readyToPlay' || currentStatus === 'playing' || currentStatus === 'paused') {
      if (isVisible) {
        console.log(`[VideoPreviewItem ${index}] Playing video`);
        player.play();
      } else {
        console.log(`[VideoPreviewItem ${index}] Pausing video`);
        player.pause();
      }
    }
  }, [isVisible, player, index]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log(`[VideoPreviewItem ${index}] Component unmounting, cleaning up`);
      if (player) {
        player.pause();
      }
    };
  }, [player, index]);

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={styles.videoCard}
    >
      {hasError ? (
        <View style={styles.errorOverlay}>
          <Text style={styles.errorText}>Video unavailable</Text>
          <Text style={styles.errorSubtext}>Tap to try again</Text>
        </View>
      ) : (
        <VideoView
          player={player}
          style={styles.previewVideo}
          contentFit="cover"
          nativeControls={false}
          fullscreenOptions={{ enterFullscreenButton: false }}
          onError={(e) => {
            console.error(`[VideoPreviewItem ${index}] VideoView onError callback:`, {
              error: e,
              errorMessage: e?.message || 'Unknown error',
              errorCode: e?.code || 'N/A',
              videoUrl: video.video_url,
            });
            setHasError(true);
          }}
        />
      )}
    </TouchableOpacity>
  );
});

export default function DareFeedScreen() {
  const { theme } = useAppTheme();
  const [videos, setVideos] = useState<VideoMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<VideoMetadata | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [visibleIndices, setVisibleIndices] = useState<Set<number>>(new Set());

  // Check if URL is accessible
  const checkUrlAccessibility = useCallback(async (url: string): Promise<boolean> => {
    try {
      const response = await fetch(url, { method: 'HEAD', cache: 'no-cache' });
      const isAccessible = response.ok;
      if (!isAccessible) {
        console.warn(`[URL Check] URL not accessible (${response.status}):`, url);
      }
      return isAccessible;
    } catch (err: any) {
      console.warn(`[URL Check] URL accessibility check failed:`, err.message, url);
      return false;
    }
  }, []);

  // Load videos function
  const loadVideos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedVideos = await fetchVideos(100); // Fetch up to 100 videos
      
      // Verify video URLs are valid public URLs
      const videosWithValidUrls = fetchedVideos.filter((video) => {
        if (!video.video_url) {
          console.warn('Video missing URL:', video.id);
          return false;
        }
        // Validate URL format - must be http or https
        if (!video.video_url.startsWith('http://') && !video.video_url.startsWith('https://')) {
          console.warn('Video URL is not a public URL:', video.video_url);
          return false;
        }
        return true;
      });
      
      console.log(`[DareFeedScreen] Loaded ${videosWithValidUrls.length} videos with valid URL format`);
      
      // Check URL accessibility (sample first 5 to avoid too many requests)
      const videosToCheck = videosWithValidUrls.slice(0, 5);
      const accessibilityResults = await Promise.all(
        videosToCheck.map(async (video) => ({
          video,
          accessible: await checkUrlAccessibility(video.video_url),
        }))
      );
      
      const accessibleCount = accessibilityResults.filter(r => r.accessible).length;
      console.log(`[DareFeedScreen] URL accessibility check: ${accessibleCount}/${videosToCheck.length} URLs accessible`);
      
      // Log any inaccessible URLs
      accessibilityResults.forEach(({ video, accessible }) => {
        if (!accessible) {
          console.warn(`[DareFeedScreen] Video URL not accessible:`, video.video_url);
        }
      });
      
      setVideos(videosWithValidUrls);
    } catch (err: any) {
      console.error('Error loading videos:', err);
      setError(err.message || 'Failed to load videos');
    } finally {
      setLoading(false);
    }
  }, [checkUrlAccessibility]);

  // Fetch videos when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadVideos();
      return () => {
        // Cleanup handled by expo-video automatically
        setVisibleIndices(new Set());
      };
    }, [loadVideos])
  );

  // Track which items are visible for auto-play/pause functionality
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const newVisibleIndices = new Set<number>();
      viewableItems.forEach((item) => {
        if (item.index !== null && item.index !== undefined) {
          newVisibleIndices.add(item.index);
        }
      });
      setVisibleIndices(newVisibleIndices);
    }
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50, // Item is considered visible when 50% is shown
    minimumViewTime: 100, // Minimum time item must be visible
  }).current;

  const handleVideoPress = useCallback((video: VideoMetadata) => {
    console.log('[DareFeedScreen] Video pressed:', video.video_url);
    setSelectedVideo(video);
    setModalVisible(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    console.log('[DareFeedScreen] Closing modal');
    setModalVisible(false);
    setSelectedVideo(null);
  }, []);

  const renderVideoItem = useCallback(({ item, index }: { item: VideoMetadata; index: number }) => {
    // Validate URL before rendering
    if (!item.video_url || !item.video_url.startsWith('http')) {
      console.warn(`[DareFeedScreen] Skipping video ${index} with invalid URL:`, item.video_url);
      return null;
    }

    return (
      <VideoPreviewItem
        video={item}
        index={index}
        isVisible={visibleIndices.has(index)}
        onPress={() => handleVideoPress(item)}
      />
    );
  }, [visibleIndices, handleVideoPress]);

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
          <Text style={[styles.errorText, { color: theme.text }]}>{error}</Text>
          <Text style={[styles.errorSubtext, { color: theme.mutedText }]}>
            Pull down to retry
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
        <FlatList
          data={videos}
          renderItem={renderVideoItem}
          keyExtractor={(item) => item.id || `video-${item.video_url}`}
          contentContainerStyle={styles.listContent}
          refreshing={loading}
          onRefresh={loadVideos}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          pagingEnabled={false}
          snapToInterval={VIDEO_PREVIEW_HEIGHT + 16}
          decelerationRate="fast"
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.mutedText }]}>
                No videos yet. Record and upload your first video!
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>

      {/* Full-screen video modal */}
      {selectedVideo && (
        <FullScreenVideoModal
          visible={modalVisible}
          videoUrl={selectedVideo.video_url}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 8,
    paddingBottom: 32,
  },
  videoCard: {
    width: SCREEN_WIDTH - 16,
    height: VIDEO_PREVIEW_HEIGHT,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#1B1B1B',
    marginBottom: 16,
    alignSelf: 'center',
  },
  previewVideo: {
    width: '100%',
    height: '100%',
  },
  errorOverlay: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1B1B1B',
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  errorSubtext: {
    color: '#999999',
    fontSize: 12,
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
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
    width: SCREEN_WIDTH - 32,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});

