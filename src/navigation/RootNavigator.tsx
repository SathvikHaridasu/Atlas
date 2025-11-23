// Run these in your terminal (from the project root):
// expo install @react-navigation/native
// expo install react-native-screens react-native-safe-area-context
// npm install @react-navigation/native-stack @react-navigation/bottom-tabs @react-navigation/drawer

import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { enableScreens } from 'react-native-screens';
import { useAuth } from '../../contexts/AuthContext';
import { useAppTheme } from '../contexts/ThemeContext';

import LeaderboardScreen from '../../app/leaderboard/LeaderboardScreen';
import SideDrawerContent from '../components/SideDrawerContent';
import CameraScreen from '../screens/CameraScreen';
import ChallengesScreen from '../screens/ChallengesScreen';
import ChatScreen from '../screens/ChatScreen';
import CreateGoalScreen from '../screens/CreateGoalScreen';
import CreateSessionScreen from '../screens/CreateSessionScreen';
import DareFeedScreen from '../screens/DareFeedScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import FeedScreen from '../screens/FeedScreen';
import HomeScreen from '../screens/HomeScreen';
import VideoCatalogScreen from '../screens/VideoCatalogScreen';
import JoinSessionScreen from '../screens/JoinSessionScreen';
import MasterMapScreen from '../screens/MasterMapScreen';
import ProfileScreen from '../screens/ProfileScreen';
import RunScreen from '../screens/RunScreen';
import SessionLeaderboardScreen from '../screens/SessionLeaderboardScreen';
import SessionLobbyScreen from '../screens/SessionLobbyScreen';
import SessionSettingsScreen from '../screens/SessionSettingsScreen';
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
  Chats: undefined;
  DareFeed: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();
const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

// Define the type for drawer navigation parameters
export type DrawerParamList = {
  MainTabs: undefined;
  Settings: undefined;
  Profile: undefined;
  Favorites: undefined;
};

// Define the type for root stack navigation parameters
export type RootStackParamList = {
  MainDrawer: undefined;
  Camera: { sessionId?: string }; // sessionId is optional since camera can be used from other places too
  CreateSession: undefined;
  JoinSession: undefined;
  SessionLobby: { sessionId: string; sessionName?: string };
  SessionLeaderboard: { sessionId: string; sessionName?: string };
  SessionSettings: {
    sessionId: string;
    sessionName: string;
    sessionCode: string;
    sessionWeekStart?: string;
    sessionWeekEnd?: string;
  };
  Challenges: undefined;
  CreateGoal: undefined;
  MasterMap: undefined;
  Chat: undefined;
  Leaderboard: undefined;
  Settings: undefined;
  Profile: undefined;
  EditProfileScreen: undefined;
  Favorites: undefined;
};

// Theme colors for drawer
const drawerDarkTheme = {
  background: '#050608',
};

const drawerLightTheme = {
  background: '#FFFFFF',
};

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
          } else if (route.name === 'Chats') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'DareFeed') {
            iconName = focused ? 'tv' : 'tv-outline';
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
        name="Chats"
        component={SessionsHomeScreen}
        options={{
          title: 'Chats',
        }}
      />
      <Tab.Screen
        name="DareFeed"
        component={DareFeedScreen}
        options={{
          title: 'Dare Feed',
          headerShown: false,
        }}
      />
    </Tab.Navigator>
  );
}

// Drawer navigator that wraps MainTabs and includes Settings, Profile, Favorites
function MainDrawer() {
  const { isDark } = useAppTheme();
  const theme = isDark ? drawerDarkTheme : drawerLightTheme;

  return (
    <Drawer.Navigator
      drawerContent={(props) => <SideDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        drawerStyle: {
          width: '75%',
          backgroundColor: theme.background,
        },
        drawerActiveTintColor: '#03CA59',
        drawerInactiveTintColor: '#9CA3AF',
        overlayColor: 'rgba(0, 0, 0, 0.5)',
        swipeEnabled: true,
        swipeEdgeWidth: 50,
      }}
    >
      <Drawer.Screen
        name="MainTabs"
        component={MainTabs}
        options={{
          drawerLabel: 'Home',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Settings"
        component={SettingsNavigator}
        options={{
          drawerLabel: 'Settings',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          drawerLabel: 'Profile',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{
          drawerLabel: 'Favorites',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="heart-outline" size={size} color={color} />
          ),
        }}
      />
    </Drawer.Navigator>
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
          <Stack.Screen name="MainDrawer" component={MainDrawer} />
          <Stack.Screen
            name="Camera"
            component={CameraScreen}
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="Feed"
            component={FeedScreen}
            options={{
              headerShown: true,
              title: 'Feed',
              headerStyle: { backgroundColor: isDark ? '#101010' : '#F4F4F4' },
              headerTintColor: isDark ? '#F9FAFB' : '#111111',
            }}
          />
          <Stack.Screen
            name="VideoCatalog"
            component={VideoCatalogScreen}
            options={{
              headerShown: true,
              title: 'Video Catalog',
              headerStyle: { backgroundColor: isDark ? '#101010' : '#F4F4F4' },
              headerTintColor: isDark ? '#F9FAFB' : '#111111',
            }}
          />
          <Stack.Screen name="CreateSession" component={CreateSessionScreen} />
          <Stack.Screen name="JoinSession" component={JoinSessionScreen} />
          <Stack.Screen name="SessionLobby" component={SessionLobbyScreen} />
          <Stack.Screen
            name="SessionLeaderboard"
            component={SessionLeaderboardScreen}
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="SessionSettings"
            component={SessionSettingsScreen}
            options={{
              headerShown: false,
            }}
          />
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
              headerShown: false,
              presentation: 'modal',
            }}
          />
          <Stack.Screen
            name="MasterMap"
            component={MasterMapScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Chat"
            component={ChatScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Leaderboard"
            component={LeaderboardScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="EditProfileScreen"
            component={EditProfileScreen}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      ) : (
        <AuthStack />
      )}
    </NavigationContainer>
  );
}