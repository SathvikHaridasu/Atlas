import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

export default function HeaderHomeButton() {
  const navigation = useNavigation();

  const handleGoHome = () => {
    // Try to close drawer if we're in a drawer navigator
    try {
      (navigation as any).closeDrawer?.();
    } catch (e) {
      // Not in drawer, ignore
    }
    
    // Navigate to MainDrawer and then to MainTabs > Home
    // Get the root navigator by traversing up the navigation tree
    let rootNavigator = navigation;
    let parent = (navigation as any).getParent?.();
    
    // Traverse up to find the root stack navigator
    while (parent) {
      rootNavigator = parent;
      parent = (parent as any).getParent?.();
    }
    
    // Navigate to MainDrawer > MainTabs > Home
    try {
      (rootNavigator as any).navigate('MainDrawer', {
        screen: 'MainTabs',
        params: {
          screen: 'Home',
        },
      });
    } catch (e) {
      // Fallback: try simpler navigation
      try {
        (rootNavigator as any).navigate('MainTabs' as never);
      } catch (e2) {
        console.warn('Could not navigate to Home:', e2);
      }
    }
  };

  return (
    <TouchableOpacity
      onPress={handleGoHome}
      activeOpacity={0.7}
      style={styles.button}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Ionicons name="home" size={28} color="#03CA59" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 8,
  },
});

