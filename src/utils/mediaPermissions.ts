import * as MediaLibrary from 'expo-media-library';
import { Alert, Platform } from 'react-native';

/**
 * Request permission to save media to the camera roll/photo library
 * @returns Promise<boolean> - true if permission granted, false otherwise
 */
export async function requestSavePermission(): Promise<boolean> {
  try {
    // Check current permission status
    const { status: currentStatus } = await MediaLibrary.getPermissionsAsync();

    if (currentStatus === 'granted') {
      return true;
    }

    // Request permission
    const { status } = await MediaLibrary.requestPermissionsAsync();

    if (status === 'granted') {
      return true;
    }

    // Permission denied
    if (Platform.OS === 'ios') {
      Alert.alert(
        'Permission Required',
        'This app needs access to your photo library to save videos. Please enable it in Settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open Settings',
            onPress: () => {
              // On iOS, we can't programmatically open Settings, but the alert guides the user
              console.log('User needs to open Settings manually');
            },
          },
        ]
      );
    } else {
      Alert.alert(
        'Permission Required',
        'This app needs storage permission to save videos. Please grant permission in app settings.',
        [{ text: 'OK' }]
      );
    }

    return false;
  } catch (error) {
    console.error('Error requesting media library permission:', error);
    Alert.alert(
      'Error',
      'Failed to request permission. Please try again or check your app settings.',
      [{ text: 'OK' }]
    );
    return false;
  }
}

