import * as FileSystem from 'expo-file-system';
import { supabase } from './supabaseClient';

/**
 * Generate a unique filename
 */
function generateFileName(uri: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  const fileExt = uri.split('.').pop() || 'jpg';
  return `${timestamp}-${random}.${fileExt}`;
}

/**
 * Upload an image to Supabase Storage (Expo-compatible, no Blob API)
 * @param fileUri - Local file URI from expo-image-picker
 * @param bucket - Storage bucket name (default: 'chat-images')
 * @param folder - Folder path within bucket (e.g., 'sessionId')
 * @param fileName - File name (will generate unique name if not provided)
 * @returns Public URL of the uploaded image
 */
export async function uploadImageToStorage(
  fileUri: string,
  bucket: string = 'chat-images',
  folder: string = '',
  fileName?: string
): Promise<string> {
  try {
    // Generate unique filename if not provided
    const uniqueFileName = fileName || generateFileName(fileUri);
    const filePath = folder ? `${folder}/${uniqueFileName}` : uniqueFileName;

    // Convert local file to base64 (Expo-compatible approach)
    const base64 = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Get file extension for content type
    const fileExt = fileUri.split('.').pop() || 'jpg';
    const contentType = fileExt === 'png' ? 'image/png' : 'image/jpeg';

    // Convert base64 to ArrayBuffer (React Native compatible, no Blob API)
    // This is the recommended approach for Supabase Storage in React Native
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const arrayBuffer = bytes.buffer;

    // Upload as ArrayBuffer (React Native compatible)
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, arrayBuffer, {
        contentType,
        upsert: false,
      });

    if (error) {
      console.error('Error uploading image:', error);
      throw new Error(`Failed to upload image: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
    
    if (!urlData?.publicUrl) {
      throw new Error('Failed to get public URL for uploaded image');
    }

    return urlData.publicUrl;
  } catch (error: any) {
    console.error('Error in uploadImageToStorage:', error);
    throw new Error(error.message || 'Failed to upload image');
  }
}

/**
 * Upload a group image to Supabase Storage
 * @param fileUri - Local file URI from expo-image-picker
 * @param sessionId - Session ID to use as filename
 * @returns Public URL of the uploaded image
 */
export async function uploadGroupImage(
  fileUri: string,
  sessionId: string
): Promise<string> {
  return uploadImageToStorage(fileUri, 'group-images', '', `${sessionId}.jpg`);
}

/**
 * Get group image URL
 * @param sessionId - Session ID
 * @returns Public URL or null if image doesn't exist
 */
export async function getGroupImageUrl(sessionId: string): Promise<string | null> {
  try {
    const { data } = supabase.storage.from('group-images').getPublicUrl(`${sessionId}.jpg`);
    return data?.publicUrl || null;
  } catch (error) {
    console.error('Error getting group image URL:', error);
    return null;
  }
}

