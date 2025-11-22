import { useAuth } from '@/contexts/AuthContext';
import { useScan } from '@/contexts/ScanContext';
import { useProfile } from '@/hooks/useProfile';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function ScanScreen() {
  const { user, loading: authLoading } = useAuth();
  const { profile, updateProfile } = useProfile();
  const { setScanData } = useScan();
  const [scanning, setScanning] = useState(false);
  const router = useRouter();

  // Simulate scan functionality
  // In a real app, this would use a barcode/QR scanner or camera
  const handleScan = async () => {
    // Generate mock scan data
    const scanData = {
      timestamp: new Date().toISOString(),
      type: 'qr_code',
      data: `Scan-${Date.now()}`,
      location: 'Sample Location',
    };

    if (!user) {
      // If not authenticated, store scan data and redirect to auth
      setScanData(scanData);
      Alert.alert(
        'Authentication Required',
        'Please sign in or create an account to save your scan data.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => setScanData(null),
          },
          {
            text: 'Go to Sign In',
            onPress: () => router.push('/auth'),
          },
        ],
      );
      return;
    }

    setScanning(true);

    // Simulate scan process
    setTimeout(() => {
      // Update profile with scan data
      updateProfile({ scanData })
        .then(({ error }) => {
          setScanning(false);
          if (error) {
            Alert.alert('Error', 'Failed to save scan data: ' + error.message);
          } else {
            Alert.alert('Success', 'Scan data saved!', [
              {
                text: 'View Portal',
                onPress: () => router.push('/portal'),
              },
            ]);
          }
        })
        .catch((err) => {
          setScanning(false);
          Alert.alert('Error', 'An unexpected error occurred');
          console.error('Scan error:', err);
        });
    }, 1500);
  };

  if (authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Scan</Text>
        <Text style={styles.subtitle}>
          {user
            ? 'Tap the button below to scan'
            : 'Please sign in to save your scan data'}
        </Text>

        <View style={styles.scanArea}>
          <View style={styles.scanBox}>
            <Text style={styles.scanBoxText}>
              {scanning ? 'Scanning...' : 'Scan Area'}
            </Text>
            {scanning && <ActivityIndicator size="large" color="#007AFF" style={styles.scanner} />}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.scanButton, scanning && styles.scanButtonDisabled]}
          onPress={handleScan}
          disabled={scanning}>
          <Text style={styles.scanButtonText}>
            {scanning ? 'Scanning...' : user ? 'Start Scan' : 'Sign In to Scan'}
          </Text>
        </TouchableOpacity>

        {user && (
          <TouchableOpacity
            style={styles.portalButton}
            onPress={() => router.push('/portal')}>
            <Text style={styles.portalButtonText}>View My Portal</Text>
          </TouchableOpacity>
        )}

        {!user && (
          <TouchableOpacity
            style={styles.authButton}
            onPress={() => router.push('/auth')}>
            <Text style={styles.authButtonText}>Sign In / Sign Up</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    textAlign: 'center',
  },
  scanArea: {
    alignItems: 'center',
    marginBottom: 32,
  },
  scanBox: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  scanBoxText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  scanner: {
    marginTop: 8,
  },
  scanButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  scanButtonDisabled: {
    opacity: 0.6,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  portalButton: {
    backgroundColor: '#34C759',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  portalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  authButton: {
    backgroundColor: '#FF9500',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  authButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

