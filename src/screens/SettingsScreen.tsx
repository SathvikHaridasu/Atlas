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
        <View style={styles.avatar}>
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
        <Text style={[styles.sectionTitle, isDark && styles.textDark]}>
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
        <Text style={[styles.sectionTitle, isDark && styles.textDark]}>
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
          />
        </View>
      </View>

      {/* Appearance section */}
      <View style={[styles.section, isDark && styles.sectionDark]}>
        <Text style={[styles.sectionTitle, isDark && styles.textDark]}>
          Appearance
        </Text>

        <View style={styles.segmentContainer}>
          <ThemeChip
            label="System"
            selected={theme === "system"}
            onPress={() => handleThemeChange("system")}
          />
          <ThemeChip
            label="Light"
            selected={theme === "light"}
            onPress={() => handleThemeChange("light")}
          />
          <ThemeChip
            label="Dark"
            selected={theme === "dark"}
            onPress={() => handleThemeChange("dark")}
          />
        </View>

        <Text
          style={[styles.helperText, isDark && styles.subtleTextDark]}
        >
          Choose how the app looks. "System" follows your device's appearance.
        </Text>
      </View>

      {/* App section */}
      <View style={[styles.section, isDark && styles.sectionDark]}>
        <Text style={[styles.sectionTitle, isDark && styles.textDark]}>
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
}

const ThemeChip: React.FC<ThemeChipProps> = ({ label, selected, onPress }) => {
  return (
    <TouchableOpacity
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7F7",
  },
  containerDark: {
    backgroundColor: "#050509",
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: "#000000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  cardDark: {
    backgroundColor: "#111827",
    shadowOpacity: 0.3,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "600",
    color: "#111827",
  },
  avatarTextDark: {
    color: "#F9FAFB",
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111827",
  },
  email: {
    marginTop: 4,
    fontSize: 14,
    color: "#6B7280",
  },
  username: {
    marginTop: 2,
    fontSize: 13,
    color: "#9CA3AF",
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#111827",
  },
  section: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
    marginBottom: 16,
  },
  sectionDark: {
    backgroundColor: "#111827",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 6,
    color: "#6B7280",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    alignItems: "center",
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#111827",
  },
  rowDescription: {
    fontSize: 13,
    color: "#6B7280",
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
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  chipSelected: {
    borderColor: "#111827",
    backgroundColor: "#111827",
  },
  chipLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
  },
  chipLabelSelected: {
    color: "#F9FAFB",
  },
  helperText: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 8,
    marginBottom: 6,
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
    borderColor: "#EF4444",
  },
  signOutText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#EF4444",
  },
  textDark: {
    color: "#F9FAFB",
  },
  subtleTextDark: {
    color: "#9CA3AF",
  },
});

export default SettingsScreen;
