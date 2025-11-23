// Run these in your terminal (from the project root):
// expo install @react-navigation/native
// expo install react-native-screens react-native-safe-area-context
// npm install @react-navigation/native-stack @react-navigation/bottom-tabs

import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { enableScreens } from 'react-native-screens';
import { useAuth } from '../../contexts/AuthContext';
import { useAppTheme } from '../contexts/ThemeContext';

import CameraScreen from '../screens/CameraScreen';
import ChallengesScreen from '../screens/ChallengesScreen';
import CreateSessionScreen from '../screens/CreateSessionScreen';
import HomeScreen from '../screens/HomeScreen';
import JoinSessionScreen from '../screens/JoinSessionScreen';
import MasterMapScreen from '../screens/MasterMapScreen';
import RunScreen from '../screens/RunScreen';
import SessionLobbyScreen from '../screens/SessionLobbyScreen';
import SessionsHomeScreen from '../screens/SessionsHomeScreen';
import SignInScreen from '../screens/SignInScreen';
import SignUpScreen from '../screens/SignUpScreen';
import SettingsNavigator from './SettingsNavigator';

// Enable native screen optimizations
enableScreens(true);

// Define the type for tab navigation parameters
export type RootTabParamList = {
  Home: undefined;
  Run: undefined;
  Sessions: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();
const Stack = createNativeStackNavigator();

// Main tabs navigator (shown when user is logged in)
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Run') {
            iconName = focused ? 'walk' : 'walk-outline';
          } else if (route.name === 'Sessions') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={24} color={color} />;
        },
        tabBarActiveTintColor: '#03CA59',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarLabelStyle: {
          fontSize: 12,
          marginBottom: 4,
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Home',
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Run"
        component={RunScreen}
        options={{
          title: 'Run',
        }}
      />
      <Tab.Screen
        name="Sessions"
        component={SessionsHomeScreen}
        options={{
          title: 'Sessions',
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsNavigator}
        options={{
          title: 'Settings',
          headerShown: false,
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
export default function RootNavigator() {
  const { user, loading } = useAuth();
  const { isDark } = useAppTheme();

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: isDark ? '#020202' : '#FFFFFF',
        }}
      >
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
            name="Camera"
            component={CameraScreen}
            options={{
              headerShown: false,
              presentation: 'fullScreenModal',
            }}
          />
          <Stack.Screen name="CreateSession" component={CreateSessionScreen} />
          <Stack.Screen name="JoinSession" component={JoinSessionScreen} />
          <Stack.Screen name="SessionLobby" component={SessionLobbyScreen} />
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
            name="MasterMap"
            component={MasterMapScreen}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      ) : (
        <AuthStack />
      )}
    </NavigationContainer>
  );
}