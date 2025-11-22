import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './contexts/AuthContext';
import { RunStatsProvider } from './src/contexts/RunStatsContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <RunStatsProvider>
            <RootNavigator />
          </RunStatsProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

