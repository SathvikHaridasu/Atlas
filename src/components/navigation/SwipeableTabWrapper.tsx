import React from 'react';
import { View, StyleSheet } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { RootTabParamList } from '../../navigation/RootNavigator';
import { triggerTabChangeHaptic } from '../../utils/haptics';

interface SwipeableTabWrapperProps {
  children: React.ReactNode;
  routeNames: string[];
  currentRouteName: string;
}

export const SwipeableTabWrapper: React.FC<SwipeableTabWrapperProps> = ({
  children,
  routeNames,
  currentRouteName,
}) => {
  const navigation = useNavigation<BottomTabNavigationProp<RootTabParamList>>();

  const handleGestureEvent = (event: any) => {
    // This handler can be used for real-time feedback if needed
    // For now, we'll handle navigation in onHandlerStateChange
  };

  const handleStateChange = (event: any) => {
    const { state, translationX, velocityX } = event.nativeEvent;

    // Only handle when gesture ends
    if (state === State.END) {
      const currentIndex = routeNames.indexOf(currentRouteName);
      
      if (currentIndex === -1) return;

      // Thresholds: minimum distance and velocity to trigger navigation
      const MIN_DISTANCE = 40;
      const MIN_VELOCITY = 300;

      // Swipe left (negative translationX) → next tab
      if (translationX < -MIN_DISTANCE && velocityX < -MIN_VELOCITY) {
        const nextIndex = currentIndex + 1;
        if (nextIndex < routeNames.length) {
          const nextRoute = routeNames[nextIndex];
          navigation.navigate(nextRoute as never);
          triggerTabChangeHaptic();
        }
      }
      // Swipe right (positive translationX) → previous tab
      else if (translationX > MIN_DISTANCE && velocityX > MIN_VELOCITY) {
        const prevIndex = currentIndex - 1;
        if (prevIndex >= 0) {
          const prevRoute = routeNames[prevIndex];
          navigation.navigate(prevRoute as never);
          triggerTabChangeHaptic();
        }
      }
    }
  };

  return (
    <PanGestureHandler
      onGestureEvent={handleGestureEvent}
      onHandlerStateChange={handleStateChange}
      activeOffsetX={[-10, 10]} // Only activate for horizontal gestures
      failOffsetY={[-5, 5]} // Fail if vertical movement is too large
    >
      <View style={styles.container}>
        {children}
      </View>
    </PanGestureHandler>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

