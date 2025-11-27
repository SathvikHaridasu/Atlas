/**
 * AnimatedMessageBubble - Wrapper for chat message bubbles with fade-in and slide-up animation
 * 
 * Provides smooth animation when new messages appear in the chat.
 * Fades in from opacity 0 to 1 and slides up slightly from below.
 * 
 * @example
 * <AnimatedMessageBubble>
 *   <YourMessageBubble />
 * </AnimatedMessageBubble>
 */

import React, { useEffect } from 'react';
import { View, ViewStyle, StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

interface AnimatedMessageBubbleProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

const AnimatedMessageBubble: React.FC<AnimatedMessageBubbleProps> = ({
  children,
  style,
}) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(10);

  useEffect(() => {
    // Animate in on mount
    opacity.value = withSpring(1, {
      damping: 15,
      stiffness: 200,
      mass: 0.6,
    });
    translateY.value = withSpring(0, {
      damping: 15,
      stiffness: 200,
      mass: 0.6,
    });
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    };
  });

  return (
    <Animated.View style={[animatedStyle, style]}>
      {children}
    </Animated.View>
  );
};

export default AnimatedMessageBubble;

// Example:
// <AnimatedMessageBubble>
//   <YourMessageBubble />
// </AnimatedMessageBubble>

