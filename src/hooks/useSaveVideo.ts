import * as MediaLibrary from 'expo-media-library';
import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { requestSavePermission } from '../utils/mediaPermissions';

interface UseSaveVideoReturn {
  saveVideo: (uri: string) => Promise<boolean>;
  isSaving: boolean;
  error: string | null;
  success: boolean;
}

/**
 * Hook for saving videos to the camera roll/photo library
 * @returns Object with saveVideo function and state
 */
export function useSaveVideo(): UseSaveVideoReturn {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const saveVideo = useCallback(async (uri: string): Promise<boolean> => {
    if (!uri) {
      setError('No video URI provided');
      return false;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      // Request permission first
      const hasPermission = await requestSavePermission();
      if (!hasPermission) {
        setError('Permission denied');
        setIsSaving(false);
        return false;
      }

      // Save the video to the camera roll
      const asset = await MediaLibrary.createAssetAsync(uri);

      if (asset) {
        setSuccess(true);
        setIsSaving(false);
        
        // Show success message
        Alert.alert('Success', 'Video saved to camera roll!', [{ text: 'OK' }]);
        
        // Reset success state after a delay
        setTimeout(() => {
          setSuccess(false);
        }, 3000);

        return true;
      } else {
        throw new Error('Failed to create asset');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save video';
      console.error('Error saving video:', err);
      setError(errorMessage);
      setIsSaving(false);
      
      Alert.alert(
        'Error',
        `Failed to save video: ${errorMessage}`,
        [{ text: 'OK' }]
      );

      return false;
    }
  }, []);

  return {
    saveVideo,
    isSaving,
    error,
    success,
  };
}


