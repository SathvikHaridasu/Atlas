import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function GroupChatScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Group Chat</Text>
        <Text style={styles.placeholder}>This screen is coming soon...</Text>
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
  title: {
    fontSize: 28,
    color: '#10b981',
    fontWeight: 'bold',
    marginBottom: 16,
  },
  placeholder: {
    fontSize: 16,
    color: '#64748b',
  },
});

