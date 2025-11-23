import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { fetchUserVideos } from '../../lib/videoService';
import { VideoMetadata } from '../types/video';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_PADDING = 16;
const GRID_GAP = 2;
const GRID_ITEM_SIZE = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP * 2) / 3; // 3 columns with 2px gaps

const MyCapturesScreen: React.FC = () => {
  const { user, profile } = useAuth();
  const [captures, setCaptures] = useState<VideoMetadata[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadCaptures();
    }
  }, [user]);

  const loadCaptures = async () => {
    try {
      setLoading(true);
      if (user) {
        const userVideos = await fetchUserVideos(user.id, 100);
        setCaptures(userVideos);
      }
    } catch (error) {
      console.error('Error loading captures:', error);
    } finally {
      setLoading(false);
    }
  };

  const displayName =
    profile?.full_name || profile?.username || user?.user_metadata?.full_name || 'Runner';
  const handle = profile?.username || user?.email?.split('@')[0] || 'runner';
  const initial = displayName.charAt(0).toUpperCase();

  const openCaptureDetail = (item: VideoMetadata) => {
    // TODO: navigate to capture detail or dare feed screen
    console.log('Open capture:', item.id);
  };

  const renderCaptureItem = ({ item }: { item: VideoMetadata }) => {
    const thumbUri = item.thumbnail_url || item.video_url; // fallback to video URL

    return (
      <TouchableOpacity
        style={styles.gridItem}
        activeOpacity={0.8}
        onPress={() => openCaptureDetail(item)}
      >
        <Image
          source={{ uri: thumbUri }}
          style={styles.gridThumbnail}
          resizeMode="cover"
        />
        <View style={styles.gridOverlay}>
          <Ionicons name="play" size={12} color="#FFFFFF" />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header: avatar + username + stats */}
        <View style={styles.headerSection}>
          <View style={styles.profileRow}>
            <View style={styles.avatarCircle}>
              {profile?.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarInitial}>{initial}</Text>
              )}
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{captures.length}</Text>
                <Text style={styles.statLabel}>captures</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>0</Text>
                <Text style={styles.statLabel}>likes</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>0</Text>
                <Text style={styles.statLabel}>shares</Text>
              </View>
            </View>
          </View>

          {/* Username + handle */}
          <Text style={styles.displayName}>{displayName}</Text>
          <Text style={styles.handle}>@{handle}</Text>
        </View>

        {/* Segment / tabs row */}
        <View style={styles.segmentRow}>
          <View style={[styles.segmentItem, styles.segmentItemActive]}>
            <Text style={styles.segmentLabelActive}>Captures</Text>
          </View>
          {/* future segments can go here */}
        </View>

        {/* Grid of captures */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading captures...</Text>
          </View>
        ) : captures.length > 0 ? (
          <FlatList
            data={captures}
            keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
            numColumns={3}
            scrollEnabled={false}
            columnWrapperStyle={styles.gridRow}
            renderItem={renderCaptureItem}
            contentContainerStyle={styles.gridContent}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No captures yet</Text>
            <Text style={styles.emptySubtitle}>Dares you record will show up here.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  headerSection: {
    marginTop: 20,
    marginBottom: 16,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#03CA59',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarInitial: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000000',
  },
  statsRow: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 2,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  displayName: {
    marginTop: 4,
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  handle: {
    marginTop: 4,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
  },
  segmentRow: {
    flexDirection: 'row',
    marginTop: 20,
    marginBottom: 10,
  },
  segmentItem: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  segmentItemActive: {
    backgroundColor: '#03CA59',
  },
  segmentLabelActive: {
    color: '#000000',
    fontWeight: '600',
    fontSize: 13,
  },
  gridContent: {
    paddingTop: 4,
  },
  gridRow: {
    justifyContent: 'flex-start',
    marginBottom: GRID_GAP,
  },
  gridItem: {
    width: GRID_ITEM_SIZE,
    aspectRatio: 1,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#050608',
    position: 'relative',
    marginRight: GRID_GAP,
  },
  gridThumbnail: {
    width: '100%',
    height: '100%',
  },
  gridOverlay: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  emptyState: {
    marginTop: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 6,
  },
  emptySubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
});

export default MyCapturesScreen;
