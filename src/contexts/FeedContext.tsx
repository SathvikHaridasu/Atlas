import React, { createContext, ReactNode, useContext, useState } from 'react';
import { FeedPost } from '../types/feed';

interface FeedContextValue {
  posts: FeedPost[];
  addPost: (post: FeedPost) => void;
  getPosts: () => FeedPost[];
}

const FeedContext = createContext<FeedContextValue | undefined>(undefined);

export const FeedProvider = ({ children }: { children: ReactNode }) => {
  const [posts, setPosts] = useState<FeedPost[]>([]);

  const addPost = (post: FeedPost) => {
    setPosts((prevPosts) => [post, ...prevPosts]);
  };

  const getPosts = () => {
    return posts;
  };

  return (
    <FeedContext.Provider value={{ posts, addPost, getPosts }}>
      {children}
    </FeedContext.Provider>
  );
};

export const useFeed = () => {
  const ctx = useContext(FeedContext);
  if (!ctx) throw new Error('useFeed must be used inside FeedProvider');
  return ctx;
};

