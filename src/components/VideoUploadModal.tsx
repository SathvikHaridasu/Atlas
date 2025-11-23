/**
 * Video Upload Modal Component
 * Shows a prompt after video recording to upload to platform
 */

import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useAppTheme } from '../contexts/ThemeContext';
import { uploadVideo } from '../../lib/videoService';
import { VideoUploadProgress } from '../types/video';

interface VideoUploadModalProps {
  visible: boolean;
  videoUri: string | null;
  videoDuration?: number; // in seconds
  onClose: () => void;
  onUploadComplete?: () => void;
  onDiscard?: () => void;
}

export default function VideoUploadModal({
  visible,
  videoUri,
  videoDuration,
  onClose,
  onUploadComplete,
  onDiscard,
}: VideoUploadModalProps) {
  const { user } = useAuth();
  const { theme } = useAppTheme();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleUpload = async () => {
    if (!videoUri || !user) {
      Alert.alert('Error', 'Video or user information is missing');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      await uploadVideo(videoUri, user.id, {
        title: title.trim() || undefined,
        description: description.trim() || undefined,
        onProgress: (progress: VideoUploadProgress) => {
          setUploadProgress(progress.percentage);
        },
      });

      // Reset form
      setTitle('');
      setDescription('');
      setUploadProgress(0);
      setIsUploading(false);

      // Call completion callback
      if (onUploadComplete) {
        onUploadComplete();
      }

      // Close modal
      onClose();

      Alert.alert('Success', 'Video uploaded successfully!');
    } catch (error: any) {
      console.error('Error uploading video:', error);
      setIsUploading(false);
      setUploadProgress(0);
      Alert.alert('Upload Failed', error.message || 'Failed to upload video. Please try again.');
    }
  };

  const handleDiscard = () => {
    // Reset form
    setTitle('');
    setDescription('');
    setUploadProgress(0);
    setIsUploading(false);

    if (onDiscard) {
      onDiscard();
    }

    onClose();
  };

  const handleClose = () => {
    if (isUploading) {
      Alert.alert(
        'Upload in Progress',
        'Video is currently uploading. Please wait or discard the upload.',
        [{ text: 'OK' }]
      );
      return;
    }
    handleDiscard();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.modalBackdrop}>
        <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {/* Header */}
          <Text style={[styles.modalTitle, { color: theme.text }]}>
            Upload Video to Platform?
          </Text>

          {/* Video Info */}
          {videoDuration !== undefined && (
            <Text style={[styles.videoInfo, { color: theme.mutedText }]}>
              Duration: {formatDuration(videoDuration)}
            </Text>
          )}

          {/* Title Input */}
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: theme.text }]}>Title (Optional)</Text>
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
              editable={!isUploading}
              maxLength={100}
            />
          </View>

          {/* Description Input */}
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: theme.text }]}>Description (Optional)</Text>
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
              editable={!isUploading}
              multiline
              numberOfLines={3}
              maxLength={500}
            />
          </View>

          {/* Upload Progress */}
          {isUploading && (
            <View style={styles.progressContainer}>
              <ActivityIndicator size="small" color={theme.accent} />
              <Text style={[styles.progressText, { color: theme.mutedText }]}>
                Uploading... {uploadProgress}%
              </Text>
              <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
                <View
                  style={[
                    styles.progressFill,
                    { backgroundColor: theme.accent, width: `${uploadProgress}%` },
                  ]}
                />
              </View>
            </View>
          )}

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.button,
                styles.buttonSecondary,
                { borderColor: theme.border },
                isUploading && styles.buttonDisabled,
              ]}
              onPress={handleDiscard}
              disabled={isUploading}
              activeOpacity={0.8}
            >
              <Text style={[styles.buttonTextSecondary, { color: theme.mutedText }]}>
                Discard
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.buttonPrimary,
                { backgroundColor: theme.accent },
                isUploading && styles.buttonDisabled,
              ]}
              onPress={handleUpload}
              disabled={isUploading || !videoUri}
              activeOpacity={0.8}
            >
              {isUploading ? (
                <ActivityIndicator size="small" color="#020617" />
              ) : (
                <Text style={[styles.buttonTextPrimary, { color: '#020617' }]}>Upload</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
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

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  videoInfo: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  progressContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  progressText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    // backgroundColor set dynamically
  },
  buttonSecondary: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonTextPrimary: {
    fontSize: 16,
    fontWeight: '700',
  },
  buttonTextSecondary: {
    fontSize: 16,
    fontWeight: '600',
  },
});

