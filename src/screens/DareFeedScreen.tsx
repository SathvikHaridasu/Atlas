import React from 'react';
import { Dimensions, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../contexts/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Calculate grid item size for 3 columns with padding and gaps
// Items are vertical rectangles with height:width ratio of 1.4:1
const CONTAINER_PADDING = 16;
const GAP = 8;
const HEIGHT_TO_WIDTH_RATIO = 1.4;
// For 3 columns: 3 * width + 2 * GAP + 2 * CONTAINER_PADDING = SCREEN_WIDTH
// height = 1.4 * width
const ITEM_WIDTH = (SCREEN_WIDTH - CONTAINER_PADDING * 2 - GAP * 2) / 3;
const ITEM_HEIGHT = ITEM_WIDTH * HEIGHT_TO_WIDTH_RATIO;

// Generate placeholder data - will be replaced with video data later
const PLACEHOLDER_COUNT = 30;
const placeholders = Array.from({ length: PLACEHOLDER_COUNT }, (_, i) => ({
  id: i,
  // Future properties: videoUri, thumbnailUri, userId, userName, etc.
}));

export default function DareFeedScreen() {
  const { theme } = useAppTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          {placeholders.map((item, index) => {
            // Calculate margin for spacing: right margin for all except last in row, bottom margin for all except last row
            const isLastInRow = (index + 1) % 3 === 0;
            const isLastRow = index >= PLACEHOLDER_COUNT - 3;
            
            return (
              <View
                key={item.id}
                style={[
                  styles.placeholderBox,
                  !isLastInRow && styles.marginRight,
                  !isLastRow && styles.marginBottom,
                ]}
              />
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: CONTAINER_PADDING,
    paddingBottom: 32,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  placeholderBox: {
    width: ITEM_WIDTH,
    height: ITEM_HEIGHT,
    backgroundColor: '#1B1B1B',
    borderRadius: 10,
  },
  marginRight: {
    marginRight: GAP,
  },
  marginBottom: {
    marginBottom: GAP,
  },
});

