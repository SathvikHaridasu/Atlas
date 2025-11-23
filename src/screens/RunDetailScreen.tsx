import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect, useState, useMemo } from "react";
import {
  ActivityIndicator,
  ScrollView,
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
import type { RootStackParamList } from "../navigation/RootNavigator";

type RunDetailRouteProp = RouteProp<RootStackParamList, "RunDetail">;

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

const RunDetailScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RunDetailRouteProp>();
  const { theme } = useAppTheme();
  const { user, profile } = useAuth();
  const { activityId } = route.params;

  const [activity, setActivity] = useState<SavedActivity | null>(null);
  const [loading, setLoading] = useState(true);

  // Calculate derived values safely (even when activity is null)
  const distanceKm = activity?.distance_km ?? 0;
  const avgSplit = activity?.avg_split_per_km
    ? (typeof activity.avg_split_per_km === "string"
        ? parseFloat(activity.avg_split_per_km)
        : activity.avg_split_per_km) ?? 0
    : 0;
  const hasSplit = avgSplit > 0 && Number.isFinite(avgSplit);

  // Pace trend segments for chart - must be called unconditionally
  const paceSegments = useMemo(() => {
    if (!hasSplit || !Number.isFinite(avgSplit)) {
      return [];
    }
    const base = avgSplit;
    const deltas = [-0.6, -0.3, 0, 0.2, 0.4, 0.1];
    return deltas.map((d, idx) => ({
      id: idx.toString(),
      value: Math.max(3, base + d),
    }));
  }, [avgSplit, hasSplit]);

  useEffect(() => {
    loadActivity();
  }, [activityId, user]);

  const loadActivity = async () => {
    setLoading(true);
    try {
      let foundActivity: SavedActivity | null = null;

      // Try to load from Supabase first
      if (user) {
        try {
          const { data, error } = await supabase
            .from("activities")
            .select("*")
            .eq("id", activityId)
            .eq("user_id", user.id)
            .single();

          if (!error && data) {
            foundActivity = data as SavedActivity;
          }
        } catch (supabaseError) {
          console.warn("Supabase query failed, trying AsyncStorage:", supabaseError);
        }
      }

      // If not found in Supabase, try AsyncStorage
      if (!foundActivity) {
        try {
          const stored = await AsyncStorage.getItem("user_activities");
          if (stored) {
            const parsed = JSON.parse(stored) as SavedActivity[];
            const found = parsed.find((a) => a.id === activityId);
            if (found && (!user || found.user_id === user.id)) {
              foundActivity = found;
            }
          }
        } catch (storageError) {
          console.warn("AsyncStorage read failed:", storageError);
        }
      }

      setActivity(foundActivity);
    } catch (error) {
      console.error("Error loading activity:", error);
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
      return date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      });
    }
  };

  const displayName =
    profile?.full_name ||
    profile?.username ||
    user?.user_metadata?.full_name ||
    "Atlas Runner";

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Run</Text>
          <View style={styles.backButton} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (!activity) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Run</Text>
          <View style={styles.backButton} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.text }]}>Run not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Derived insights (calculated after we know activity exists)
  const totalMinutes = activity ? activity.elapsed_seconds / 60 : 0;
  const kmPerHour = distanceKm > 0 && activity && activity.elapsed_seconds > 0
    ? (distanceKm / (activity.elapsed_seconds / 3600))
    : 0;

  const formattedDistance = `${distanceKm.toFixed(2)} km`;
  const formattedTime = activity ? formatTime(activity.elapsed_seconds) : "00:00";
  const formattedDate = activity ? formatDate(activity.created_at) : "";

  // Gen-Z pace interpretation
  let paceLabel = "Chill recovery pace";
  let paceEmoji = "😌";
  if (hasSplit && avgSplit < 5.0) {
    paceLabel = "You were flying fr";
    paceEmoji = "🚀";
  } else if (hasSplit && avgSplit < 6.0) {
    paceLabel = "Low-key race pace";
    paceEmoji = "🔥";
  } else if (hasSplit && avgSplit < 7.5) {
    paceLabel = "Solid grind, big W";
    paceEmoji = "💪";
  }

  // Highlights
  const highlights: string[] = [];
  if (distanceKm === 0 && totalMinutes > 0) {
    highlights.push(`Time on feet: ${totalMinutes.toFixed(0)} min — still counts.`);
  } else {
    highlights.push(`Total grind: ${distanceKm.toFixed(2)} km in ${formattedTime}.`);
  }

  if (kmPerHour > 10) {
    highlights.push("Speed check: that's actually kinda rapid 👀");
  } else if (kmPerHour > 7) {
    highlights.push("Steady pace — future PR unlocked 🔓");
  } else if (kmPerHour > 0) {
    highlights.push("Chill pace, recovery king/queen 👑");
  }

  if (distanceKm >= 10) {
    highlights.push("Double-digit run?? Massive W.");
  } else if (distanceKm >= 5) {
    highlights.push("5k+ squad only, you're built different.");
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={["top"]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Run</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header row with avatar and user info */}
        <View style={styles.headerRow}>
          <View style={[styles.avatarCircle, { backgroundColor: theme.card }]}>
            <Ionicons name="footsteps-outline" size={20} color={theme.accent} />
          </View>
          <View style={styles.headerText}>
            <Text style={[styles.userName, { color: theme.text }]}>{displayName}</Text>
            <Text style={[styles.metaText, { color: theme.mutedText }]}>{formattedDate}</Text>
          </View>
        </View>

        {/* Activity title */}
        <Text style={[styles.activityTitle, { color: theme.text }]}>{activity.title}</Text>

        {/* Stats grid card */}
        <View style={[styles.statsCard, { backgroundColor: theme.card }]}>
          <View style={styles.statsRow}>
            <View style={styles.statBlock}>
              <Text style={[styles.statLabel, { color: theme.mutedText }]}>Distance</Text>
              <Text style={[styles.statValue, { color: theme.accent }]}>{formattedDistance}</Text>
            </View>
            <View style={styles.statBlock}>
              <Text style={[styles.statLabel, { color: theme.mutedText }]}>Avg split</Text>
              <Text style={[styles.statValue, { color: theme.accent }]}>
                {hasSplit ? `${avgSplit.toFixed(1)} min/km` : "-"}
              </Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBlock}>
              <Text style={[styles.statLabel, { color: theme.mutedText }]}>Moving time</Text>
              <Text style={[styles.statValue, { color: theme.accent }]}>{formattedTime}</Text>
            </View>
            <View style={styles.statBlock}>
              <Text style={[styles.statLabel, { color: theme.mutedText }]}>Points</Text>
              <Text style={[styles.statValue, { color: theme.accent }]}>
                {(activity.points ?? 0).toString()}
              </Text>
            </View>
          </View>
        </View>

        {/* Insight strip */}
        <View style={[styles.insightStrip, { backgroundColor: theme.card }]}>
          <Text style={styles.insightEmoji}>{paceEmoji}</Text>
          <View style={styles.insightTextContainer}>
            <Text style={[styles.insightTitle, { color: theme.text }]}>{paceLabel}</Text>
            <Text style={[styles.insightSubtitle, { color: theme.mutedText }]}>
              Avg split {hasSplit ? `${avgSplit.toFixed(1)} min/km` : "-"} • {distanceKm.toFixed(2)} km
            </Text>
          </View>
        </View>

        {/* Pace trend chart */}
        {paceSegments.length > 0 && (
          <View style={[styles.chartCard, { backgroundColor: theme.card }]}>
            <View style={styles.chartHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Pace trend</Text>
              <Text style={[styles.chartTag, { color: theme.mutedText }]}>lower is faster</Text>
            </View>
            <View style={styles.chartRow}>
              {paceSegments.map((segment) => {
                const normalized = Math.min(Math.max(segment.value, 3), 10); // clamp
                const heightPct = ((10 - normalized) / 7) * 100; // inverted: faster = taller

                return (
                  <View key={segment.id} style={styles.chartBarContainer}>
                    <View style={[styles.chartBar, { height: `${heightPct}%`, backgroundColor: theme.accent }]} />
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Highlights card */}
        <View style={[styles.highlightsCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Highlights</Text>
          {highlights.map((h, idx) => (
            <Text key={idx.toString()} style={[styles.highlightItem, { color: theme.mutedText }]}>
              • {h}
            </Text>
          ))}
          <Text style={[styles.genZCTA, { color: theme.accent }]}>
            Certified W run. Screenshot this and flex later. 🏆
          </Text>
        </View>

        {/* Effort / type row */}
        <View style={styles.rowCard}>
          <Ionicons name="speedometer-outline" size={20} color="#fff" />
          <Text style={[styles.rowText, { color: theme.text }]}>
            {activity.type === "Run" ? "Easy run" : activity.type}
          </Text>
        </View>

        {/* Notes section */}
        {activity.notes && (
          <View style={styles.notesCard}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Notes</Text>
            <Text style={[styles.notesText, { color: theme.mutedText }]}>{activity.notes}</Text>
          </View>
        )}

        {/* Actions row */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionItem} activeOpacity={0.7}>
            <Ionicons name="heart-outline" size={22} color={theme.mutedText} />
            <Text style={[styles.actionLabel, { color: theme.mutedText }]}>Like</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionItem} activeOpacity={0.7}>
            <Ionicons name="chatbubble-outline" size={22} color={theme.mutedText} />
            <Text style={[styles.actionLabel, { color: theme.mutedText }]}>Note</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionItem} activeOpacity={0.7}>
            <Ionicons name="share-outline" size={22} color={theme.mutedText} />
            <Text style={[styles.actionLabel, { color: theme.mutedText }]}>Share</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const accent = "#03CA59";
const bg = "#050608";
const cardBg = "#0B0F14";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: bg,
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: cardBg,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    marginLeft: 12,
  },
  userName: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  metaText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
  },
  activityTitle: {
    marginTop: 16,
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  statsCard: {
    marginTop: 20,
    backgroundColor: cardBg,
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statBlock: {
    flex: 1,
  },
  statLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    color: accent,
    fontSize: 18,
    fontWeight: "700",
  },
  rowCard: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
  },
  rowText: {
    marginLeft: 10,
    color: "#FFFFFF",
    fontSize: 14,
  },
  notesCard: {
    marginTop: 24,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  notesText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
    lineHeight: 20,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginTop: 24,
  },
  actionItem: {
    alignItems: "center",
  },
  actionLabel: {
    marginTop: 4,
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
  },
  insightStrip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: cardBg,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginTop: 16,
  },
  insightEmoji: {
    fontSize: 22,
  },
  insightTextContainer: {
    marginLeft: 10,
    flex: 1,
  },
  insightTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  insightSubtitle: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
  },
  chartCard: {
    marginTop: 18,
    backgroundColor: cardBg,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  chartTag: {
    fontSize: 10,
    color: "rgba(255,255,255,0.5)",
  },
  chartRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 70,
  },
  chartBarContainer: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 3,
    justifyContent: "flex-end",
  },
  chartBar: {
    width: 10,
    borderRadius: 6,
    backgroundColor: accent,
  },
  highlightsCard: {
    marginTop: 20,
    backgroundColor: cardBg,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  highlightItem: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    marginTop: 4,
  },
  genZCTA: {
    marginTop: 10,
    color: accent,
    fontSize: 13,
    fontWeight: "600",
  },
});

export default RunDetailScreen;

