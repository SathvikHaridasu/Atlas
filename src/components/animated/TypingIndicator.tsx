/**
 * TypingIndicator - Animated typing indicator for chat
 * 
 * Provides a gentle pulsing/bouncing effect to indicate someone is typing.
 * Uses subtle animations that loop continuously without being distracting.
 * 
 * @example
 * <TypingIndicator />
 */

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';

interface TypingIndicatorProps {
  color?: string;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  color = '#03CA59',
}) => {
  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);

  useEffect(() => {
    // Staggered bouncing animation for each dot
    dot1.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 400, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 400, easing: Easing.in(Easing.quad) })
      ),
      -1,
      false
    );

    dot2.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 400 }),
        withTiming(-6, { duration: 400, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 400, easing: Easing.in(Easing.quad) }),
        withTiming(0, { duration: 400 })
      ),
      -1,
      false
    );

    dot3.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 800 }),
        withTiming(-6, { duration: 400, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 400, easing: Easing.in(Easing.quad) }),
        withTiming(0, { duration: 400 })
      ),
      -1,
      false
    );
  }, []);

  const dot1Style = useAnimatedStyle(() => ({
    transform: [{ translateY: dot1.value }],
  }));

  const dot2Style = useAnimatedStyle(() => ({
    transform: [{ translateY: dot2.value }],
  }));

  const dot3Style = useAnimatedStyle(() => ({
    transform: [{ translateY: dot3.value }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.dot, { backgroundColor: color }, dot1Style]} />
      <Animated.View style={[styles.dot, { backgroundColor: color }, dot2Style]} />
      <Animated.View style={[styles.dot, { backgroundColor: color }, dot3Style]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.7,
  },
});

export default TypingIndicator;

// Example:
// <TypingIndicator color="#03CA59" />

