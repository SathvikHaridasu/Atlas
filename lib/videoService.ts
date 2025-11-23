/**
 * Video upload and management service for Supabase Storage and Database
 * 
 * IMPORTANT: React Native Compatibility
 * - React Native's fetch() Response object does NOT support .blob() method
 * - expo-file-system v19 provides File class that implements Blob with arrayBuffer()
 * - Use File.arrayBuffer() directly - no Base64 conversion needed
 * - Supabase Storage accepts ArrayBuffer, which works perfectly in React Native
 * 
 * Updated to use expo-file-system v19 File API.
 * - Uses File class with arrayBuffer() method (React Native compatible)
 * - More efficient than Base64 encoding - direct binary read
 * - Works seamlessly with Supabase Storage upload
 */

import { File } from 'expo-file-system';
import { supabase } from './supabaseClient';
import { VideoMetadata, VideoUploadOptions, VideoUploadProgress } from '../src/types/video';

/**
 * Upload a video file to Supabase Storage
 * 
 * This function uses the expo-file-system v19 File API:
 * 1. Create File instance from local URI
 * 2. Call file.arrayBuffer() to get ArrayBuffer directly
 * 3. Upload ArrayBuffer directly to Supabase Storage
 * 
 * This is the modern, efficient approach for expo-file-system v19.
 * 
 * @param localUri - Local file URI from camera recording or file picker
 * @param userId - Current user ID
 * @param options - Upload options including progress callback
 * @returns Public URL of the uploaded video
 */
export async function uploadVideoToStorage(
  localUri: string,
  userId: string,
  options: VideoUploadOptions = {}
): Promise<string> {
  try {
    // Determine file extension for content type
    const fileExt = localUri.split('.').pop() ?? 'mp4';
    
    // Generate file path: {userId}/{timestamp}.{ext}
    // Note: The bucket name 'videos' is specified in .from('videos'), not in the path
    const filePath = `${userId}/${Date.now()}.${fileExt}`;

    // Use new File API from expo-file-system v19 (React Native compatible)
    // File class implements Blob and provides arrayBuffer() directly
    // This is more efficient than Base64 encoding and works perfectly with Supabase
    const file = new File(localUri);
    const arrayBuffer = await file.arrayBuffer();

    // Get file size from ArrayBuffer for progress tracking
    const fileSize = arrayBuffer.byteLength || 0;

    // Determine content type based on file extension
    const contentType = `video/${fileExt === 'mov' ? 'quicktime' : 'mp4'}`;

    // Upload progress simulation
    // Note: Supabase Storage doesn't support progress callbacks in React Native
    // We simulate progress for better UX, but actual upload happens atomically
    if (options.onProgress) {
      // Report start
      options.onProgress({ 
        loaded: 0, 
        total: fileSize || 100, 
        percentage: 0 
      });
      
      // Simulate progress during upload
      const progressInterval = setInterval(() => {
        if (options.onProgress) {
          options.onProgress({ 
            loaded: Math.floor((fileSize || 100) * 0.5), 
            total: fileSize || 100, 
            percentage: 50 
          });
        }
      }, 100);
      
      // Clear interval after a short delay
      setTimeout(() => clearInterval(progressInterval), 500);
    }

    // Upload ArrayBuffer to Supabase Storage
    // ArrayBuffer is React Native compatible and works perfectly with Supabase
    // This matches the proven pattern used in storageService.ts for image uploads
    const { data, error } = await supabase.storage
      .from('videos')
      .upload(filePath, arrayBuffer, {
        contentType,
        cacheControl: '3600',
        upsert: false,
      });

    // Handle upload errors
    if (error) {
      console.error('Error uploading video:', error);
      throw error;
    }

    // Report completion
    if (options.onProgress) {
      options.onProgress({ 
        loaded: fileSize || 100, 
        total: fileSize || 100, 
        percentage: 100 
      });
    }

    // Get public URL from Supabase Storage
    const { data: urlData } = supabase.storage.from('videos').getPublicUrl(filePath);
    
    if (!urlData?.publicUrl) {
      throw new Error('Failed to get public URL for uploaded video');
    }

    // Validate URL format
    const publicUrl = urlData.publicUrl;
    if (!publicUrl || !publicUrl.startsWith('http://') && !publicUrl.startsWith('https://')) {
      throw new Error('Invalid Supabase video URL: URL must start with http:// or https://');
    }

    return publicUrl;
  } catch (err) {
    console.error('Error in uploadVideoToStorage:', err);
    throw err;
  }
}

