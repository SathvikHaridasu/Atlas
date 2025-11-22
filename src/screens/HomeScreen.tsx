import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';

export default function HomeScreen() {
  const { user, profile, loading } = useAuth();

  const displayName =
    profile?.username ||
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    (user?.email ? user.email.split('@')[0] : 'Runner');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {!loading && (
          <View style={styles.welcomeBlock}>
            {user ? (
              <>
                <Text style={styles.welcomeTitle}>
                  Welcome back, {displayName} 👋
                </Text>
                <Text style={styles.welcomeSubtitle}>
                  This portal is personalized just for you.
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.welcomeTitle}>
                  Welcome to Atlas
                </Text>
                <Text style={styles.welcomeSubtitle}>
                  Please sign in to see your portal.
                </Text>
              </>
            )}
          </View>
        )}
        <Text style={styles.title}>Territory Home</Text>
        <Text style={styles.subtitle}>See your SDG territory and start a new run.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeBlock: {
    marginBottom: 24,
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
    marginTop: 6,
  },
});

