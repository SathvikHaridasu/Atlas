import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import * as Location from "expo-location";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MapView, { Circle, LatLng, MapPressEvent, Marker, Polygon, Polyline, Region } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";
import { useMapState } from "../contexts/MapStateContext";
import { useRunStats } from "../contexts/RunStatsContext";
import { useAppTheme } from "../contexts/ThemeContext";
import {
    captureTerritoryForRun,
    fetchTerritoriesForRegion,
    tileToBounds,
    type LatLng as TerritoryLatLng,
    type TerritoryTile,
} from "../lib/territoryHelper";

const POINTS_KEY = "userPoints";

type RunStatus = "idle" | "running" | "paused";

const RunScreen: React.FC = () => {
  const { updateStats } = useRunStats();
  const { theme } = useAppTheme();
  const { session, profile } = useAuth();
  const { masterRegion } = useMapState();
  const navigation = useNavigation();

  // Get avatar URL from profile or use placeholder
  const avatarUrl =
    profile?.avatar_url ??
    (session?.user?.user_metadata as any)?.avatar_url ??
    `https://ui-avatars.com/api/?name=${encodeURIComponent(session?.user?.email?.split('@')[0] || 'Runner')}&background=03CA59&color=ffffff`;
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [region, setRegion] = useState<Region | undefined>(undefined);
  const [position, setPosition] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const mapRef = useRef<MapView | null>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  // Run tracking state
  const [runStatus, setRunStatus] = useState<RunStatus>("idle");
  const isRunning = runStatus === "running";
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [totalDistanceMeters, setTotalDistanceMeters] = useState(0);
  const [averagePace, setAveragePace] = useState<string>("-");
  const [points, setPoints] = useState(0);
  const [isPlanningRoute, setIsPlanningRoute] = useState(false);
  const [routePoints, setRoutePoints] = useState<LatLng[]>([]);
  const [pathCoords, setPathCoords] = useState<LatLng[]>([]);
  const [territoryTiles, setTerritoryTiles] = useState<TerritoryTile[]>([]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const previousPositionRef = useRef<{ latitude: number; longitude: number } | null>(null);
  const pointsDistanceRef = useRef(0); // counts distance since last point was awarded

  // Helper functions
  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    if (h > 0) {
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    }

    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const getDistanceMeters = (
    from: { latitude: number; longitude: number },
    to: { latitude: number; longitude: number }
  ): number => {
    const toRad = (value: number) => (value * Math.PI) / 180;

    const R = 6371000; // meters
    const dLat = toRad(to.latitude - from.latitude);
    const dLon = toRad(to.longitude - from.longitude);
    const lat1 = toRad(from.latitude);
    const lat2 = toRad(to.latitude);

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };


  // Load saved points on mount
  useEffect(() => {
    const loadPoints = async () => {
      try {
        const stored = await AsyncStorage.getItem(POINTS_KEY);
        if (stored) {
          const loadedPoints = parseInt(stored, 10) || 0;
          setPoints(loadedPoints);
        }
      } catch (e) {
        console.warn("Failed to load points", e);
      }
    };

    loadPoints();
  }, []);

  // Timer logic
  useEffect(() => {
    if (runStatus !== "running") {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [runStatus]);

  // Pace calculation effect
  useEffect(() => {
    const distanceKm = totalDistanceMeters / 1000;

    if (distanceKm <= 0 || elapsedSeconds <= 0) {
      setAveragePace("-");
      return;
    }

    const secPerKm = elapsedSeconds / distanceKm;
    const paceMin = Math.floor(secPerKm / 60);
    const paceSec = Math.round(secPerKm % 60);

    setAveragePace(
      `${String(paceMin).padStart(2, "0")}:${String(paceSec).padStart(2, "0")}`
    );
  }, [totalDistanceMeters, elapsedSeconds]);

  useEffect(() => {
    const setupLocation = async () => {
      // Ask for permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setHasPermission(false);
        Alert.alert("Location required", "Enable location permissions to track your run.");
        return;
      }

      setHasPermission(true);

      // Get current position once
      const current = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = current.coords;
      setPosition({ latitude, longitude });
      setRegion((prev) =>
        prev ?? {
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }
      );

      // Start watching position
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 2000, // ms
          distanceInterval: 5, // meters
        },
        (loc) => {
          const { latitude, longitude } = loc.coords;
          const currentPos = { latitude, longitude };
          setPosition(currentPos);

          // Add to path trail when running
          if (isRunning) {
            setPathCoords((prev) => {
              // Skip if it's the same as last to avoid duplicates
              const last = prev[prev.length - 1];
              if (last && last.latitude === currentPos.latitude && last.longitude === currentPos.longitude) {
                return prev;
              }
              return [...prev, currentPos];
            });
          }

          // Compute distance and points if running
          if (previousPositionRef.current && runStatus === "running") {
            const prev = previousPositionRef.current;
            const segmentDistance = getDistanceMeters(prev, currentPos);

            if (segmentDistance > 0) {
              setTotalDistanceMeters((prevTotal) => {
                const newTotal = prevTotal + segmentDistance;
                return newTotal;
              });

              // Accumulate for points
              pointsDistanceRef.current += segmentDistance;

              // Award 1 point per 100 meters
              while (pointsDistanceRef.current >= 100) {
                pointsDistanceRef.current -= 100;
                setPoints((prev) => {
                  const updated = prev + 1;
                  AsyncStorage.setItem(POINTS_KEY, String(updated)).catch((e) =>
                    console.warn("Failed to save points", e)
                  );
                  return updated;
                });
              }
            }
          }

          // Update previous position
          if (!previousPositionRef.current || isRunning) {
            previousPositionRef.current = currentPos;
          }

          // Smoothly move the map to follow the user
          if (mapRef.current) {
            mapRef.current.animateToRegion(
              {
                latitude,
                longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              },
              500
            );
          }
        }
      );
    };

    setupLocation();

    return () => {
      // Cleanup location watcher
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
      previousPositionRef.current = null;
    };
  }, [runStatus]);

  // Fetch territory tiles whenever the map region changes
  useEffect(() => {
    const loadTerritories = async () => {
      if (!region) return;

      const north = region.latitude + region.latitudeDelta / 2;
      const south = region.latitude - region.latitudeDelta / 2;
      const east = region.longitude + region.longitudeDelta / 2;
      const west = region.longitude - region.longitudeDelta / 2;

      const tiles = await fetchTerritoriesForRegion({ north, south, east, west });
      setTerritoryTiles(tiles);
    };

    loadTerritories();
  }, [region]);

  // Sync stats to RunStatsContext whenever they change
  useEffect(() => {
    updateStats({
      points,
      totalDistanceMeters,
      elapsedSeconds,
    });
  }, [points, totalDistanceMeters, elapsedSeconds, updateStats]);

  // Animate to masterRegion when screen is focused
  useFocusEffect(
    useCallback(() => {
      if (masterRegion && mapRef.current) {
        mapRef.current.animateToRegion(masterRegion, 500);
      }
    }, [masterRegion])
  );

  if (hasPermission === null || !region) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  const handleStartPause = () => {
    setRunStatus((prev) => {
      if (prev === "idle" || prev === "paused") {
        // starting or resuming
        if (prev === "idle") {
          // Starting a new run – clear previous path
          setPathCoords([]);
          previousPositionRef.current = null;
        }
        return "running";
      }
      // if running -> pause
      return "paused";
    });
  };

  const handleEndRun = () => {
    if (runStatus === "idle") return;

    const userId = session?.user?.id;
    if (userId && pathCoords.length > 1 && totalDistanceMeters > 0) {
      captureTerritoryForRun(userId, pathCoords as TerritoryLatLng[], totalDistanceMeters);
    }

    // Reset stats for a fresh run
    setRunStatus("idle");
    setElapsedSeconds(0);
    setTotalDistanceMeters(0);
    setAveragePace("-");
    setPathCoords([]);
    previousPositionRef.current = null;
    pointsDistanceRef.current = 0;
  };

  const handleToggleRoutePlanning = () => {
    setIsPlanningRoute((prev) => !prev);
    if (isPlanningRoute) {
      // Clearing route when toggling off
      setRoutePoints([]);
    }
  };

  const handleMapPressForRoute = (event: MapPressEvent) => {
    if (!isPlanningRoute) return;

    const { coordinate } = event.nativeEvent;
    setRoutePoints((prev) => [...prev, coordinate]);
  };

  if (hasPermission === false) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.accent} />
        </View>
      </SafeAreaView>
    );
  }

  const gpsConnected = position !== null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <MapView
        ref={(ref) => (mapRef.current = ref)}
        style={styles.map}
        provider="google"
        showsUserLocation
        followsUserLocation
        initialRegion={region}
        mapType="standard"
        onPress={handleMapPressForRoute}
      >
        {position && (
          <>
            {/* Custom profile marker */}
            <Marker coordinate={position} tracksViewChanges={false}>
              <View style={styles.avatarMarkerOuter}>
                <View style={styles.avatarMarkerInner}>
                  <Image
                    source={{ uri: avatarUrl }}
                    style={styles.avatarImage}
                  />
                </View>
                <View style={styles.avatarMarkerArrow} />
              </View>
            </Marker>
            {/* Growing territory circle */}
            <Circle
              center={position}
              radius={50 + totalDistanceMeters}
              strokeWidth={2}
              strokeColor="rgba(3,202,89,0.9)"
              fillColor="rgba(3,202,89,0.15)"
            />
          </>
        )}
        {/* LIVE RUN TRAIL */}
        {pathCoords.length > 1 && (
          <Polyline
            coordinates={pathCoords}
            strokeWidth={5}
            strokeColor="#03CA59"
          />
        )}
        {/* Planned route (if route planning mode) */}
        {routePoints.length > 1 && (
          <Polyline
            coordinates={routePoints}
            strokeWidth={3}
            strokeColor="rgba(255,255,255,0.8)"
            lineDashPattern={[10, 5]}
          />
        )}
        {/* Territory tiles */}
        {territoryTiles.map((tile) => {
          const bounds = tileToBounds(tile.tile_x, tile.tile_y);

          const coords = [
            { latitude: bounds.south, longitude: bounds.west },
            { latitude: bounds.south, longitude: bounds.east },
            { latitude: bounds.north, longitude: bounds.east },
            { latitude: bounds.north, longitude: bounds.west },
          ];

          const isMine = tile.owner_user_id === session?.user?.id;

          return (
            <Polygon
              key={tile.id}
              coordinates={coords}
              strokeWidth={3}
              strokeColor={isMine ? "rgba(3, 202, 89, 1)" : "rgba(255, 64, 64, 1)"}
              fillColor={isMine ? "rgba(3, 202, 89, 0.22)" : "rgba(255, 64, 64, 0.22)"}
            />
          );
        })}
      </MapView>

      {/* Points pill */}
      <View style={[styles.pointsPill, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Ionicons name="trophy" size={18} color={theme.accent} style={styles.pointsIcon} />
        <View style={styles.pointsTextContainer}>
          <Text style={[styles.pointsLabel, { color: theme.mutedText }]}>Points</Text>
          <Text style={[styles.pointsValue, { color: theme.accent }]}>{points.toLocaleString()}</Text>
        </View>
      </View>

      {/* Master Map FAB */}
      <TouchableOpacity
        style={styles.masterMapFab}
        onPress={() => navigation.navigate("MasterMap" as never)}
        activeOpacity={0.8}
      >
        <MaterialIcons name="map" size={22} color="#ffffff" />
      </TouchableOpacity>

      {/* Stats card */}
      <View style={[styles.statsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        {/* GPS status */}
        <View style={styles.gpsStatusRow}>
          <MaterialIcons
            name={gpsConnected ? "gps-fixed" : "signal-cellular-off"}
            size={16}
            color={gpsConnected ? theme.accent : "#FF4C4C"}
          />
          <Text style={[styles.gpsText, { color: gpsConnected ? theme.accent : "#FF4C4C" }]}>
            {gpsConnected ? "GPS Connected" : "No GPS signal"}
          </Text>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statBlock}>
            <Text style={[styles.statValue, { color: theme.text }]}>{formatTime(elapsedSeconds)}</Text>
            <Text style={[styles.statLabel, { color: theme.mutedText }]}>Time</Text>
          </View>
          <View style={styles.statBlock}>
            <Text style={[styles.statValue, { color: theme.text }]}>{averagePace}</Text>
            <Text style={[styles.statLabel, { color: theme.mutedText }]}>Split avg. (/km)</Text>
          </View>
          <View style={styles.statBlock}>
            <Text style={[styles.statValue, { color: theme.text }]}>{(totalDistanceMeters / 1000).toFixed(2)}</Text>
            <Text style={[styles.statLabel, { color: theme.mutedText }]}>Distance (km)</Text>
          </View>
        </View>
      </View>

      {/* Bottom controls */}
      <View style={styles.controlsWrapper}>
        <View style={[styles.controlsContainer, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
        <View style={styles.controlsRow}>
          {/* Run button (left) */}
          <View style={styles.smallButtonContainer}>
            <TouchableOpacity style={[styles.smallCircleButton, { backgroundColor: theme.mode === 'dark' ? '#181818' : '#E5E5E5', borderColor: theme.border }]} onPress={handleToggleRoutePlanning} activeOpacity={0.8}>
              <Ionicons name="walk-outline" size={24} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.controlLabel, { color: theme.mutedText }]}>Add Route</Text>
          </View>

          {/* Play/Pause button (center) */}
          <TouchableOpacity style={[styles.bigCircleButton, { backgroundColor: theme.accent }]} onPress={handleStartPause} activeOpacity={0.9}>
            {runStatus === "running" ? (
              <MaterialIcons name="pause" size={32} color="#000000" />
            ) : (
              <MaterialIcons name="play-arrow" size={32} color="#000000" />
            )}
          </TouchableOpacity>

          {/* End button (right) */}
          <View style={styles.smallButtonContainer}>
            <TouchableOpacity style={styles.smallCircleButtonDanger} onPress={handleEndRun} activeOpacity={0.8}>
              <MaterialIcons name="stop" size={22} color="#ffffff" />
            </TouchableOpacity>
            <Text style={[styles.controlLabel, { color: theme.mutedText }]}>End</Text>
          </View>
        </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  // Points pill
  pointsPill: {
    position: "absolute",
    top: 16,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    zIndex: 10,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  pointsIcon: {
    marginRight: 10,
  },
  pointsTextContainer: {
    flexDirection: "column",
  },
  pointsLabel: {
    fontSize: 11,
    fontWeight: "500",
    marginBottom: 2,
  },
  pointsValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  // Stats card
  statsCard: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 130,
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
    borderWidth: 1,
  },
  gpsStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  gpsText: {
    fontSize: 13,
    fontWeight: "500",
    marginLeft: 6,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statBlock: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  // Bottom controls
  controlsWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  controlsContainer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
    borderTopWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  smallButtonContainer: {
    alignItems: "center",
  },
  smallCircleButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  smallCircleButtonActive: {
    borderWidth: 2,
  },
  smallCircleButtonDanger: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#c0392b",
  },
  bigCircleButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#03CA59",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  controlLabel: {
    fontSize: 10,
    marginTop: 4,
    fontWeight: "500",
  },
  masterMapFab: {
    position: "absolute",
    top: 50,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.85)",
    zIndex: 10,
  },
  avatarMarkerOuter: {
    alignItems: "center",
  },
  avatarMarkerInner: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#000000",
    padding: 2,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#03CA59",
  },
  avatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarMarkerArrow: {
    width: 0,
    height: 0,
    marginTop: 2,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#03CA59",
  },
});

export default RunScreen;
