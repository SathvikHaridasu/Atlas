/**
 * AnimatedScreenFade - A simple fade-in animation for screen-level components
 * 
 * Provides a smooth fade-in animation on mount, perfect for screen transitions
 * and full-screen content. Keeps animations subtle and performant.
 * 
 * @example
 * <AnimatedScreenFade duration={300}>
 *   <YourScreenContent />
 * </AnimatedScreenFade>
 */

import React, { useEffect } from 'react';
import { View, ViewStyle, StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

interface AnimatedScreenFadeProps {
  children: React.ReactNode;
  duration?: number;
  style?: StyleProp<ViewStyle>;
}

const AnimatedScreenFade: React.FC<AnimatedScreenFadeProps> = ({
  children,
  duration = 250,
  style,
}) => {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, {
      duration,
    });
  }, [duration]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View style={[animatedStyle, style]}>
      {children}
    </Animated.View>
  );
};

export default AnimatedScreenFade;

// Example:
// <AnimatedScreenFade duration={300}>
//   <YourScreenContent />
// </AnimatedScreenFade>

