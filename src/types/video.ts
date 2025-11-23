/**
 * Video types and interfaces for the video upload system
 */

export interface VideoMetadata {
  id?: string;
  user_id: string;
  title?: string;
  description?: string;
  video_url: string;
  thumbnail_url?: string;
  duration?: number; // in seconds
  created_at?: string;
  updated_at?: string;
}

export interface VideoUploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface VideoUploadOptions {
  title?: string;
  description?: string;
  onProgress?: (progress: VideoUploadProgress) => void;
}

