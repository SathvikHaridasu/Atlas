import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFeed } from '../contexts/FeedContext';
import { useAppTheme } from '../contexts/ThemeContext';
import { FeedPost } from '../types/feed';

export default function FeedScreen() {
  const { theme } = useAppTheme();
  const { posts } = useFeed();
  const navigation = useNavigation();

  const formatDate = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const renderPost = ({ item }: { item: FeedPost }) => {
    return (
      <View style={[styles.postCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.postHeader}>
          <View style={[styles.avatar, { backgroundColor: theme.accent }]}>
            <Ionicons name="person" size={20} color="#020617" />
          </View>
          <View style={styles.postHeaderText}>
            <Text style={[styles.postAuthor, { color: theme.text }]}>You</Text>
            <Text style={[styles.postDate, { color: theme.mutedText }]}>{formatDate(item.createdAt)}</Text>
          </View>
        </View>
        <View style={[styles.videoPreview, { backgroundColor: theme.background }]}>
          <Ionicons name="videocam" size={40} color={theme.mutedText} />
          <Text style={[styles.videoLabel, { color: theme.mutedText }]}>Video</Text>
          {item.durationSeconds && (
            <Text style={[styles.durationLabel, { color: theme.mutedText }]}>
              {Math.floor(item.durationSeconds / 60)}:{(item.durationSeconds % 60).toString().padStart(2, '0')}
            </Text>
          )}
        </View>
        {item.caption && (
          <Text style={[styles.caption, { color: theme.text }]}>{item.caption}</Text>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Feed</Text>
      </View>
      {posts.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="videocam-outline" size={64} color={theme.mutedText} />
          <Text style={[styles.emptyText, { color: theme.mutedText }]}>No posts yet</Text>
          <Text style={[styles.emptySubtext, { color: theme.mutedText }]}>
            Record a run to share it with your feed
          </Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          renderItem={renderPost}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
  },
  postCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  postHeaderText: {
    flex: 1,
  },
  postAuthor: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  postDate: {
    fontSize: 12,
  },
  videoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  videoLabel: {
    marginTop: 8,
    fontSize: 14,
  },
  durationLabel: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    fontSize: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  caption: {
    fontSize: 14,
    lineHeight: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
});

