import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.helloText}>Hello</Text>
        <Text style={styles.companyName}>ATLAS</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  helloText: {
    fontSize: 32,
    color: '#e2e8f0',
    marginBottom: 16,
    fontWeight: '300',
  },
  companyName: {
    fontSize: 48,
    color: '#10b981',
    fontWeight: 'bold',
    letterSpacing: 4,
  },
});

