import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';

export default function SignInScreen({ navigation }: any) {
  const { signIn, loading, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  // If user is already signed in, show message (navigation will handle this via gating)
  if (user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.alreadySignedInText}>You're already signed in</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleSignIn = async () => {
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password');
      return;
    }

    setSubmitting(true);
    const result = await signIn(email.trim(), password);
    setSubmitting(false);

    if (result.error) {
      setError(result.error);
    }
    // Successful login will be handled by navigation gating
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo + title */}
          <View style={styles.header}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoInitial}>AR</Text>
            </View>
            <Text style={styles.appName}>Atlas Run</Text>
            <Text style={styles.subtitle}>Log in to start your next dare.</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Email Input */}
            <View style={[styles.inputContainer, isEmailFocused && styles.inputFocused]}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor="rgba(255,255,255,0.4)"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setIsEmailFocused(true)}
                onBlur={() => setIsEmailFocused(false)}
                editable={!submitting && !loading}
              />
            </View>

            {/* Password Input */}
            <View style={[styles.inputContainer, isPasswordFocused && styles.inputFocused]}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password"
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
                editable={!submitting && !loading}
              />
            </View>

            {/* Error Message */}
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {/* Log In Button */}
            <TouchableOpacity
              style={[styles.primaryButton, (submitting || loading) && styles.buttonDisabled]}
              onPress={handleSignIn}
              disabled={submitting || loading}
              activeOpacity={0.9}
            >
              {submitting || loading ? (
                <ActivityIndicator color="#000000" />
              ) : (
                <Text style={styles.primaryButtonText}>Log in</Text>
              )}
            </TouchableOpacity>

            {/* Sign Up Link */}
            <TouchableOpacity
              style={styles.secondaryLink}
              onPress={() => navigation.navigate('SignUp')}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryLinkText}>
                Don't have an account? <Text style={styles.secondaryLinkAccent}>Sign up</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 24,
    justifyContent: 'center',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#03CA59',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoInitial: {
    color: '#000000',
    fontSize: 28,
    fontWeight: '800',
  },
  appName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 4,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    textAlign: 'center',
  },
  form: {
    marginBottom: 24,
    gap: 14,
  },
  inputContainer: {
    backgroundColor: '#050A0E',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  inputFocused: {
    borderColor: '#03CA59',
  },
  inputLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 4,
  },
  input: {
    color: '#FFFFFF',
    fontSize: 15,
    paddingVertical: 4,
  },
  errorText: {
    color: '#FF4B6E',
    fontSize: 13,
    marginBottom: 8,
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: '#03CA59',
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  secondaryLink: {
    alignItems: 'center',
  },
  secondaryLinkText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
  },
  secondaryLinkAccent: {
    color: '#03CA59',
    fontWeight: '600',
  },
  alreadySignedInText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
