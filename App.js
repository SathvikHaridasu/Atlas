import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Platform } from 'react-native';

import GroupChatScreen from './screens/GroupChatScreen';
import HomeScreen from './screens/HomeScreen';
import RunTrackerScreen from './screens/RunTrackerScreen';

const Tab = createBottomTabNavigator();

// Create linking configuration only for native platforms
// On web, don't use linking to avoid URL protocol modification errors
let linking = undefined;
if (Platform.OS !== 'web') {
  // Use expo-linking for native platforms only
  const Linking = require('expo-linking');
  linking = {
    prefixes: [Linking.createURL('/')],
    config: {
      screens: {
        Home: '',
        RunTracker: 'runtracker',
        GroupChat: 'groupchat',
      },
    },
  };
}

export default function App() {
  return (
    <NavigationContainer linking={linking}>
      <StatusBar style="auto" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'Home') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'RunTracker') {
              iconName = focused ? 'fitness' : 'fitness-outline';
            } else if (route.name === 'GroupChat') {
              iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#10b981',
          tabBarInactiveTintColor: '#64748b',
          headerStyle: {
            backgroundColor: '#1e293b',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          tabBarStyle: {
            backgroundColor: '#1e293b',
            borderTopColor: '#334155',
            paddingBottom: Platform.OS === 'ios' ? 20 : 5,
            height: Platform.OS === 'ios' ? 85 : 60,
          },
        })}>
        <Tab.Screen 
          name="Home" 
          component={HomeScreen}
          options={{
            title: 'Home',
          }}
        />
        <Tab.Screen 
          name="RunTracker" 
          component={RunTrackerScreen}
          options={{
            title: 'Run Tracker',
          }}
        />
        <Tab.Screen 
          name="GroupChat" 
          component={GroupChatScreen}
          options={{
            title: 'Group Chat',
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

