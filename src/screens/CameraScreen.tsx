import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type CameraMode = 'video' | 'photo';
type CameraFacing = 'front' | 'back';
type FlashMode = 'auto' | 'on' | 'off';
type Duration = 15 | 30 | 60;

export default function CameraScreen() {
  const navigation = useNavigation();
  const [permission, requestPermission] = useCameraPermissions();

  const [isRecording, setIsRecording] = useState(false);
  const [mode, setMode] = useState<CameraMode>('video');
  const [duration, setDuration] = useState<Duration>(30);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [cameraFacing, setCameraFacing] = useState<CameraFacing>('back');
  const [flashMode, setFlashMode] = useState<FlashMode>('auto');
  const [activeFilterId, setActiveFilterId] = useState<string | undefined>();
  const [lastMediaUri, setLastMediaUri] = useState<string | null>(null);
  const [beautyEnabled, setBeautyEnabled] = useState(false);

  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressAnimRef = useRef(new Animated.Value(0));

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
      }
    };
  }, [isRecording, duration]);

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const handleClose = () => {
    if (isRecording) {
      handleStopRecording();
    }
    navigation.goBack();
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

  const handleModeToggle = () => {
    if (isRecording) return;
    setMode((prev) => (prev === 'video' ? 'photo' : 'video'));
  };

  const handleCapture = async () => {
    if (mode === 'photo') {
      // Photo capture (stub)
      console.log('Photo captured');
      setLastMediaUri('photo://placeholder');
    } else {
      // Video recording toggle
      if (isRecording) {
        handleStopRecording();
      } else {
        handleStartRecording();
      }
    }
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    setElapsedMs(0);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    // Stub: Save video URI
    setLastMediaUri('video://placeholder');
  };

  const handleOpenGallery = () => {
    // Stub handler
    console.log('Open gallery');
  };

  const handleOpenLibrary = () => {
    // Stub handler
    console.log('Open library');
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
    <View style={styles.container}>
      {/* Camera Preview */}
      <CameraView
        style={styles.camera}
        facing={cameraFacing}
        flash={flashMode}
        mode={mode}
      />

      {/* Top Gradient Overlay */}
      <LinearGradient
        colors={['rgba(0,0,0,0.6)', 'transparent']}
        style={styles.topGradient}
        pointerEvents="none"
      />

      {/* Top Bar */}
      <SafeAreaView style={styles.topBar} edges={['top']}>
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
      </SafeAreaView>

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

        {/* Mode Selector */}
        <View style={styles.modeRow}>
          <TouchableOpacity
            style={[
              styles.modeChip,
              mode === 'video' && { backgroundColor: 'rgba(3, 202, 89, 0.2)' },
              { marginRight: 8 },
            ]}
            onPress={() => setMode('video')}
            activeOpacity={0.8}
            disabled={isRecording}
          >
            <Text
              style={[
                styles.modeText,
                { color: mode === 'video' ? '#03CA59' : 'rgba(249, 250, 251, 0.7)' },
              ]}
            >
              VIDEO
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.modeChip,
              mode === 'photo' && { backgroundColor: 'rgba(3, 202, 89, 0.2)' },
            ]}
            onPress={() => setMode('photo')}
            activeOpacity={0.8}
            disabled={isRecording}
          >
            <Text
              style={[
                styles.modeText,
                { color: mode === 'photo' ? '#03CA59' : 'rgba(249, 250, 251, 0.7)' },
              ]}
            >
              PHOTO
            </Text>
          </TouchableOpacity>
        </View>

        {/* Center Area: Capture Button */}
        <View style={styles.captureArea}>
          <View style={styles.captureButtonContainer}>
            {/* Progress Ring (Video Mode Only) */}
            {mode === 'video' && (
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
            )}

            {/* Capture Button */}
            <TouchableOpacity
              style={[
                styles.captureButton,
                {
                  backgroundColor: mode === 'photo' ? '#FFFFFF' : isRecording ? '#FF0000' : '#03CA59',
                  borderColor: '#03CA59',
                },
              ]}
              onPress={handleCapture}
              activeOpacity={0.9}
            >
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
          </View>

          {/* Timer Display (Video Mode Only) */}
          {mode === 'video' && (
            <Text style={styles.timerText}>
              {formatTime(elapsedMs)} / {formatTime(duration * 1000)}
            </Text>
          )}
        </View>

        {/* Bottom Row: Gallery & Library */}
        <View style={styles.bottomRow}>
          {/* Gallery Thumbnail */}
          <TouchableOpacity
            style={styles.galleryThumbnail}
            onPress={handleOpenGallery}
            activeOpacity={0.8}
          >
            {lastMediaUri ? (
              <View style={styles.thumbnailPlaceholder}>
                <Ionicons name="image" size={20} color="#9CA3AF" />
              </View>
            ) : (
              <View style={styles.thumbnailPlaceholder}>
                <Ionicons name="images-outline" size={24} color="#9CA3AF" />
              </View>
            )}
          </TouchableOpacity>

          {/* Library Button */}
          <TouchableOpacity
            style={styles.libraryButton}
            onPress={handleOpenLibrary}
            activeOpacity={0.8}
          >
            <Text style={styles.libraryButtonText}>Library</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
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
    top: 0,
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
    justifyContent: 'space-between',
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
  libraryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#03CA59',
  },
  libraryButtonText: {
    color: '#03CA59',
    fontSize: 14,
    fontWeight: '600',
  },
});

