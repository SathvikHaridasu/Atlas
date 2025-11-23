import { Feather, FontAwesome, Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  ImageBackground,
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

const AtlasLogo = require('../../assets/images/atlas-logo.png');

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const REVIEWS = [
  {
    id: '1',
    name: 'Ayesha R.',
    text: 'Got me off the couch and actually excited to run with friends.',
  },
  {
    id: '2',
    name: 'Jordan K.',
    text: 'Challenges make every run feel like a game. 4/5 only because I want even more dares.',
  },
  {
    id: '3',
    name: 'Miguel S.',
    text: 'Love the map and points system. Makes hitting my weekly goals way easier.',
  },
  {
    id: '4',
    name: 'Emily T.',
    text: 'Feels like TikTok but for running — actually fun to stay active.',
  },
];

export default function SignInScreen({ navigation }: any) {
  const { signIn, loading, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const reviewListRef = useRef<FlatList<any> | null>(null);

  // Auto-rotate reviews carousel
  useEffect(() => {
    if (!reviewListRef.current) return;

    let interval: NodeJS.Timeout | null = null;

    // Initial delay to ensure FlatList is rendered
    const initialDelay = setTimeout(() => {
      interval = setInterval(() => {
        setCurrentIndex((prev) => {
          const next = (prev + 1) % REVIEWS.length;
          try {
            reviewListRef.current?.scrollToIndex({
              index: next,
              animated: true,
              viewPosition: 0.5, // Center the item
            });
          } catch (e) {
            // Fallback to scrollToOffset if scrollToIndex fails
            try {
              reviewListRef.current?.scrollToOffset({
                offset: (SCREEN_WIDTH - 40) * next,
                animated: true,
              });
            } catch (err) {
              // Ignore scroll errors
            }
          }
          return next;
        });
      }, 4500); // 4.5 seconds between slides (slightly longer for smoother feel)
    }, 500);

    return () => {
      clearTimeout(initialDelay);
      if (interval) clearInterval(interval);
    };
  }, []);

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

  const renderReviewItem = ({ item }: { item: typeof REVIEWS[number] }) => (
    <View style={styles.reviewCard}>
      {/* 4 out of 5 stars */}
      <View style={styles.starsRow}>
        <Text style={styles.star}>★</Text>
        <Text style={styles.star}>★</Text>
        <Text style={styles.star}>★</Text>
        <Text style={styles.star}>★</Text>
        <Text style={styles.starMuted}>★</Text>
      </View>
      <Text style={styles.reviewText} numberOfLines={2}>
        {item.text}
      </Text>
      <Text style={styles.reviewName}>— {item.name}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={{
          uri: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1200&q=80&auto=format&fit=crop',
        }}
        style={styles.backgroundImage}
        imageStyle={styles.backgroundImageStyle}
        resizeMode="cover"
      >
        <View style={styles.overlay} />
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
            <Image source={AtlasLogo} style={styles.logo} />
            <Text style={styles.appName}>Atlas Run</Text>
            <Text style={styles.subtitle}>Run farther. Conquer every dare.</Text>
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
          </View>

          {/* Social login placeholders */}
          <View style={styles.socialSection}>
            <View style={styles.socialButtonsRow}>
              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => console.log('Google placeholder')}
                activeOpacity={0.85}
              >
                <FontAwesome name="google" size={18} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => console.log('GitHub placeholder')}
                activeOpacity={0.85}
              >
                <Feather name="github" size={20} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => console.log('iCloud placeholder')}
                activeOpacity={0.85}
              >
                <Ionicons name="cloud-outline" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.socialDividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Or continue with</Text>
              <View style={styles.dividerLine} />
            </View>
          </View>

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

          {/* Reviews carousel */}
          <View style={styles.reviewsSection}>
            <FlatList
              ref={reviewListRef}
              data={REVIEWS}
              keyExtractor={(item) => item.id}
              renderItem={renderReviewItem}
              horizontal
              showsHorizontalScrollIndicator={false}
              pagingEnabled
              scrollEnabled={false}
              contentContainerStyle={styles.reviewsListContent}
              snapToInterval={SCREEN_WIDTH - 40}
              snapToAlignment="center"
              decelerationRate={0.88}
              getItemLayout={(data, index) => ({
                length: SCREEN_WIDTH - 40,
                offset: (SCREEN_WIDTH - 40) * index,
                index,
              })}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  backgroundImageStyle: {
    opacity: 0.3,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(30, 30, 40, 0.88)',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 16,
    justifyContent: 'flex-start',
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
  logo: {
    width: 140,
    height: 140,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginBottom: 16,
  },
  appName: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 6,
    color: 'rgba(255,255,255,0.75)',
    fontSize: 14,
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
    marginTop: 8,
    marginBottom: 8,
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
  socialSection: {
    marginTop: 8,
    marginBottom: 20,
  },
  socialButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  socialDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  dividerText: {
    marginHorizontal: 8,
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
  },
  socialButton: {
    flex: 1,
    height: 44,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: '#050A0E',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  reviewsSection: {
    marginTop: 18,
    marginBottom: 16,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewsListContent: {
    paddingHorizontal: 0,
    alignItems: 'center',
  },
  reviewCard: {
    width: SCREEN_WIDTH - 40,
    borderRadius: 20,
    backgroundColor: '#0F1419',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(3, 202, 89, 0.25)',
    shadowColor: '#03CA59',
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  star: {
    color: '#03CA59',
    fontSize: 16,
    marginRight: 2,
  },
  starMuted: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 16,
  },
  reviewText: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 6,
    fontWeight: '500',
  },
  reviewName: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    fontWeight: '600',
  },
});