/**
 * Insert video metadata into the database
 * @param metadata - Video metadata including user_id and video_url
 * @returns Created video record
 */
export async function insertVideoMetadata(metadata: VideoMetadata): Promise<VideoMetadata> {
  try {
    const { data, error } = await supabase
      .from('videos')
      .insert({
        user_id: metadata.user_id,
        title: metadata.title || null,
        description: metadata.description || null,
        video_url: metadata.video_url,
        thumbnail_url: metadata.thumbnail_url || null,
        duration: metadata.duration || null,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting video metadata:', error);
      throw new Error(`Failed to insert video metadata: ${error.message}`);
    }

    return data;
  } catch (err) {
    console.error('Error in insertVideoMetadata:', err);
    throw err;
  }
}

/**
 * Upload video and save metadata in one operation
 * @param fileUri - Local file URI from camera recording
 * @param userId - Current user ID
 * @param options - Upload options including title, description, and progress callback
 * @returns Created video record with metadata
 */
export async function uploadVideo(
  fileUri: string,
  userId: string,
  options: VideoUploadOptions = {}
): Promise<VideoMetadata> {
  try {
    // Step 1: Upload video to storage
    const videoUrl = await uploadVideoToStorage(fileUri, userId, options);

    // Step 2: Get video duration if available (optional)
    // Note: Getting duration requires video processing which can be expensive
    // For now, we'll skip it and allow it to be set later

    // Step 3: Insert metadata into database
    const metadata: VideoMetadata = {
      user_id: userId,
      title: options.title,
      description: options.description,
      video_url: videoUrl,
      duration: undefined, // Can be set later
    };

    const createdVideo = await insertVideoMetadata(metadata);

    return createdVideo;
  } catch (err) {
    console.error('Error in uploadVideo:', err);
    throw err;
  }
}

/**
 * Fetch all videos from the database
 * @param limit - Maximum number of videos to fetch (default: 50)
 * @returns Array of video metadata
 */
export async function fetchVideos(limit: number = 50): Promise<VideoMetadata[]> {
  try {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching videos:', error);
      throw new Error(`Failed to fetch videos: ${error.message}`);
    }

    return data || [];
  } catch (err) {
    console.error('Error in fetchVideos:', err);
    throw err;
  }
}

/**
 * Fetch videos for a specific user
 * @param userId - User ID to fetch videos for
 * @param limit - Maximum number of videos to fetch (default: 50)
 * @returns Array of video metadata
 */
export async function fetchUserVideos(userId: string, limit: number = 50): Promise<VideoMetadata[]> {
  try {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching user videos:', error);
      throw new Error(`Failed to fetch user videos: ${error.message}`);
    }

    return data || [];
  } catch (err) {
    console.error('Error in fetchUserVideos:', err);
    throw err;
  }
}

/**
 * Delete a video from storage and database
 * @param videoId - Video ID to delete
 * @param userId - User ID (for RLS verification)
 * @returns Success status
 */
export async function deleteVideo(videoId: string, userId: string): Promise<boolean> {
  try {
    // First, get the video to find the storage path
    const { data: video, error: fetchError } = await supabase
      .from('videos')
      .select('video_url')
      .eq('id', videoId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !video) {
      throw new Error('Video not found or access denied');
    }

    // Extract path from URL
    const url = new URL(video.video_url);
    const pathParts = url.pathname.split('/');
    const storagePath = pathParts.slice(pathParts.indexOf('videos')).join('/');

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('videos')
      .remove([storagePath]);

    if (storageError) {
      console.error('Error deleting video from storage:', storageError);
      // Continue to delete from database even if storage deletion fails
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('videos')
      .delete()
      .eq('id', videoId)
      .eq('user_id', userId);

    if (dbError) {
      console.error('Error deleting video from database:', dbError);
      throw new Error(`Failed to delete video: ${dbError.message}`);
    }

    return true;
  } catch (err) {
    console.error('Error in deleteVideo:', err);
    throw err;
  }
}

