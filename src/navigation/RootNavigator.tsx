// Run these in your terminal (from the project root):
// expo install @react-navigation/native
// expo install react-native-screens react-native-safe-area-context
// npm install @react-navigation/native-stack @react-navigation/bottom-tabs

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { enableScreens } from 'react-native-screens';
import { useAuth } from '../../contexts/AuthContext';
import { useAppTheme } from '../contexts/ThemeContext';

import ChallengesScreen from '../screens/ChallengesScreen';
import ChatScreen from '../screens/ChatScreen';
import CreateGoalScreen from '../screens/CreateGoalScreen';
import HomeScreen from '../screens/HomeScreen';
import RunScreen from '../screens/RunScreen';
import SettingsScreen from '../screens/SettingsScreen';
import SignInScreen from '../screens/SignInScreen';

// Enable native screen optimizations
enableScreens(true);

// Define the type for tab navigation parameters
export type RootTabParamList = {
  Home: undefined;
  Run: undefined;
  Chat: undefined;
  Settings: undefined;
  Challenges: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();
const Stack = createNativeStackNavigator();

// Main tabs navigator (shown when user is logged in)
function MainTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Home',
          headerShown: false,
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
    </Stack.Navigator>
  );
}

// Root navigator that gates based on auth state
export default function RootNavigator() {
  const { user, loading } = useAuth();
  const { isDark } = useAppTheme();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: isDark ? '#020202' : '#FFFFFF' }}>
        <ActivityIndicator size="large" color="#03CA59" />
      </View>
    );
  }

  return (
    <NavigationContainer theme={isDark ? DarkTheme : DefaultTheme}>
      {user ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen
            name="Challenges"
            component={ChallengesScreen}
            options={{
              headerShown: true,
              title: 'Challenges',
              headerStyle: { backgroundColor: isDark ? '#101010' : '#F4F4F4' },
              headerTintColor: isDark ? '#F9FAFB' : '#111111',
            }}
          />
          <Stack.Screen
            name="CreateGoal"
            component={CreateGoalScreen}
            options={{
              headerShown: true,
              title: 'Create Goal',
              headerStyle: { backgroundColor: isDark ? '#101010' : '#F4F4F4' },
              headerTintColor: isDark ? '#F9FAFB' : '#111111',
            }}
          />
        </Stack.Navigator>
      ) : (
        <AuthStack />
      )}
    </NavigationContainer>
  );
}

