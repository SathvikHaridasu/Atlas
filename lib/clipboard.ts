/**
 * Clipboard helper using expo-clipboard
 * 
 * NOTE: expo-clipboard must be installed using:
 * npx expo install expo-clipboard
 */
import * as Clipboard from 'expo-clipboard';
import { Alert } from 'react-native';

/**
 * Copy text to clipboard and show a success/error alert
 * @param text - The text to copy to clipboard
 * @param label - Optional label to show in the success message (e.g., "Join code")
 */
export async function copyToClipboard(text: string, label?: string): Promise<void> {
  try {
    await Clipboard.setStringAsync(text);
    if (label) {
      Alert.alert('Copied', `${label} copied to clipboard!`);
    } else {
      Alert.alert('Copied', 'Copied to clipboard!');
    }
  } catch (error) {
    console.error('[clipboard] Failed to copy', error);
    Alert.alert('Error', 'Could not copy to clipboard.');
  }
}

