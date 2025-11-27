/**
 * AnimatedTabIcon - Animated icon for tab navigator
 * 
 * Scales the icon smoothly when the tab is focused.
 */

import React, { useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

interface AnimatedTabIconProps {
  name: keyof typeof Ionicons.glyphMap;
  color: string;
  size: number;
  focused: boolean;
}

const AnimatedIcon = Animated.createAnimatedComponent(Ionicons);

const AnimatedTabIcon: React.FC<AnimatedTabIconProps> = ({
  name,
  color,
  size,
  focused,
}) => {
  const scale = useSharedValue(focused ? 1.1 : 1);

  useEffect(() => {
    scale.value = withSpring(focused ? 1.1 : 1, {
      damping: 12,
      stiffness: 200,
      mass: 0.5,
    });
  }, [focused, scale]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <AnimatedIcon
      name={name}
      size={size}
      color={color}
      style={animatedStyle}
    />
  );
};

export default AnimatedTabIcon;

