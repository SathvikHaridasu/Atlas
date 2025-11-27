/**
 * AnimatedCard - A reusable animated wrapper for cards and containers
 * 
 * Provides a smooth fade-in and slide-up animation on mount.
 * Perfect for lists, grids, and card-based layouts.
 * 
 * @example
 * <AnimatedCard delay={100} from="bottom">
 *   <YourExistingCard />
 * </AnimatedCard>
 */

import React, { useEffect } from 'react';
import { View, ViewStyle, StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
} from 'react-native-reanimated';

interface AnimatedCardProps {
  children: React.ReactNode;
  delay?: number;
  from?: 'bottom' | 'top' | 'left' | 'right';
  style?: StyleProp<ViewStyle>;
}

const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  delay = 0,
  from = 'bottom',
  style,
}) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  const translateX = useSharedValue(0);

  useEffect(() => {
    // Set initial position based on direction
    switch (from) {
      case 'top':
        translateY.value = -20;
        break;
      case 'left':
        translateX.value = -20;
        translateY.value = 0;
        break;
      case 'right':
        translateX.value = 20;
        translateY.value = 0;
        break;
      case 'bottom':
      default:
        translateY.value = 20;
        translateX.value = 0;
        break;
    }

    // Animate to final position
    opacity.value = withDelay(
      delay,
      withSpring(1, {
        damping: 15,
        stiffness: 150,
        mass: 0.8,
      })
    );
    translateY.value = withDelay(
      delay,
      withSpring(0, {
        damping: 15,
        stiffness: 150,
        mass: 0.8,
      })
    );
    translateX.value = withDelay(
      delay,
      withSpring(0, {
        damping: 15,
        stiffness: 150,
        mass: 0.8,
      })
    );
  }, [delay, from]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        { translateY: translateY.value },
        { translateX: translateX.value },
      ],
    };
  });

  return (
    <Animated.View style={[animatedStyle, style]}>
      {children}
    </Animated.View>
  );
};

export default AnimatedCard;

// Example:
// <AnimatedCard delay={100} from="bottom">
//   <YourExistingCard />
// </AnimatedCard>

