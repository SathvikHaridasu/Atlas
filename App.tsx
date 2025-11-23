import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './contexts/AuthContext';
import { FeedProvider } from './src/contexts/FeedContext';
import { GoalsProvider } from './src/contexts/GoalsContext';
import { MapStateProvider } from './src/contexts/MapStateContext';
import { RunStatsProvider } from './src/contexts/RunStatsContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <RunStatsProvider>
              <FeedProvider>
                <GoalsProvider>
                  <MapStateProvider>
                    <RootNavigator />
                  </MapStateProvider>
                </GoalsProvider>
              </FeedProvider>
            </RunStatsProvider>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

