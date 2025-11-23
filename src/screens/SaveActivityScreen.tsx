import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp, CommonActions } from "@react-navigation/native";
import React, { useState, useEffect } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppTheme } from "../contexts/ThemeContext";
import { NeonCard } from "../components/ui/NeonCard";
import { usePressScale } from "../hooks/usePressScale";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabaseClient";

type ActivityType = "Run" | "Walk" | "Other";

interface SaveActivityRouteParams {
  distanceKm: number;
  elapsedSeconds: number;
  avgSplitPerKm: number | null;
  points: number;
  pathCoords?: Array<{ latitude: number; longitude: number }>;
  startedAt: string;
  completedAt: string;
}

type SaveActivityRouteProp = RouteProp<
  { SaveActivity: SaveActivityRouteParams },
  "SaveActivity"
>;

const SaveActivityScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<SaveActivityRouteProp>();
  const { theme } = useAppTheme();
  const { user } = useAuth();
  const { animatedStyle: saveButtonStyle, handlePressIn: savePressIn, handlePressOut: savePressOut } = usePressScale(0.95);

  const {
    distanceKm,
    elapsedSeconds,
    avgSplitPerKm,
    points,
    startedAt,
    completedAt,
  } = route.params;

  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [activityType, setActivityType] = useState<ActivityType>("Run");
  const [isSaving, setIsSaving] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);

  // Prefill title based on time of day
  useEffect(() => {
    const hour = new Date().getHours();
    let defaultTitle = "Run";
    if (hour >= 5 && hour < 12) {
      defaultTitle = "Morning Run";
    } else if (hour >= 12 && hour < 17) {
      defaultTitle = "Lunch Run";
    } else if (hour >= 17 && hour < 21) {
      defaultTitle = "Evening Run";
    } else {
      defaultTitle = "Night Run";
    }
    setTitle(defaultTitle);
  }, []);

  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    if (h > 0) {
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    }
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const formattedDistance = distanceKm.toFixed(2);
  const formattedTime = formatTime(elapsedSeconds);
  const formattedSplit = avgSplitPerKm ? `${avgSplitPerKm.toFixed(1)} min/km` : "-";

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert("Title Required", "Please enter a title for your activity.");
      return;
    }

    setIsSaving(true);

    try {
      const activity = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        user_id: user?.id,
        title: title.trim(),
        notes: notes.trim() || null,
        type: activityType,
        distance_km: distanceKm,
        elapsed_seconds: elapsedSeconds,
        avg_split_per_km: avgSplitPerKm,
        points,
        started_at: startedAt,
        completed_at: completedAt,
        created_at: new Date().toISOString(),
      };

      // Try to save to Supabase first (if activities table exists)
      // Otherwise, save to AsyncStorage as fallback
      try {
        const { error } = await supabase.from("activities").insert(activity);
        if (error) {
          console.warn("Supabase save failed, using local storage:", error);
          // Fall through to AsyncStorage
        } else {
          // Successfully saved to Supabase
          // Close modal and navigate to Home
          navigation.goBack(); // Close SaveActivity modal
          // Get the tab navigator and navigate to Home
          const rootNavigator = navigation.getParent();
          if (rootNavigator) {
            (rootNavigator as any).navigate("MainDrawer", {
              screen: "MainTabs",
              params: { screen: "Home" },
            });
          }
          return;
        }
      } catch (supabaseError) {
        console.warn("Supabase not available, using local storage:", supabaseError);
        // Fall through to AsyncStorage
      }

      // Fallback: Save to AsyncStorage
      const AsyncStorage = require("@react-native-async-storage/async-storage").default;
      const existingActivities = await AsyncStorage.getItem("user_activities");
      const activities = existingActivities ? JSON.parse(existingActivities) : [];
      activities.push(activity);
      await AsyncStorage.setItem("user_activities", JSON.stringify(activities));

      // Close modal and navigate to Home
      navigation.goBack(); // Close SaveActivity modal
      // Get the root navigator and navigate to Home
      const rootNavigator = navigation.getParent();
      if (rootNavigator) {
        (rootNavigator as any).navigate("MainDrawer", {
          screen: "MainTabs",
          params: { screen: "Home" },
        });
      }
    } catch (error) {
      console.error("Error saving activity:", error);
      Alert.alert("Error", "Failed to save activity. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    Alert.alert(
      "Discard Run",
      "Are you sure you want to discard this run? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Discard",
          style: "destructive",
          onPress: () => {
            navigation.goBack();
          },
        },
      ]
    );
  };

  const activityTypes: ActivityType[] = ["Run", "Walk", "Other"];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={["top"]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={handleDiscard} style={styles.headerButton}>
          <Text style={[styles.headerButtonText, { color: theme.mutedText }]}>Discard</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Save Activity</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Card */}
        <NeonCard highlight style={styles.summaryCard}>
          <Text style={[styles.summaryTitle, { color: theme.text }]}>Today's Run</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: theme.mutedText }]}>Distance</Text>
              <Text style={[styles.summaryValue, { color: theme.accent }]}>{formattedDistance} km</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: theme.mutedText }]}>Time</Text>
              <Text style={[styles.summaryValue, { color: theme.accent }]}>{formattedTime}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: theme.mutedText }]}>Avg split</Text>
              <Text style={[styles.summaryValue, { color: theme.accent }]}>{formattedSplit}</Text>
            </View>
          </View>
        </NeonCard>

        {/* Activity Title */}
        <View style={styles.formSection}>
          <Text style={[styles.label, { color: theme.text }]}>Activity Title</Text>
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
                color: theme.text,
              },
            ]}
            placeholder="Morning Run"
            placeholderTextColor={theme.mutedText}
            value={title}
            onChangeText={setTitle}
            autoCapitalize="words"
          />
        </View>

        {/* Description / Notes */}
        <View style={styles.formSection}>
          <Text style={[styles.label, { color: theme.text }]}>Description</Text>
          <TextInput
            style={[
              styles.textArea,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
                color: theme.text,
              },
            ]}
            placeholder="How'd it go? Add a quick note."
            placeholderTextColor={theme.mutedText}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Activity Type */}
        <View style={styles.formSection}>
          <Text style={[styles.label, { color: theme.text }]}>Activity Type</Text>
          <TouchableOpacity
            style={[
              styles.dropdown,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
            onPress={() => setShowTypeDropdown(!showTypeDropdown)}
          >
            <Text style={[styles.dropdownText, { color: theme.text }]}>{activityType}</Text>
            <Ionicons
              name={showTypeDropdown ? "chevron-up" : "chevron-down"}
              size={20}
              color={theme.mutedText}
            />
          </TouchableOpacity>
          {showTypeDropdown && (
            <View
              style={[
                styles.dropdownMenu,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                },
              ]}
            >
              {activityTypes.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.dropdownItem,
                    activityType === type && {
                      backgroundColor: theme.accent + "20",
                    },
                  ]}
                  onPress={() => {
                    setActivityType(type);
                    setShowTypeDropdown(false);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      { color: theme.text },
                      activityType === type && { color: theme.accent, fontWeight: "600" },
                    ]}
                  >
                    {type}
                  </Text>
                  {activityType === type && (
                    <Ionicons name="checkmark" size={20} color={theme.accent} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Discard button */}
        <TouchableOpacity onPress={handleDiscard} style={styles.discardButton}>
          <Text style={[styles.discardButtonText, { color: theme.mutedText }]}>Discard run</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Save Button */}
      <View style={[styles.footer, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: theme.accent }]}
          onPress={handleSave}
          disabled={isSaving}
          onPressIn={savePressIn}
          onPressOut={savePressOut}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save Activity</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050608",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerButton: {
    minWidth: 80,
    paddingVertical: 8,
  },
  headerButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  summaryCard: {
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 12,
    marginBottom: 6,
    fontWeight: "500",
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  formSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  textInput: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  textArea: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    minHeight: 100,
  },
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dropdownText: {
    fontSize: 16,
    fontWeight: "500",
  },
  dropdownMenu: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dropdownItemText: {
    fontSize: 16,
  },
  discardButton: {
    alignItems: "center",
    paddingVertical: 16,
    marginTop: 8,
  },
  discardButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
  },
  saveButton: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#03CA59",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
});

export default SaveActivityScreen;

