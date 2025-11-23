import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './contexts/AuthContext';
import { GoalsProvider } from './src/contexts/GoalsContext';
import { MapStateProvider } from './src/contexts/MapStateContext';
import { RunStatsProvider } from './src/contexts/RunStatsContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <RunStatsProvider>
            <GoalsProvider>
              <MapStateProvider>
                <RootNavigator />
              </MapStateProvider>
            </GoalsProvider>
          </RunStatsProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

