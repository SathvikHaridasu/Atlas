// Run these in your terminal (from the project root):
// expo install @react-navigation/native
// expo install react-native-screens react-native-safe-area-context
// npm install @react-navigation/native-stack @react-navigation/bottom-tabs

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { enableScreens } from 'react-native-screens';

import HomeScreen from '../screens/HomeScreen';
import RunScreen from '../screens/RunScreen';
import ChatScreen from '../screens/ChatScreen';
import SettingsScreen from '../screens/SettingsScreen';

// Enable native screen optimizations
enableScreens(true);

// Define the type for tab navigation parameters
export type RootTabParamList = {
  Home: undefined;
  Run: undefined;
  Chat: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            title: 'Home',
            // TODO: Add icon using @expo/vector-icons/Ionicons
            // tabBarIcon: ({ color, size }) => (
            //   <Ionicons name="home" size={size} color={color} />
            // ),
          }}
        />
        <Tab.Screen
          name="Run"
          component={RunScreen}
          options={{
            title: 'Run',
            // TODO: Add icon using @expo/vector-icons/Ionicons
            // tabBarIcon: ({ color, size }) => (
            //   <Ionicons name="fitness" size={size} color={color} />
            // ),
          }}
        />
        <Tab.Screen
          name="Chat"
          component={ChatScreen}
          options={{
            title: 'Group Chat',
            // TODO: Add icon using @expo/vector-icons/Ionicons
            // tabBarIcon: ({ color, size }) => (
            //   <Ionicons name="chatbubbles" size={size} color={color} />
            // ),
          }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            title: 'Settings',
            // TODO: Add icon using @expo/vector-icons/Ionicons
            // tabBarIcon: ({ color, size }) => (
            //   <Ionicons name="settings" size={size} color={color} />
            // ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

