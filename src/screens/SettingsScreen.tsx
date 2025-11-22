import { Ionicons, MaterialIcons } from "@expo/vector-icons";
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
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabaseClient";
import { useAppTheme } from "../contexts/ThemeContext";

interface SettingsScreenProps {}

const SettingsScreen: React.FC<SettingsScreenProps> = () => {
  const { user, profile, signOut } = useAuth();
  const { theme, isDark, toggleTheme } = useAppTheme();

  const displayName =
    profile?.full_name ||
    profile?.username ||
    user?.user_metadata?.full_name ||
    (user?.email ? user.email.split('@')[0] : 'Your Account');

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
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile header */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <TouchableOpacity onPress={handleEditProfile} activeOpacity={0.8}>
            <View style={[styles.avatar, { borderColor: theme.border }]}>
              {editAvatar ? (
                <Image source={{ uri: editAvatar }} style={styles.avatarImage} />
              ) : (
                <Text style={[styles.avatarText, { color: '#000' }]}>
                  {displayName.charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
          </TouchableOpacity>

          <View style={styles.profileInfo}>
            <Text style={[styles.name, { color: theme.text }]}>{displayName}</Text>
            <Text style={[styles.email, { color: theme.mutedText }]}>{user?.email || 'No email'}</Text>
            {profile?.username && (
              <Text style={[styles.username, { color: theme.mutedText }]}>@{profile.username}</Text>
            )}
          </View>

          <TouchableOpacity
            style={[styles.editButton, { borderColor: theme.accent }]}
            onPress={handleEditProfile}
            activeOpacity={0.8}
          >
            <Text style={[styles.editButtonText, { color: theme.accent }]}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Appearance section */}
        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.mutedText }]}>Appearance</Text>

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name="moon-outline" size={20} color={theme.mutedText} />
              <Text style={[styles.rowLabel, { color: theme.text }]}>Dark Mode</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: "rgba(148,163,184,0.4)", true: theme.accent }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <MaterialIcons name="straighten" size={20} color={theme.mutedText} />
              <Text style={[styles.rowLabel, { color: theme.text }]}>Distance Units</Text>
            </View>
            <View style={[styles.segmentContainer, { backgroundColor: theme.border }]}>
              <TouchableOpacity
                style={[styles.segmentButton, distanceUnits === "km" && [styles.segmentButtonActive, { backgroundColor: theme.accent }]]}
                onPress={() => setDistanceUnits("km")}
              >
                <Text style={[styles.segmentText, { color: theme.mutedText }, distanceUnits === "km" && styles.segmentTextActive]}>
                  km
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.segmentButton, distanceUnits === "miles" && [styles.segmentButtonActive, { backgroundColor: theme.accent }]]}
                onPress={() => setDistanceUnits("miles")}
              >
                <Text style={[styles.segmentText, { color: theme.mutedText }, distanceUnits === "miles" && styles.segmentTextActive]}>
                  miles
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Notifications section */}
        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.mutedText }]}>Notifications</Text>

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name="notifications-outline" size={20} color={theme.mutedText} />
              <View>
                <Text style={[styles.rowLabel, { color: theme.text }]}>Run Reminders</Text>
                <Text style={[styles.rowDescription, { color: theme.mutedText }]}>Get notified to start your daily run</Text>
              </View>
            </View>
            <Switch
              value={runReminders}
              onValueChange={setRunReminders}
              trackColor={{ false: "rgba(148,163,184,0.4)", true: theme.accent }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name="mail-outline" size={20} color={theme.mutedText} />
              <View>
                <Text style={[styles.rowLabel, { color: theme.text }]}>Weekly Summary</Text>
                <Text style={[styles.rowDescription, { color: theme.mutedText }]}>Receive weekly progress reports</Text>
              </View>
            </View>
            <Switch
              value={weeklySummary}
              onValueChange={setWeeklySummary}
              trackColor={{ false: "rgba(148,163,184,0.4)", true: theme.accent }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name="mail-outline" size={20} color={theme.mutedText} />
              <View>
                <Text style={[styles.rowLabel, { color: theme.text }]}>Email Updates</Text>
                <Text style={[styles.rowDescription, { color: theme.mutedText }]}>Summaries and important announcements</Text>
              </View>
            </View>
            <Switch
              value={emailEnabled}
              onValueChange={setEmailEnabled}
              trackColor={{ false: "rgba(148,163,184,0.4)", true: theme.accent }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Account section */}
        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.mutedText }]}>Account</Text>

          <TouchableOpacity style={styles.row} activeOpacity={0.7}>
            <View style={styles.rowLeft}>
              <Ionicons name="person-outline" size={20} color={theme.mutedText} />
              <Text style={[styles.rowLabel, { color: theme.text }]}>Manage Account</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.mutedText} />
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
                <Ionicons name="close" size={24} color={theme.text} />
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
                placeholderTextColor={theme.mutedText}
                maxLength={50}
              />

              {isSaving && (
                <View style={styles.savingIndicator}>
                  <ActivityIndicator size="small" color={theme.accent} />
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
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#03CA59",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
    borderWidth: 2,
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
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    marginBottom: 2,
  },
  username: {
    fontSize: 13,
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: "transparent",
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  section: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
    marginBottom: 16,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 12,
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
    marginLeft: 12,
  },
  rowDescription: {
    fontSize: 13,
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
    // backgroundColor set inline with theme.accent
  },
  segmentText: {
    fontSize: 14,
    fontWeight: "500",
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
  },
  modalBody: {
    paddingHorizontal: 20,
    alignItems: "center",
  },
  modalAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#03CA59",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    borderWidth: 3,
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
    backgroundColor: "#03CA59",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#101010",
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    alignSelf: "flex-start",
    width: "100%",
  },
  input: {
    width: "100%",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  savingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  savingText: {
    fontSize: 14,
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
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: "600",
  },
  modalSaveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
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
