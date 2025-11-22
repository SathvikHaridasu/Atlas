import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  useColorScheme,
} from "react-native";

type ThemeOption = "system" | "light" | "dark";

// Color palette
const COLORS = {
  accent: "#03CA59",
  // Light theme
  bgLight: "#050608",
  cardLight: "#0B0F14",
  borderLight: "rgba(3, 202, 89, 0.25)",
  textPrimaryLight: "#F9FAFB",
  textSecondaryLight: "#9CA3AF",
  // Dark theme
  bgDark: "#020308",
  cardDark: "#050A0E",
  borderDark: "rgba(3, 202, 89, 0.4)",
  textPrimaryDark: "#F9FAFB",
  textSecondaryDark: "#9CA3AF",
};

interface SettingsScreenProps {}

const SettingsScreen: React.FC<SettingsScreenProps> = () => {
  // In a real app, this would come from auth/user state
  const mockUser = {
    name: "Jane Runner",
    email: "jane.runner@example.com",
    username: "@janeruns",
  };

  const systemScheme = useColorScheme();
  const [theme, setTheme] = useState<ThemeOption>("system");
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);

  const isDark =
    theme === "dark" || (theme === "system" && systemScheme === "dark");

  const handleThemeChange = (option: ThemeOption) => {
    setTheme(option);
    // TODO: wire this into your real theme system (context/store + persistence)
  };

  const handleSignOut = () => {
    // TODO: replace with your real sign-out logic
    console.log("Sign out pressed");
  };

  const handleEditProfile = () => {
    // TODO: navigate to Edit Profile screen when available
    console.log("Edit profile pressed");
  };

  return (
    <ScrollView
      style={[styles.container, isDark && styles.containerDark]}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Profile header */}
      <View style={[styles.card, isDark && styles.cardDark]}>
        <View style={[styles.avatar, isDark && styles.avatarDark]}>
          <Text style={[styles.avatarText, isDark && styles.avatarTextDark]}>
            {mockUser.name.charAt(0)}
          </Text>
        </View>

        <View style={styles.profileInfo}>
          <Text style={[styles.name, isDark && styles.textDark]}>
            {mockUser.name}
          </Text>
          <Text style={[styles.email, isDark && styles.subtleTextDark]}>
            {mockUser.email}
          </Text>
          <Text style={[styles.username, isDark && styles.subtleTextDark]}>
            {mockUser.username}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.editButton}
          onPress={handleEditProfile}
          activeOpacity={0.8}
        >
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>

      {/* Account section */}
      <View style={[styles.section, isDark && styles.sectionDark]}>
        <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
          Account
        </Text>

        <TouchableOpacity style={styles.row} activeOpacity={0.7}>
          <View>
            <Text style={[styles.rowLabel, isDark && styles.textDark]}>
              Personal info
            </Text>
            <Text
              style={[styles.rowDescription, isDark && styles.subtleTextDark]}
            >
              Name, email, and basic details
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.row} activeOpacity={0.7}>
          <View>
            <Text style={[styles.rowLabel, isDark && styles.textDark]}>
              Connected accounts
            </Text>
            <Text
              style={[styles.rowDescription, isDark && styles.subtleTextDark]}
            >
              Link Apple / Google / others
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Notifications section */}
      <View style={[styles.section, isDark && styles.sectionDark]}>
        <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
          Notifications
        </Text>

        <View style={styles.row}>
          <View>
            <Text style={[styles.rowLabel, isDark && styles.textDark]}>
              Push notifications
            </Text>
            <Text
              style={[styles.rowDescription, isDark && styles.subtleTextDark]}
            >
              Updates about runs, groups, and challenges
            </Text>
          </View>
          <Switch
            value={pushEnabled}
            onValueChange={setPushEnabled}
            trackColor={{ false: "rgba(148,163,184,0.4)", true: COLORS.accent }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View style={styles.row}>
          <View>
            <Text style={[styles.rowLabel, isDark && styles.textDark]}>
              Email updates
            </Text>
            <Text
              style={[styles.rowDescription, isDark && styles.subtleTextDark]}
            >
              Summaries and important announcements
            </Text>
          </View>
          <Switch
            value={emailEnabled}
            onValueChange={setEmailEnabled}
            trackColor={{ false: "rgba(148,163,184,0.4)", true: COLORS.accent }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>

      {/* Appearance section */}
      <View style={[styles.section, isDark && styles.sectionDark]}>
        <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
          Appearance
        </Text>

        <View style={styles.segmentContainer}>
          <ThemeChip
            label="System"
            selected={theme === "system"}
            onPress={() => handleThemeChange("system")}
            isDark={isDark}
          />
          <ThemeChip
            label="Light"
            selected={theme === "light"}
            onPress={() => handleThemeChange("light")}
            isDark={isDark}
          />
          <ThemeChip
            label="Dark"
            selected={theme === "dark"}
            onPress={() => handleThemeChange("dark")}
            isDark={isDark}
          />
        </View>

        <Text
          style={[styles.helperText, isDark && styles.helperTextDark]}
        >
          Choose how the app looks. "System" follows your device's appearance.
        </Text>
      </View>

      {/* App section */}
      <View style={[styles.section, isDark && styles.sectionDark]}>
        <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
          App
        </Text>

        <TouchableOpacity style={styles.row} activeOpacity={0.7}>
          <View>
            <Text style={[styles.rowLabel, isDark && styles.textDark]}>
              Language
            </Text>
            <Text
              style={[styles.rowDescription, isDark && styles.subtleTextDark]}
            >
              English (more coming soon)
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.row} activeOpacity={0.7}>
          <View>
            <Text style={[styles.rowLabel, isDark && styles.textDark]}>
              Help & feedback
            </Text>
            <Text
              style={[styles.rowDescription, isDark && styles.subtleTextDark]}
            >
              Get support or tell us what to improve
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.row} activeOpacity={0.7}>
          <View>
            <Text style={[styles.rowLabel, isDark && styles.textDark]}>
              About
            </Text>
            <Text
              style={[styles.rowDescription, isDark && styles.subtleTextDark]}
            >
              Version 1.0.0 • Hackathon build
            </Text>
          </View>
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
  );
};

