import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSaveVideo } from '../hooks/useSaveVideo';

interface SaveVideoButtonProps {
  uri: string;
  disabled?: boolean;
  style?: object;
}

/**
 * Button component for saving videos to camera roll
 * Shows loading state and handles success/error feedback
 */
export default function SaveVideoButton({ uri, disabled = false, style }: SaveVideoButtonProps) {
  const { saveVideo, isSaving, error } = useSaveVideo();

  const handlePress = async () => {
    if (!uri || isSaving || disabled) {
      return;
    }

    await saveVideo(uri);
  };

  return (
    <TouchableOpacity
      style={[styles.button, style, (isSaving || disabled || !uri) && styles.buttonDisabled]}
      onPress={handlePress}
      disabled={isSaving || disabled || !uri}
      activeOpacity={0.7}
    >
      {isSaving ? (
        <View style={styles.content}>
          <ActivityIndicator size="small" color="#FFFFFF" style={styles.spinner} />
          <Text style={styles.buttonText}>Saving...</Text>
        </View>
      ) : (
        <View style={styles.content}>
          <Ionicons name="download-outline" size={18} color="#FFFFFF" style={styles.icon} />
          <Text style={styles.buttonText}>Save to Camera Roll</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#03CA59',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 160,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 8,
  },
  spinner: {
    marginRight: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

