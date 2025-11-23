import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppTheme } from "../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabaseClient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NeonCard } from "../components/ui/NeonCard";
import type { RootStackParamList } from "../navigation/RootNavigator";

interface SavedActivity {
  id: string;
  user_id?: string;
  title: string;
  notes?: string | null;
  type: string;
  distance_km: number;
  elapsed_seconds: number;
  avg_split_per_km?: number | null;
  points?: number;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

const SavedRunsScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme } = useAppTheme();
  const { user } = useAuth();
  const [activities, setActivities] = useState<SavedActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivities();
  }, [user]);

  const loadActivities = async () => {
    setLoading(true);
    try {
      let loadedActivities: SavedActivity[] = [];

      // Try to load from Supabase first
      if (user) {
        try {
          const { data, error } = await supabase
            .from("activities")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

          if (!error && data) {
            loadedActivities = data as SavedActivity[];
          }
        } catch (supabaseError) {
          console.warn("Supabase query failed, trying AsyncStorage:", supabaseError);
        }
      }

      // If no Supabase data, try AsyncStorage
      if (loadedActivities.length === 0) {
        try {
          const stored = await AsyncStorage.getItem("user_activities");
          if (stored) {
            const parsed = JSON.parse(stored) as SavedActivity[];
            // Filter by user_id if available
            if (user) {
              loadedActivities = parsed.filter((a) => a.user_id === user.id);
            } else {
              loadedActivities = parsed;
            }
            // Sort by created_at descending
            loadedActivities.sort((a, b) => {
              const dateA = new Date(a.created_at).getTime();
              const dateB = new Date(b.created_at).getTime();
              return dateB - dateA;
            });
          }
        } catch (storageError) {
          console.warn("AsyncStorage read failed:", storageError);
        }
      }

      setActivities(loadedActivities);
    } catch (error) {
      console.error("Error loading activities:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    if (h > 0) {
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    }
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "Today";
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined });
    }
  };

  const renderActivityItem = ({ item }: { item: SavedActivity }) => {
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => navigation.navigate("RunDetail", { activityId: item.id })}
      >
        <NeonCard style={styles.activityCard}>
        <View style={styles.activityHeader}>
          <View style={styles.activityHeaderLeft}>
            <Ionicons name="footsteps" size={20} color={theme.accent} style={styles.activityIcon} />
            <View style={styles.activityTitleContainer}>
              <Text style={[styles.activityTitle, { color: theme.text }]}>{item.title}</Text>
              <Text style={[styles.activityDate, { color: theme.mutedText }]}>
                {formatDate(item.created_at)}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.mutedText} />
        </View>

        <View style={styles.activityStats}>
          <View style={styles.activityStatItem}>
            <Text style={[styles.activityStatLabel, { color: theme.mutedText }]}>Distance</Text>
            <Text style={[styles.activityStatValue, { color: theme.accent }]}>
              {item.distance_km.toFixed(2)} km
            </Text>
          </View>
          <View style={styles.activityStatItem}>
            <Text style={[styles.activityStatLabel, { color: theme.mutedText }]}>Time</Text>
            <Text style={[styles.activityStatValue, { color: theme.accent }]}>
              {formatTime(item.elapsed_seconds)}
            </Text>
          </View>
          {item.avg_split_per_km && (
            <View style={styles.activityStatItem}>
              <Text style={[styles.activityStatLabel, { color: theme.mutedText }]}>Split</Text>
              <Text style={[styles.activityStatValue, { color: theme.accent }]}>
                {item.avg_split_per_km.toFixed(1)} min/km
              </Text>
            </View>
          )}
        </View>

        {item.notes && (
          <Text style={[styles.activityNotes, { color: theme.mutedText }]} numberOfLines={2}>
            {item.notes}
          </Text>
        )}
      </NeonCard>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="footsteps-outline" size={64} color={theme.mutedText} style={styles.emptyIcon} />
        <Text style={[styles.emptyTitle, { color: theme.text }]}>No runs saved yet</Text>
        <Text style={[styles.emptySubtitle, { color: theme.mutedText }]}>
          Finish a run and save it to see it here.
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={["top"]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Saved Runs</Text>
        <View style={styles.backButton} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.accent} />
        </View>
      ) : (
        <FlatList
          data={activities}
          renderItem={renderActivityItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  backButton: {
    width: 40,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  activityCard: {
    marginBottom: 12,
  },
  activityHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  activityHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  activityIcon: {
    marginRight: 12,
  },
  activityTitleContainer: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  activityDate: {
    fontSize: 12,
  },
  activityStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  activityStatItem: {
    flex: 1,
  },
  activityStatLabel: {
    fontSize: 11,
    marginBottom: 4,
  },
  activityStatValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  activityNotes: {
    fontSize: 13,
    marginTop: 12,
    lineHeight: 18,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
  },
  emptyIcon: {
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 32,
  },
});

export default SavedRunsScreen;

