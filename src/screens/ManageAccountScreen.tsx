import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "../../contexts/AuthContext";
import type { SettingsStackParamList } from "../navigation/SettingsNavigator";

type ManageAccountScreenNavigationProp = NativeStackNavigationProp<SettingsStackParamList, "ManageAccount">;

// Color palette
const COLORS = {
  accent: "#03CA59",
  bgDark: "#020202",
  cardDark: "#101010",
  borderDark: "rgba(3, 202, 89, 0.4)",
  textPrimaryDark: "#F9FAFB",
  textSecondaryDark: "#9CA3AF",
};

const ManageAccountScreen: React.FC = () => {
  const { user, profile } = useAuth();
  const navigation = useNavigation<ManageAccountScreenNavigationProp>();

  const displayName =
    profile?.full_name ||
    profile?.username ||
    user?.user_metadata?.full_name ||
    (user?.email ? user.email.split('@')[0] : 'Your Account');

  const [avatar, setAvatar] = useState<string | null>(profile?.avatar_url || null);

  const handleChangeProfilePhoto = async () => {
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
        setAvatar(result.assets[0].uri);
        // TODO: Upload to Supabase Storage and update profile
        Alert.alert("Success", "Profile photo updated! (Upload to server not yet implemented)");
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Info section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Info</Text>

          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>
                  {displayName.charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.name}>{displayName}</Text>
              <Text style={styles.email}>{user?.email || 'No email'}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.changePhotoButton}
            onPress={handleChangeProfilePhoto}
            activeOpacity={0.8}
          >
            <Text style={styles.changePhotoButtonText}>Change Profile Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Account Settings section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Settings</Text>

          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate("ChangeEmail")}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <Ionicons name="mail-outline" size={20} color={COLORS.textSecondaryDark} />
              <Text style={styles.rowLabel}>Change Email</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondaryDark} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate("ChangePassword")}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <Ionicons name="lock-closed-outline" size={20} color={COLORS.textSecondaryDark} />
              <Text style={styles.rowLabel}>Change Password</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondaryDark} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate("PhoneNumber")}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <Ionicons name="call-outline" size={20} color={COLORS.textSecondaryDark} />
              <Text style={styles.rowLabel}>Phone Number</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondaryDark} />
          </TouchableOpacity>
        </View>

        {/* Data & Privacy section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data & Privacy</Text>

          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate("DownloadData")}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <Ionicons name="download-outline" size={20} color={COLORS.textSecondaryDark} />
              <Text style={styles.rowLabel}>Download My Data</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondaryDark} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate("DeactivateAccount")}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <Ionicons name="pause-circle-outline" size={20} color={COLORS.textSecondaryDark} />
              <Text style={styles.rowLabel}>Deactivate Account</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondaryDark} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate("DeleteAccount")}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
              <Text style={[styles.rowLabel, styles.dangerText]}>Delete Account</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondaryDark} />
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
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
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textPrimaryDark,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: COLORS.textSecondaryDark,
  },
  changePhotoButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.accent,
    backgroundColor: "transparent",
    alignItems: "center",
    marginBottom: 8,
  },
  changePhotoButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.accent,
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
  dangerText: {
    color: "#EF4444",
  },
});

export default ManageAccountScreen;

