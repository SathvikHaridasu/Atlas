import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, Pressable, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { usePressScale } from '../../hooks/usePressScale';

interface NeonCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  highlight?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const NeonCard: React.FC<NeonCardProps> = ({
  children,
  onPress,
  highlight = false,
  style,
}) => {
  const { animatedStyle, handlePressIn, handlePressOut } = usePressScale(0.97);

  const cardContent = (
    <View
      style={[
        styles.card,
        highlight && styles.cardHighlight,
        !onPress && style,
      ]}
    >
      {highlight && (
        <LinearGradient
          colors={['transparent', 'rgba(3, 202, 89, 0.06)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      )}
      {children}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={style}
      >
        <Animated.View style={animatedStyle}>
          {cardContent}
        </Animated.View>
      </Pressable>
    );
  }

  return cardContent;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#050A0E',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  cardHighlight: {
    borderColor: 'rgba(3, 202, 89, 0.35)',
    shadowColor: '#03CA59',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
});

