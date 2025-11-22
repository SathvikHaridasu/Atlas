// Run these in your terminal (from the project root):
// expo install @react-navigation/native
// expo install react-native-screens react-native-safe-area-context
// npm install @react-navigation/native-stack @react-navigation/bottom-tabs

<<<<<<< Updated upstream
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
=======
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
>>>>>>> Stashed changes
import { enableScreens } from 'react-native-screens';

import ChatScreen from '../screens/ChatScreen';
import HomeScreen from '../screens/HomeScreen';
import RunScreen from '../screens/RunScreen';
import SettingsScreen from '../screens/SettingsScreen';
<<<<<<< Updated upstream
=======
import SignInScreen from '../screens/SignInScreen';
import SignUpScreen from '../screens/SignUpScreen';
>>>>>>> Stashed changes

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

<<<<<<< Updated upstream
=======
// Main tabs navigator (shown when user is logged in)
function MainTabs() {
  return (
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
  );
}

// Auth stack navigator (shown when user is not logged in)
function AuthStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="SignIn"
        component={SignInScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SignUp"
        component={SignUpScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

// Root navigator that gates based on auth state
>>>>>>> Stashed changes
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