interface ThemeChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  isDark: boolean;
}

const ThemeChip: React.FC<ThemeChipProps> = ({ label, selected, onPress, isDark }) => {
  return (
    <TouchableOpacity
      style={[styles.chip, selected && styles.chipSelected, isDark && styles.chipDark]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.chipLabel, selected && styles.chipLabelSelected, isDark && !selected && styles.chipLabelDark]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgLight,
  },
  containerDark: {
    backgroundColor: COLORS.bgDark,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: COLORS.cardLight,
    borderRadius: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  cardDark: {
    backgroundColor: COLORS.cardDark,
    borderColor: COLORS.borderDark,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(15,23,42,0.9)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  avatarDark: {
    borderColor: COLORS.borderDark,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "600",
    color: COLORS.textPrimaryLight,
  },
  avatarTextDark: {
    color: COLORS.textPrimaryDark,
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.textPrimaryLight,
  },
  email: {
    marginTop: 4,
    fontSize: 14,
    color: COLORS.textSecondaryLight,
  },
  username: {
    marginTop: 2,
    fontSize: 13,
    color: COLORS.textSecondaryLight,
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.accent,
    backgroundColor: "transparent",
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.accent,
  },
  section: {
    backgroundColor: COLORS.cardLight,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  sectionDark: {
    backgroundColor: COLORS.cardDark,
    borderColor: COLORS.borderDark,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 6,
    color: COLORS.textSecondaryLight,
  },
  sectionTitleDark: {
    color: COLORS.textSecondaryDark,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    alignItems: "center",
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimaryLight,
  },
  rowDescription: {
    fontSize: 13,
    color: COLORS.textSecondaryLight,
    marginTop: 2,
    maxWidth: 260,
  },
  segmentContainer: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  chip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.4)",
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  chipDark: {
    borderColor: "rgba(148, 163, 184, 0.4)",
  },
  chipSelected: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accent,
  },
  chipLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.textSecondaryLight,
  },
  chipLabelDark: {
    color: COLORS.textSecondaryDark,
  },
  chipLabelSelected: {
    color: "#020617",
  },
  helperText: {
    fontSize: 12,
    color: COLORS.textSecondaryLight,
    marginTop: 8,
    marginBottom: 6,
  },
  helperTextDark: {
    color: COLORS.textSecondaryDark,
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
    color: "rgba(239,68,68,0.6)",
  },
  textDark: {
    color: COLORS.textPrimaryDark,
  },
  subtleTextDark: {
    color: COLORS.textSecondaryDark,
  },
});

export default SettingsScreen;
