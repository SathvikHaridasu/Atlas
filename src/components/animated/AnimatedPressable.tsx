/**
 * AnimatedPressable - A Pressable wrapper with smooth scale animation
 * 
 * Provides tactile feedback on press with a subtle scale animation.
 * Use for buttons, cards, grid items, and any interactive elements.
 * 
 * @example
 * <AnimatedPressable onPress={handlePress}>
 *   <YourButtonContent />
 * </AnimatedPressable>
 */

import React from 'react';
import {
  Pressable,
  PressableProps,
  StyleProp,
  ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

const AnimatedPressableComponent = Animated.createAnimatedComponent(Pressable);

interface AnimatedPressableProps extends Omit<PressableProps, 'style'> {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

const AnimatedPressable: React.FC<AnimatedPressableProps> = ({
  children,
  style,
  onPressIn,
  onPressOut,
  ...rest
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = (event: any) => {
    scale.value = withSpring(0.96, {
      damping: 15,
      stiffness: 300,
      mass: 0.5,
    });
    onPressIn?.(event);
  };

  const handlePressOut = (event: any) => {
    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 300,
      mass: 0.5,
    });
    onPressOut?.(event);
  };

  return (
    <AnimatedPressableComponent
      style={[animatedStyle, style]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      {...rest}
    >
      {children}
    </AnimatedPressableComponent>
  );
};

export default AnimatedPressable;

// Example:
// <AnimatedPressable onPress={handlePress}>
//   <YourButtonContent />
// </AnimatedPressable>

