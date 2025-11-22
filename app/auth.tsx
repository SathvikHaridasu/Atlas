import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function AuthScreen() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const router = useRouter();

  // Redirect if already signed in
  React.useEffect(() => {
    if (user) {
      router.replace('/(tabs)');
    }
  }, [user, router]);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        const { user, error } = await signUp(email, password);
        
        if (error) {
          Alert.alert('Sign Up Error', error.message);
        } else if (user) {
          Alert.alert('Success', 'Account created! Redirecting to home...', [
            {
              text: 'OK',
              onPress: () => router.replace('/(tabs)'),
            },
          ]);
        }
      } else {
        const { user, error } = await signIn(email, password);
        
        if (error) {
          Alert.alert('Sign In Error', error.message);
        } else if (user) {
          router.replace('/(tabs)');
        }
      }
    } catch (err) {
      Alert.alert('Error', 'An unexpected error occurred');
      console.error('Auth error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>{isSignUp ? 'Create Account' : 'Sign In'}</Text>
          <Text style={styles.subtitle}>
            {isSignUp
              ? 'Create a new account to get started'
              : 'Sign in to continue'}
          </Text>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              editable={!loading}
            />

            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password"
              editable={!loading}
            />

            {isSignUp && (
              <Text style={styles.passwordHint}>
                Password must be at least 6 characters
              </Text>
            )}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleAuth}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>{isSignUp ? 'Create Account' : 'Sign In'}</Text>
              )}
            </TouchableOpacity>

            {!isSignUp && (
              <TouchableOpacity
                style={styles.createAccountButton}
                onPress={() => setIsSignUp(true)}
                disabled={loading}>
                <Text style={styles.createAccountText}>No account? Create one here!</Text>
              </TouchableOpacity>
            )}

            {isSignUp && (
              <TouchableOpacity
                style={styles.switchButton}
                onPress={() => setIsSignUp(false)}
                disabled={loading}>
                <Text style={styles.switchText}>
                  Already have an account? Sign In
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
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
  form: {
    width: '100%',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  passwordHint: {
    fontSize: 12,
    color: '#666',
    marginTop: -8,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  createAccountButton: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 12,
  },
  createAccountText: {
    color: '#007AFF',
    fontSize: 15,
    fontWeight: '500',
  },
  switchButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  switchText: {
    color: '#007AFF',
    fontSize: 14,
  },
});

