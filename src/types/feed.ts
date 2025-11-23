export interface FeedPost {
  id: string;
  type: 'video';
  videoUri: string;
  createdAt: Date | string;
  caption?: string;
  durationSeconds?: number;
  userId?: string;
}

