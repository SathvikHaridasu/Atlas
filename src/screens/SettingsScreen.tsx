import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabaseClient";
import type { SettingsStackParamList } from "../navigation/SettingsNavigator";

type ThemeOption = "system" | "light" | "dark";

// Color palette
const COLORS = {
  accent: "#03CA59",
  bgDark: "#020202",
  cardDark: "#101010",
  borderDark: "rgba(3, 202, 89, 0.4)",
  textPrimaryDark: "#F9FAFB",
  textSecondaryDark: "#9CA3AF",
};

type SettingsScreenNavigationProp = NativeStackNavigationProp<SettingsStackParamList, "Settings">;

interface SettingsScreenProps {}

const SettingsScreen: React.FC<SettingsScreenProps> = () => {
  const { user, profile, signOut } = useAuth();
  const navigation = useNavigation<SettingsScreenNavigationProp>();

  const displayName =
    profile?.full_name ||
    profile?.username ||
    user?.user_metadata?.full_name ||
    (user?.email ? user.email.split('@')[0] : 'Your Account');

  const systemScheme = useColorScheme();
  const [theme, setTheme] = useState<ThemeOption>("system");
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [runReminders, setRunReminders] = useState(true);
  const [weeklySummary, setWeeklySummary] = useState(false);
  const [distanceUnits, setDistanceUnits] = useState<"km" | "miles">("km");

  // Edit profile modal state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState(displayName);
  const [editAvatar, setEditAvatar] = useState<string | null>(profile?.avatar_url || null);
  const [isSaving, setIsSaving] = useState(false);

  const isDark = theme === "dark" || (theme === "system" && systemScheme === "dark");

  const handleThemeChange = (option: ThemeOption) => {
    setTheme(option);
    // TODO: wire this into your real theme system (context/store + persistence)
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const handleEditProfile = () => {
    setEditName(displayName);
    setEditAvatar(profile?.avatar_url || null);
    setEditModalVisible(true);
  };

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Please grant access to your photos to change your profile picture.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setEditAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      let avatarUrl = editAvatar;

      // If avatar is a local URI, upload it to Supabase Storage
      if (editAvatar && editAvatar.startsWith("file://")) {
        // TODO: Upload to Supabase Storage
        // For now, we'll just update the profile with the name
        // In production, you'd:
        // 1. Convert image to blob
        // 2. Upload to Supabase Storage bucket (e.g., 'avatars')
        // 3. Get public URL
        // 4. Update profile with avatar_url
        console.log("Avatar upload not yet implemented - would upload to Supabase Storage here");
      }

      // Update profile in Supabase
      const updates: any = {
        full_name: editName.trim() || null,
      };

      if (avatarUrl && !avatarUrl.startsWith("file://")) {
        updates.avatar_url = avatarUrl;
      }

      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("user_id", user.id);

      if (error) {
        throw error;
      }

      // Refresh profile in context (would need to add refresh method to AuthContext)
      // For now, just close modal
      setEditModalVisible(false);
      Alert.alert("Success", "Profile updated successfully!");
    } catch (error: any) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", error.message || "Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile header */}
        <View style={styles.card}>
          <TouchableOpacity onPress={handleEditProfile} activeOpacity={0.8}>
            <View style={styles.avatar}>
              {editAvatar ? (
                <Image source={{ uri: editAvatar }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>
                  {displayName.charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
          </TouchableOpacity>

          <View style={styles.profileInfo}>
            <Text style={styles.name}>{displayName}</Text>
            <Text style={styles.email}>{user?.email || 'No email'}</Text>
            {profile?.username && (
              <Text style={styles.username}>@{profile.username}</Text>
            )}
          </View>

          <TouchableOpacity
            style={styles.editButton}
            onPress={handleEditProfile}
            activeOpacity={0.8}
          >
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Appearance section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name="moon-outline" size={20} color={COLORS.textSecondaryDark} />
              <Text style={styles.rowLabel}>Dark Mode</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={(value) => handleThemeChange(value ? "dark" : "light")}
              trackColor={{ false: "rgba(148,163,184,0.4)", true: COLORS.accent }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <MaterialIcons name="straighten" size={20} color={COLORS.textSecondaryDark} />
              <Text style={styles.rowLabel}>Distance Units</Text>
            </View>
            <View style={styles.segmentContainer}>
              <TouchableOpacity
                style={[styles.segmentButton, distanceUnits === "km" && styles.segmentButtonActive]}
                onPress={() => setDistanceUnits("km")}
              >
                <Text style={[styles.segmentText, distanceUnits === "km" && styles.segmentTextActive]}>
                  km
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.segmentButton, distanceUnits === "miles" && styles.segmentButtonActive]}
                onPress={() => setDistanceUnits("miles")}
              >
                <Text style={[styles.segmentText, distanceUnits === "miles" && styles.segmentTextActive]}>
                  miles
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Notifications section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name="notifications-outline" size={20} color={COLORS.textSecondaryDark} />
              <View>
                <Text style={styles.rowLabel}>Run Reminders</Text>
                <Text style={styles.rowDescription}>Get notified to start your daily run</Text>
              </View>
            </View>
            <Switch
              value={runReminders}
              onValueChange={setRunReminders}
              trackColor={{ false: "rgba(148,163,184,0.4)", true: COLORS.accent }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name="mail-outline" size={20} color={COLORS.textSecondaryDark} />
              <View>
                <Text style={styles.rowLabel}>Weekly Summary</Text>
                <Text style={styles.rowDescription}>Receive weekly progress reports</Text>
              </View>
            </View>
            <Switch
              value={weeklySummary}
              onValueChange={setWeeklySummary}
              trackColor={{ false: "rgba(148,163,184,0.4)", true: COLORS.accent }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name="mail-outline" size={20} color={COLORS.textSecondaryDark} />
              <View>
                <Text style={styles.rowLabel}>Email Updates</Text>
                <Text style={styles.rowDescription}>Summaries and important announcements</Text>
              </View>
            </View>
            <Switch
              value={emailEnabled}
              onValueChange={setEmailEnabled}
              trackColor={{ false: "rgba(148,163,184,0.4)", true: COLORS.accent }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Account section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate("ManageAccount")}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <Ionicons name="person-outline" size={20} color={COLORS.textSecondaryDark} />
              <Text style={styles.rowLabel}>Manage Account</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondaryDark} />
          </TouchableOpacity>
        </View>

        {/* Sign out */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.signOutButton}
            onPress={handleSignOut}
            activeOpacity={0.85}
          >
            <Text style={styles.signOutText}>Sign out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity
                onPress={() => setEditModalVisible(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color={COLORS.textPrimaryDark} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <TouchableOpacity onPress={handlePickImage} activeOpacity={0.8}>
                <View style={styles.modalAvatar}>
                  {editAvatar ? (
                    <Image source={{ uri: editAvatar }} style={styles.modalAvatarImage} />
                  ) : (
                    <Text style={styles.modalAvatarText}>
                      {editName.charAt(0).toUpperCase()}
                    </Text>
                  )}
                  <View style={styles.avatarEditBadge}>
                    <Ionicons name="camera" size={16} color="#000" />
                  </View>
                </View>
              </TouchableOpacity>

              <Text style={styles.inputLabel}>Display Name</Text>
              <TextInput
                style={styles.input}
                value={editName}
                onChangeText={setEditName}
                placeholder="Enter your name"
                placeholderTextColor={COLORS.textSecondaryDark}
                maxLength={50}
              />

              {isSaving && (
                <View style={styles.savingIndicator}>
                  <ActivityIndicator size="small" color={COLORS.accent} />
                  <Text style={styles.savingText}>Saving...</Text>
                </View>
              )}
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setEditModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveButton, isSaving && styles.modalSaveButtonDisabled]}
                onPress={handleSaveProfile}
                activeOpacity={0.8}
                disabled={isSaving}
              >
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: COLORS.cardDark,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
    borderWidth: 2,
    borderColor: COLORS.borderDark,
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "700",
    color: "#000",
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.textPrimaryDark,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: COLORS.textSecondaryDark,
    marginBottom: 2,
  },
  username: {
    fontSize: 13,
    color: COLORS.textSecondaryDark,
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.accent,
    backgroundColor: "transparent",
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.accent,
  },
  section: {
    backgroundColor: COLORS.cardDark,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 12,
    color: COLORS.textSecondaryDark,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(148, 163, 184, 0.1)",
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimaryDark,
    marginLeft: 12,
  },
  rowDescription: {
    fontSize: 13,
    color: COLORS.textSecondaryDark,
    marginTop: 2,
    marginLeft: 12,
  },
  segmentContainer: {
    flexDirection: "row",
    backgroundColor: "#181818",
    borderRadius: 8,
    padding: 2,
  },
  segmentButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
  },
  segmentButtonActive: {
    backgroundColor: COLORS.accent,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.textSecondaryDark,
  },
  segmentTextActive: {
    color: "#000",
  },
  footer: {
    marginTop: 8,
    alignItems: "center",
  },
  signOutButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.6)",
    backgroundColor: "transparent",
  },
  signOutText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#EF4444",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.cardDark,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 32,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.textPrimaryDark,
  },
  modalBody: {
    paddingHorizontal: 20,
    alignItems: "center",
  },
  modalAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    borderWidth: 3,
    borderColor: COLORS.borderDark,
  },
  modalAvatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  modalAvatarText: {
    fontSize: 40,
    fontWeight: "700",
    color: "#000",
  },
  avatarEditBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.cardDark,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textSecondaryDark,
    marginBottom: 8,
    alignSelf: "flex-start",
    width: "100%",
  },
  input: {
    width: "100%",
    backgroundColor: "#181818",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.textPrimaryDark,
    marginBottom: 16,
  },
  savingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  savingText: {
    fontSize: 14,
    color: COLORS.textSecondaryDark,
    marginLeft: 8,
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 24,
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textSecondaryDark,
  },
  modalSaveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.accent,
    alignItems: "center",
  },
  modalSaveButtonDisabled: {
    opacity: 0.5,
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
});

export default SettingsScreen;
