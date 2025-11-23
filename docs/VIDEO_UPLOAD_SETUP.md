# Video Upload System Setup Guide

This guide explains how to set up the video upload and display system in your Atlas app.

## Prerequisites

1. Supabase project with authentication enabled
2. Supabase Storage bucket named `videos` created
3. Database migration for `videos` table applied

## Setup Steps

### 1. Create Supabase Storage Bucket

1. Go to your Supabase Dashboard
2. Navigate to **Storage** → **Buckets**
3. Click **New bucket**
4. Name it `videos`
5. Set it to **Public** (or configure custom policies)
6. Click **Create bucket**

### 2. Configure Storage Policies

In Supabase Dashboard → Storage → Policies → `videos` bucket:

**Policy 1: Allow authenticated users to upload**
- Policy name: `Authenticated users can upload videos`
- Allowed operation: `INSERT`
- Policy definition:
```sql
bucket_id = 'videos' AND auth.role() = 'authenticated'
```

**Policy 2: Allow public read access**
- Policy name: `Public can view videos`
- Allowed operation: `SELECT`
- Policy definition:
```sql
bucket_id = 'videos'
```

**Policy 3: Allow users to delete their own videos**
- Policy name: `Users can delete their own videos`
- Allowed operation: `DELETE`
- Policy definition:
```sql
bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]
```

### 3. Run Database Migration

1. Go to Supabase Dashboard → **SQL Editor**
2. Copy and paste the contents of `supabase/migrations/20250103_create_videos_table.sql`
3. Click **Run** to execute the migration

This will create:
- `videos` table with proper schema
- Indexes for performance
- Row Level Security (RLS) policies
- Automatic `updated_at` timestamp trigger

### 4. Verify Setup

After setup, you should be able to:

1. **Record videos** in the Camera screen
2. **Upload videos** via the upload modal (appears after recording)
3. **View videos** in the Video Catalog screen
4. **Delete videos** (only your own videos)

## Usage

### Recording and Uploading Videos

1. Open the Camera screen
2. Record a video (15s, 30s, or 60s)
3. After recording completes, a modal will appear asking if you want to upload
4. Optionally add a title and description
5. Click **Upload** to upload to Supabase
6. The video will be saved to `videos/{user_id}/{timestamp}-{random}.mp4`

### Viewing Videos

1. Navigate to the Video Catalog screen
2. All uploaded videos will be displayed in a list
3. Tap the play button to play/pause videos
4. Videos are sorted by creation date (newest first)

### Deleting Videos

1. In the Video Catalog screen, find your video
2. Tap the trash icon on your own videos
3. Confirm deletion
4. The video will be removed from both storage and database

## File Structure

```
lib/
  videoService.ts          # Video upload and database operations
src/
  components/
    VideoUploadModal.tsx   # Upload prompt modal
  screens/
    VideoCatalogScreen.tsx  # Video display and playback
    CameraScreen.tsx        # Recording (updated with upload modal)
  types/
    video.ts                # TypeScript interfaces
supabase/
  migrations/
    20250103_create_videos_table.sql  # Database migration
```

## API Reference

### `uploadVideo(fileUri, userId, options)`

Uploads a video to Supabase Storage and saves metadata to database.

**Parameters:**
- `fileUri: string` - Local file URI from camera recording
- `userId: string` - Current user ID
- `options: VideoUploadOptions` - Optional title, description, and progress callback

**Returns:** `Promise<VideoMetadata>`

### `fetchVideos(limit)`

Fetches all videos from the database.

**Parameters:**
- `limit: number` - Maximum number of videos (default: 50)

**Returns:** `Promise<VideoMetadata[]>`

### `fetchUserVideos(userId, limit)`

Fetches videos for a specific user.

**Parameters:**
- `userId: string` - User ID
- `limit: number` - Maximum number of videos (default: 50)

**Returns:** `Promise<VideoMetadata[]>`

### `deleteVideo(videoId, userId)`

Deletes a video from storage and database.

**Parameters:**
- `videoId: string` - Video ID
- `userId: string` - User ID (for RLS verification)

**Returns:** `Promise<boolean>`

## Troubleshooting

### "Failed to upload video" error

- Check that the `videos` bucket exists in Supabase Storage
- Verify storage policies allow authenticated users to upload
- Check file size limits (Supabase default is 50MB)

### "Failed to insert video metadata" error

- Verify the database migration has been run
- Check RLS policies allow users to insert their own videos
- Ensure user is authenticated

### Videos not displaying

- Check that videos bucket is set to public or has read policies
- Verify video URLs are accessible
- Check network connectivity

## Future Enhancements

- [ ] Automatic thumbnail generation
- [ ] Video compression before upload
- [ ] Chunked uploads for large files
- [ ] HLS streaming for long videos
- [ ] Video editing capabilities
- [ ] Privacy settings (public/private)
- [ ] GPS/route metadata
- [ ] Video comments and likes

