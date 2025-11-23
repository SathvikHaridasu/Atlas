import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import HeaderHomeButton from '../components/HeaderHomeButton';
import { useAppTheme } from '../contexts/ThemeContext';
import { useCurrentProfile } from '../hooks/useCurrentProfile';
import type { RootStackParamList } from '../navigation/RootNavigator';

type EditProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'EditProfileScreen'>;

export default function EditProfileScreen() {
  const { user } = useAuth();
  const { theme } = useAppTheme();
  const { profile, loading: profileLoading, updateProfile } = useCurrentProfile();
  const navigation = useNavigation<EditProfileScreenNavigationProp>();

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || profile.full_name || '');
      setUsername(profile.username || '');
      setBio(profile.bio || '');
      setAvatarUri(profile.avatar_url || null);
    }
  }, [profile]);

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant access to your photos to change your profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setAvatarUri(result.assets[0].uri);
        // TODO: Upload to Supabase Storage and get public URL
        // For now, we'll just store the local URI
        Alert.alert(
          'Image Selected',
          'Image upload to Supabase Storage is not yet implemented. The image will be saved locally for now.',
        );
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const validateForm = (): boolean => {
    if (!displayName.trim()) {
      Alert.alert('Validation Error', 'Display name is required.');
      return false;
    }

    if (!username.trim()) {
      Alert.alert('Validation Error', 'Username is required.');
      return false;
    }

    // Username should be lowercase and no spaces
    const usernameLower = username.toLowerCase().trim();
    if (usernameLower !== username.trim()) {
      Alert.alert('Validation Error', 'Username must be lowercase.');
      return false;
    }

    if (/\s/.test(usernameLower)) {
      Alert.alert('Validation Error', 'Username cannot contain spaces.');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      const updates: any = {
        display_name: displayName.trim(),
        username: username.toLowerCase().trim(),
        bio: bio.trim() || null,
      };

      // TODO: If avatarUri is a local file URI, upload to Supabase Storage first
      // For now, if it's already a URL, we'll use it
      if (avatarUri && !avatarUri.startsWith('file://')) {
        updates.avatar_url = avatarUri;
      }

      const { error } = await updateProfile(updates);

      if (error) {
        throw error;
      }

      Alert.alert('Success', 'Profile updated successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      Alert.alert('Error', err.message || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (profileLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.accent} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Home Button */}
      <View style={styles.homeButtonContainer}>
        <HeaderHomeButton />
      </View>

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Ionicons name="close" size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Edit Profile</Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.7}
          style={saving && styles.disabledButton}
        >
          {saving ? (
            <ActivityIndicator size="small" color={theme.accent} />
          ) : (
            <Text style={[styles.saveButtonText, { color: theme.accent }]}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: theme.accent }]}>
                <Text style={styles.avatarText}>
                  {(displayName || user?.email?.split('@')[0] || 'U').charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          <TouchableOpacity onPress={handlePickImage} activeOpacity={0.8}>
            <Text style={[styles.changePhotoText, { color: theme.accent }]}>Change photo</Text>
          </TouchableOpacity>
        </View>

        {/* Form Fields */}
        <View style={styles.formSection}>
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.mutedText }]}>Display Name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Enter your display name"
              placeholderTextColor={theme.mutedText}
              maxLength={50}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.mutedText }]}>Username</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
              value={username}
              onChangeText={(text) => setUsername(text.toLowerCase())}
              placeholder="username (lowercase, no spaces)"
              placeholderTextColor={theme.mutedText}
              autoCapitalize="none"
              maxLength={30}
            />
            <Text style={[styles.inputHint, { color: theme.mutedText }]}>
              Username must be lowercase with no spaces
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.mutedText }]}>Bio</Text>
            <TextInput
              style={[
                styles.textArea,
                { backgroundColor: theme.card, color: theme.text, borderColor: theme.border },
              ]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell us about yourself"
              placeholderTextColor={theme.mutedText}
              multiline
              numberOfLines={4}
              maxLength={150}
              textAlignVertical="top"
            />
            <Text style={[styles.inputHint, { color: theme.mutedText }]}>
              {bio.length}/150 characters
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  homeButtonContainer: {
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#03CA59',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '700',
    color: '#000',
  },
  changePhotoText: {
    fontSize: 16,
    fontWeight: '600',
  },
  formSection: {
    marginTop: 8,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
  },
  textArea: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    minHeight: 100,
  },
  inputHint: {
    fontSize: 12,
    marginTop: 4,
  },
});

