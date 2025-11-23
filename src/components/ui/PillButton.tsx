import React from 'react';
import { Text, View, StyleSheet, ViewStyle, Pressable, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { usePressScale } from '../../hooks/usePressScale';

interface PillButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'subtle' | 'blue';
  iconLeft?: React.ReactNode;
  style?: ViewStyle;
}

export const PillButton: React.FC<PillButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  iconLeft,
  style,
}) => {
  const { animatedStyle, handlePressIn, handlePressOut } = usePressScale(0.95);

  const getButtonContent = () => {
    if (variant === 'primary') {
      return (
        <LinearGradient
          colors={['#03CA59', '#16DB7E']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.button, styles.primaryButton]}
        >
          {iconLeft && <View style={styles.iconContainer}>{iconLeft}</View>}
          <Text style={styles.primaryText}>{label}</Text>
        </LinearGradient>
      );
    }

    if (variant === 'outline') {
      return (
        <View style={[styles.button, styles.outlineButton]}>
          {iconLeft && <View style={styles.iconContainer}>{iconLeft}</View>}
          <Text style={styles.outlineText}>{label}</Text>
        </View>
      );
    }

    if (variant === 'blue') {
      return (
        <LinearGradient
          colors={['#3B82F6', '#6366F1']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.button, styles.blueButton]}
        >
          {iconLeft && <View style={styles.iconContainer}>{iconLeft}</View>}
          <Text style={styles.blueText}>{label}</Text>
        </LinearGradient>
      );
    }

    // subtle
    return (
      <View style={[styles.button, styles.subtleButton]}>
        {iconLeft && <View style={styles.iconContainer}>{iconLeft}</View>}
        <Text style={styles.subtleText}>{label}</Text>
      </View>
    );
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={style}
    >
      <Animated.View style={animatedStyle}>
        {getButtonContent()}
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 44,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  primaryButton: {
    // Gradient handles background
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#03CA59',
  },
  subtleButton: {
    backgroundColor: '#050A0E',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  iconContainer: {
    marginRight: 8,
  },
  primaryText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
  },
  outlineText: {
    color: '#03CA59',
    fontSize: 16,
    fontWeight: '600',
  },
  subtleText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  blueButton: {
    // Gradient handles background
  },
  blueText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

