import { useAuth } from '@/contexts/AuthContext';
import { useScan } from '@/contexts/ScanContext';
import { useProfile } from '@/hooks/useProfile';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function PortalScreen() {
  const { user, signOut, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, updateProfile } = useProfile();
  const { scanData, clearScanData } = useScan();
  const router = useRouter();

  // If user signs in with scanData, update their profile
  useEffect(() => {
    if (user && scanData && !profileLoading && profile) {
      updateProfile({ scanData })
        .then(({ error }) => {
          if (error) {
            console.error('Failed to update profile with scan data:', error);
          } else {
            clearScanData();
          }
        })
        .catch((err) => {
          console.error('Error updating profile with scan data:', err);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, scanData, profileLoading, profile]);

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          const { error } = await signOut();
          if (error) {
            Alert.alert('Error', error.message);
          } else {
            router.replace('/auth');
          }
        },
      },
    ]);
  };

  if (authLoading || profileLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading your portal...</Text>
      </View>
    );
  }

  if (!user) {
    router.replace('/auth');
    return null;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Portal</Text>
        <Text style={styles.subtitle}>Welcome back, {user.email}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile Information</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{profile?.email || user.email}</Text>
          </View>
          {profile?.full_name && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name:</Text>
              <Text style={styles.infoValue}>{profile.full_name}</Text>
            </View>
          )}
          {profile?.created_at && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Member since:</Text>
              <Text style={styles.infoValue}>
                {new Date(profile.created_at).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>
      </View>

      {profile?.scanData && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Scan Data</Text>
          <View style={styles.scanDataCard}>
            <Text style={styles.scanDataLabel}>Your scan information:</Text>
            <View style={styles.scanDataContent}>
              {typeof profile.scanData === 'string' ? (
                <Text style={styles.scanDataText}>{profile.scanData}</Text>
              ) : (
                <Text style={styles.scanDataText}>
                  {JSON.stringify(profile.scanData, null, 2)}
                </Text>
              )}
            </View>
          </View>
        </View>
      )}

      {!profile?.scanData && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>No Scan Data</Text>
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              You haven't scanned anything yet. Go to the scan screen to get started!
            </Text>
            <TouchableOpacity
              style={styles.scanButton}
              onPress={() => router.push('/scan')}>
              <Text style={styles.scanButtonText}>Go to Scan</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutButtonText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: '#000',
    flex: 1,
    textAlign: 'right',
  },
  scanDataCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scanDataLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  scanDataContent: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
  },
  scanDataText: {
    fontSize: 14,
    color: '#333',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  scanButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  signOutButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  signOutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

