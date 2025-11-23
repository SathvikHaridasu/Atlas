import { useRef } from 'react';
import { Animated, PressableProps } from 'react-native';

interface UsePressScaleReturn {
  animatedStyle: { transform: Array<{ scale: Animated.AnimatedAddition }> };
  handlePressIn: PressableProps['onPressIn'];
  handlePressOut: PressableProps['onPressOut'];
}

export const usePressScale = (scale: number = 0.97): UsePressScaleReturn => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: scale,
      useNativeDriver: true,
      tension: 300,
      friction: 20,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 20,
    }).start();
  };

  return {
    animatedStyle: {
      transform: [{ scale: scaleAnim }],
    },
    handlePressIn,
    handlePressOut,
  };
};

