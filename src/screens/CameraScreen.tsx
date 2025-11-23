import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type CameraFacing = 'front' | 'back';
type FlashMode = 'auto' | 'on' | 'off';
type Duration = 15 | 30 | 60;

export default function CameraScreen() {
  const navigation = useNavigation();
  const [permission, requestPermission] = useCameraPermissions();

  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState<Duration>(30);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [cameraFacing, setCameraFacing] = useState<CameraFacing>('back');
  const [flashMode, setFlashMode] = useState<FlashMode>('auto');
  const [activeFilterId, setActiveFilterId] = useState<string | undefined>();
  const [lastVideoUri, setLastVideoUri] = useState<string | null>(null);
  const [beautyEnabled, setBeautyEnabled] = useState(false);
  const [lastTap, setLastTap] = useState<number | null>(null);

  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressAnimRef = useRef(new Animated.Value(0));
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    if (isRecording) {
      // Start timer
      const startTime = Date.now();
      recordingTimerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const maxMs = duration * 1000;
        const currentElapsed = Math.min(elapsed, maxMs);
        setElapsedMs(currentElapsed);

        // Animate progress ring
        const progress = currentElapsed / maxMs;
        Animated.timing(progressAnimRef.current, {
          toValue: progress,
          duration: 100,
          useNativeDriver: false,
        }).start();

        // Auto-stop at duration limit
        if (currentElapsed >= maxMs) {
          handleStopRecording();
        }
      }, 100);
    } else {
      // Stop timer
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      setElapsedMs(0);
      progressAnimRef.current.setValue(0);
    }

    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      // Reset animation on cleanup
      progressAnimRef.current.setValue(0);
    };
  }, [isRecording, duration]);

  // Cleanup when screen loses focus or unmounts
  useFocusEffect(
    useCallback(() => {
      // Screen is focused - camera can be active
      return () => {
        // Screen is losing focus or unmounting - cleanup
        cleanupCamera();
      };
    }, [cleanupCamera])
  );

  // Additional cleanup on unmount
  useEffect(() => {
    return () => {
      // Cleanup on component unmount
      cleanupCamera();
    };
  }, [cleanupCamera]);

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  // Helper function to persist recording
  const persistRecording = async (tempUri: string): Promise<string> => {
    try {
      const fileName = `video_${Date.now()}.mp4`;
      const documentsDir = FileSystem.documentDirectory;
      if (!documentsDir) {
        throw new Error('Documents directory not available');
      }
      const finalUri = `${documentsDir}${fileName}`;
      await FileSystem.moveAsync({
        from: tempUri,
        to: finalUri,
      });
      return finalUri;
    } catch (error) {
      console.error('Error persisting recording:', error);
      throw error;
    }
  };

  const stopRecordingWithoutNavigation = async () => {
    try {
      setIsRecording(false);
      
      // Stop the recording timer
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      setElapsedMs(0);
      progressAnimRef.current.setValue(0);
      
      // Stub: In a real implementation, you would get the video URI from the camera
      // Example: const { uri } = await cameraRef.current.stopRecording();
      // For now, we'll simulate getting a temp URI
      const tempUri = `file://temp/video_${Date.now()}.mp4`;
      
      // Persist the recording (but don't navigate)
      const finalUri = await persistRecording(tempUri);
      setLastVideoUri(finalUri);
    } catch (error) {
      console.error('Error stopping recording:', error);
      setIsRecording(false);
    }
  };

  // Cleanup function to stop camera and clear resources
  const cleanupCamera = useCallback(() => {
    // Stop recording if active
    if (isRecording) {
      setIsRecording(false);
      
      // Stop the recording timer
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      
      // Reset animations
      setElapsedMs(0);
      progressAnimRef.current.setValue(0);
    }
    
    // Clear any timers
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  }, [isRecording]);

  const handleClose = async () => {
    // Stop recording and cleanup
    if (isRecording) {
      await stopRecordingWithoutNavigation();
    }
    
    // Cleanup camera resources
    cleanupCamera();
    
    // Navigate back to unmount the screen properly
    navigation.goBack();
  };

  const handlePreviewTap = () => {
    const now = Date.now();
    if (lastTap && now - lastTap < 300) {
      // Double tap detected
      setCameraFacing((prev) => (prev === 'back' ? 'front' : 'back'));
      setLastTap(null);
    } else {
      setLastTap(now);
    }
  };

  const handleFlipCamera = () => {
    setCameraFacing((prev) => (prev === 'back' ? 'front' : 'back'));
  };

  const handleToggleFlash = () => {
    setFlashMode((prev) => {
      if (prev === 'auto') return 'on';
      if (prev === 'on') return 'off';
      return 'auto';
    });
  };

  const handleToggleFilter = () => {
    setActiveFilterId((prev) => (prev ? undefined : 'filter1'));
  };

  const handleToggleBeauty = () => {
    setBeautyEnabled((prev) => !prev);
  };

  const handleDurationSelect = (dur: Duration) => {
    if (isRecording) return;
    setDuration(dur);
  };

  const handleCapture = async () => {
    // Video recording toggle
    if (isRecording) {
      handleStopRecording();
    } else {
      handleStartRecording();
    }
  };

  const handleStartRecording = async () => {
    try {
      setIsRecording(true);
      setElapsedMs(0);
      // Note: Actual recording start would be handled by CameraView.recordAsync()
      // This is a stub for the recording state - in production, you would call:
      // const recording = await cameraRef.current.recordAsync({ maxDuration: duration });
    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
      setIsRecording(false);
    }
  };

  const handleStopRecording = async () => {
    try {
      setIsRecording(false);
      
      // Stub: In a real implementation, you would get the video URI from the camera
      // Example: const { uri } = await cameraRef.current.stopRecording();
      // For now, we'll simulate getting a temp URI
      const tempUri = `file://temp/video_${Date.now()}.mp4`;
      
      // Persist the recording
      const finalUri = await persistRecording(tempUri);
      setLastVideoUri(finalUri);
      
      // Navigate to ShareToGroup screen
      navigation.navigate('ShareToGroup' as never, { videoUri: finalUri } as never);
    } catch (error) {
      console.error('Error stopping recording:', error);
      Alert.alert('Error', 'There was a problem saving your video. Please try again.');
      setIsRecording(false);
    }
  };

  const handleAddSound = () => {
    // Stub handler
    console.log('Add sound');
  };

  if (!permission) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Camera permission is required</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const progress = elapsedMs / (duration * 1000);

  const flashIconName =
    flashMode === 'auto' ? 'flash-auto' : flashMode === 'on' ? 'flash-on' : 'flash-off';

  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      <View style={styles.container}>
        {/* Camera Preview */}
        <TouchableOpacity
          style={styles.cameraContainer}
          activeOpacity={1}
          onPress={handlePreviewTap}
        >
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing={cameraFacing}
            flash={flashMode}
            mode="video"
          />
        </TouchableOpacity>

      {/* Top Gradient Overlay */}
      <LinearGradient
        colors={['rgba(0,0,0,0.6)', 'transparent']}
        style={styles.topGradient}
        pointerEvents="none"
      />

      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.topBarContent}>
          {/* Left: Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={handleClose} activeOpacity={0.8}>
            <Ionicons name="close" size={28} color="#F9FAFB" />
          </TouchableOpacity>

          {/* Center: Add Sound */}
          <TouchableOpacity
            style={styles.addSoundButton}
            onPress={handleAddSound}
            activeOpacity={0.8}
          >
            <Ionicons name="musical-notes" size={16} color="#F9FAFB" style={{ marginRight: 6 }} />
            <Text style={styles.addSoundText}>Add sound</Text>
          </TouchableOpacity>

          {/* Right: Control Icons */}
          <View style={styles.controlIcons}>
            <TouchableOpacity
              style={[styles.controlIcon, { marginLeft: 16 }]}
              onPress={handleFlipCamera}
              activeOpacity={0.8}
            >
              <Ionicons
                name="camera-reverse"
                size={24}
                color={cameraFacing === 'front' ? '#03CA59' : 'rgba(249, 250, 251, 0.7)'}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.controlIcon}
              onPress={handleToggleFlash}
              activeOpacity={0.8}
            >
              <Ionicons
                name={flashIconName}
                size={24}
                color={flashMode !== 'off' ? '#03CA59' : 'rgba(249, 250, 251, 0.7)'}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.controlIcon}
              onPress={handleToggleFilter}
              activeOpacity={0.8}
            >
              <MaterialIcons
                name="filter"
                size={24}
                color={activeFilterId ? '#03CA59' : 'rgba(249, 250, 251, 0.7)'}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.controlIcon}
              onPress={handleToggleBeauty}
              activeOpacity={0.8}
            >
              <MaterialIcons
                name="face"
                size={24}
                color={beautyEnabled ? '#03CA59' : 'rgba(249, 250, 251, 0.7)'}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Recording Indicator */}
      {isRecording && (
        <View style={styles.recordingIndicator}>
          <View style={styles.recordingDot} />
          <Text style={styles.recordingText}>REC</Text>
        </View>
      )}

      {/* Bottom Gradient Overlay */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.6)']}
        style={styles.bottomGradient}
        pointerEvents="none"
      />

      {/* Bottom Controls */}
      <SafeAreaView style={styles.bottomControls} edges={['bottom']}>
        {/* Duration Selector */}
        <View style={styles.durationRow}>
          {([15, 30, 60] as Duration[]).map((dur, index) => {
            const isSelected = duration === dur;
            return (
              <TouchableOpacity
                key={dur}
                style={[
                  styles.durationChip,
                  isSelected && { backgroundColor: '#03CA59' },
                  !isSelected && { borderWidth: 1, borderColor: 'rgba(249, 250, 251, 0.3)' },
                  index > 0 && { marginLeft: 12 },
                ]}
                onPress={() => handleDurationSelect(dur)}
                activeOpacity={0.8}
                disabled={isRecording}
              >
                <Text
                  style={[
                    styles.durationText,
                    { color: isSelected ? '#020617' : 'rgba(249, 250, 251, 0.7)' },
                  ]}
                >
                  {dur}s
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Mode Badge - Video Only */}
        <View style={styles.modeRow}>
          <View style={[styles.modeChip, { backgroundColor: 'rgba(3, 202, 89, 0.2)' }]}>
            <Text style={[styles.modeText, { color: '#03CA59' }]}>VIDEO</Text>
          </View>
        </View>

        {/* Center Area: Capture Button */}
        <View style={styles.captureArea}>
          <View style={styles.captureButtonContainer}>
            {/* Progress Ring */}
            <View style={styles.progressRingContainer}>
              <View
                style={[
                  styles.progressRingBackground,
                  {
                    borderColor: isRecording ? 'rgba(255, 0, 0, 0.3)' : 'rgba(3, 202, 89, 0.3)',
                  },
                ]}
              />
              {isRecording && (
                <Animated.View
                  style={[
                    styles.progressRingFill,
                    {
                      borderColor: '#FF0000',
                      borderWidth: 4,
                      width: 90,
                      height: 90,
                      borderRadius: 45,
                      borderTopColor: '#FF0000',
                      borderRightColor: progressAnimRef.current.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: ['transparent', '#FF0000', '#FF0000'],
                      }) as any,
                      borderBottomColor: progressAnimRef.current.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: ['transparent', 'transparent', '#FF0000'],
                      }) as any,
                      borderLeftColor: progressAnimRef.current.interpolate({
                        inputRange: [0, 0.25, 0.5, 0.75, 1],
                        outputRange: ['transparent', 'transparent', 'transparent', 'transparent', '#FF0000'],
                      }) as any,
                      transform: [
                        {
                          rotate: progressAnimRef.current.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['-90deg', '270deg'],
                          }) as any,
                        },
                      ],
                    },
                  ]}
                />
              )}
            </View>

            {/* Capture Button */}
            <TouchableOpacity
              style={[
                styles.captureButton,
                {
                  backgroundColor: isRecording ? '#FF0000' : '#03CA59',
                  borderColor: '#03CA59',
                },
              ]}
              onPress={handleCapture}
              activeOpacity={0.9}
            >
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
          </View>

          {/* Timer Display */}
          <Text style={styles.timerText}>
            {formatTime(elapsedMs)} / {formatTime(duration * 1000)}
          </Text>
        </View>

        {/* Bottom Row: Gallery Thumbnail */}
        <View style={styles.bottomRow}>
          {/* Gallery Thumbnail */}
          <TouchableOpacity
            style={styles.galleryThumbnail}
            activeOpacity={0.8}
          >
            {lastVideoUri ? (
              <View style={styles.thumbnailPlaceholder}>
                <Ionicons name="videocam" size={20} color="#9CA3AF" />
              </View>
            ) : (
              <View style={styles.thumbnailPlaceholder}>
                <Ionicons name="videocam-outline" size={24} color="#9CA3AF" />
              </View>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000',
  },
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  cameraContainer: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  camera: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#020202',
  },
  permissionText: {
    color: '#F9FAFB',
    fontSize: 16,
    marginBottom: 16,
  },
  permissionButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#03CA59',
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#020617',
    fontSize: 16,
    fontWeight: '600',
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  topBar: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  topBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addSoundButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addSoundText: {
    color: '#F9FAFB',
    fontSize: 14,
    fontWeight: '600',
  },
  controlIcons: {
    flexDirection: 'row',
  },
  controlIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingIndicator: {
    position: 'absolute',
    top: 60,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    zIndex: 20,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    marginRight: 6,
  },
  recordingText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 300,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  durationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  durationChip: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 999,
  },
  durationText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  modeChip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 4,
  },
  modeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  captureArea: {
    alignItems: 'center',
    marginBottom: 16,
  },
  captureButtonContainer: {
    width: 90,
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressRingContainer: {
    position: 'absolute',
    width: 90,
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressRingBackground: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 4,
  },
  progressRingFill: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 4,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  timerText: {
    color: '#F9FAFB',
    fontSize: 14,
    fontWeight: '600',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  galleryThumbnail: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

