/**
 * Full-screen video modal component
 * Displays video with autoplay, sound, looping, and native controls
 */

import { Ionicons } from '@expo/vector-icons';
import { VideoView, useVideoPlayer } from 'expo-video';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../contexts/ThemeContext';

interface FullScreenVideoModalProps {
  visible: boolean;
  videoUrl: string;
  onClose: () => void;
}

export default function FullScreenVideoModal({
  visible,
  videoUrl,
  onClose,
}: FullScreenVideoModalProps) {
  const { theme } = useAppTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Validate URL
  useEffect(() => {
    if (!videoUrl || !videoUrl.startsWith('http')) {
      console.error('[FullScreenVideoModal] Invalid Supabase video URL:', videoUrl);
      setHasError(true);
      setIsLoading(false);
      return;
    }
  }, [videoUrl]);

  // Create video player - useVideoPlayer manages its own lifecycle
  // Only create if URL is valid
  const player = useVideoPlayer(
    videoUrl && videoUrl.startsWith('http') ? videoUrl : '', 
    (player) => {
      player.loop = true;
      player.muted = false;
      console.log('[FullScreenVideoModal] Player initialized for:', videoUrl);
    }
  );

  // Monitor player status and handle ready state
  useEffect(() => {
    if (!player || !visible) return;

    console.log('[FullScreenVideoModal] Setting up status monitoring');
    
    // Check status and update loading state
    const checkStatus = () => {
      try {
        const currentStatus = player.status;
        console.log('[FullScreenVideoModal] Current status:', currentStatus);
        
        if (currentStatus === 'readyToPlay' || currentStatus === 'ready' || currentStatus === 'playing') {
          console.log('[FullScreenVideoModal] Video ready/playing');
          setIsLoading(false);
          if (currentStatus !== 'playing') {
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
          
          console.error('[FullScreenVideoModal] Video error state detected');
          console.error('[FullScreenVideoModal] Error details:', {
            error: errorDetails,
            errorMessage: errorDetails?.message || errorDetails?.localizedDescription || errorDetails?.description || 'Unknown error',
            errorCode: errorDetails?.code || errorDetails?.errorCode || 'N/A',
            errorDomain: errorDetails?.domain || 'N/A',
            fullError: errorDetails ? JSON.stringify(errorDetails, Object.getOwnPropertyNames(errorDetails), 2) : 'No error object found',
            playerStatus: currentStatus,
            playerProperties: Object.keys(playerAny).filter(k => k.includes('error') || k.includes('Error')),
            videoUrl: videoUrl,
          });
          
          // Try to access player's internal state
          try {
            console.error('[FullScreenVideoModal] Player object keys:', Object.keys(playerAny).slice(0, 20));
          } catch (e) {
            // Ignore if we can't access keys
          }
          
          setHasError(true);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('[FullScreenVideoModal] Error checking status:', err);
      }
    };

    // Check status immediately
    checkStatus();

    // Poll status periodically until ready (max 8 seconds)
    const interval = setInterval(() => {
      checkStatus();
    }, 500);

    const timeout = setTimeout(() => {
      clearInterval(interval);
    }, 8000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
      console.log('[FullScreenVideoModal] Cleaning up status monitoring');
    };
  }, [player, visible]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (visible) {
      console.log('[FullScreenVideoModal] Modal opened');
      setIsLoading(true);
      setHasError(false);
      if (player) {
        const currentStatus = player.status;
        console.log('[FullScreenVideoModal] Current player status:', currentStatus);
        if (currentStatus === 'readyToPlay' || currentStatus === 'paused') {
          player.play();
        }
      }
    } else {
      console.log('[FullScreenVideoModal] Modal closed');
      if (player) {
        player.pause();
      }
    }
  }, [visible, player]);

  // Loading timeout - prevent infinite loading
  useEffect(() => {
    if (!visible || !isLoading) return;

    const timeout = setTimeout(() => {
      console.error('[FullScreenVideoModal] Video loading timeout after 10 seconds');
      setHasError(true);
      setIsLoading(false);
    }, 10000); // 10 seconds

    return () => clearTimeout(timeout);
  }, [visible, isLoading]);

  if (!visible) {
    return null;
  }

  if (!videoUrl || !videoUrl.startsWith('http')) {
    return (
      <Modal
        visible={visible}
        animationType="fade"
        transparent={false}
        onRequestClose={onClose}
        statusBarTranslucent
      >
        <SafeAreaView style={[styles.container, { backgroundColor: '#000000' }]} edges={['top', 'bottom']}>
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={() => {
              if (player) {
                player.pause();
              }
              onClose();
            }} 
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#FFFFFF" />
            <TouchableOpacity style={styles.retryButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <SafeAreaView style={[styles.container, { backgroundColor: '#000000' }]} edges={['top', 'bottom']}>
        {/* Close Button - Positioned at top-left with high z-index */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => {
            console.log('[FullScreenVideoModal] Close button pressed');
            // Stop video playback before closing
            if (player) {
              player.pause();
            }
            onClose();
          }}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={28} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Video Player */}
        <View style={styles.videoContainer} pointerEvents="box-none">
          {isLoading && !hasError && (
            <View style={styles.loadingOverlay} pointerEvents="none">
              <ActivityIndicator size="large" color="#FFFFFF" />
            </View>
          )}

          {hasError ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={48} color="#FFFFFF" />
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => {
                  if (player) {
                    player.pause();
                  }
                  onClose();
                }}
              >
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ) : player ? (
            <VideoView
              player={player}
              style={styles.video}
              contentFit="contain"
              nativeControls={true}
              fullscreenOptions={{ enterFullscreenButton: true }}
              onError={(e) => {
                console.error('[FullScreenVideoModal] VideoView onError callback:', {
                  error: e,
                  errorMessage: e?.message || 'Unknown error',
                  errorCode: e?.code || 'N/A',
                  videoUrl: videoUrl,
                });
                setHasError(true);
                setIsLoading(false);
              }}
            />
          ) : (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={48} color="#FFFFFF" />
              <TouchableOpacity 
                style={styles.retryButton} 
                onPress={() => {
                  if (player) {
                    player.pause();
                  }
                  onClose();
                }}
              >
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 9999,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    // Ensure button is always on top and tappable
    elevation: 10, // Android
    shadowColor: '#000', // iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  videoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 5,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  retryButton: {
    padding: 12,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
});

