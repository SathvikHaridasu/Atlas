import { useNavigation } from "@react-navigation/native";
import React, { useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MapView, { Polygon, Region } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SAMPLE_ZONES } from "../lib/sampleZones";

import { useAuth } from "../../contexts/AuthContext";
import { useMapState } from "../contexts/MapStateContext";
import type { LatLng } from "../lib/territoryHelper";

const initialRegion: Region = {
  latitude: 43.468,
  longitude: -80.53,
  latitudeDelta: 0.12,
  longitudeDelta: 0.12,
};

type MapMode = "global" | "mine";

// Removed sampleWaterlooTiles - now using SAMPLE_ZONES from sampleZones.ts

// Function to scale polygon coordinates around their centroid
function scalePolygon(points: LatLng[], factor: number): LatLng[] {
  if (!points.length) return points;

  const centerLat = points.reduce((sum, p) => sum + p.latitude, 0) / points.length;
  const centerLng = points.reduce((sum, p) => sum + p.longitude, 0) / points.length;

  return points.map((p) => ({
    latitude: centerLat + (p.latitude - centerLat) * factor,
    longitude: centerLng + (p.longitude - centerLng) * factor,
  }));
}

const MasterMapScreen: React.FC = () => {
  const navigation = useNavigation();
  const { session } = useAuth();
  const { masterRegion, setMasterRegion } = useMapState();
  const insets = useSafeAreaInsets();

  const [region, setRegion] = useState<Region>(masterRegion ?? initialRegion);
  const [mapMode, setMapMode] = useState<MapMode>("global");

  // Scale LHSS, WCI, and KCI polygons by 25% (1.25 factor)
  const scaledZones = useMemo(() => {
    return SAMPLE_ZONES.map((zone) => {
      if (zone.group === "LHSS" || zone.group === "WCI" || zone.group === "KCI") {
        return {
          ...zone,
          coordinates: scalePolygon(zone.coordinates, 1.25),
        };
      }
      return zone;
    });
  }, []);

  const handleRegionChangeComplete = (reg: Region) => {
    setRegion(reg);
    setMasterRegion(reg);
  };

  return (
    <View style={styles.container}>
      <MapView
        style={StyleSheet.absoluteFill}
        provider="google"
        initialRegion={initialRegion}
        onRegionChangeComplete={handleRegionChangeComplete}
      >
        {scaledZones.filter((zone) => {
          if (mapMode === "global") {
            // global = show LHSS + WCI + KCI but not the personal zones
            return zone.group === "LHSS" || zone.group === "WCI" || zone.group === "KCI";
          }
          // "mine" mode = only ME zones for now
          return zone.group === "ME";
        }).map((zone) => {
          const isLHSS = zone.group === "LHSS";
          const isWCI = zone.group === "WCI";
          const isKCI = zone.group === "KCI";
          const isME = zone.group === "ME";

          let strokeColor = "rgba(255,255,255,1)";
          let fillColor = "rgba(255,255,255,0.16)";

          if (isLHSS) {
            strokeColor = "rgba(0,196,255,1)";
            fillColor = "rgba(0,196,255,0.25)";
          } else if (isWCI) {
            strokeColor = "rgba(255,122,0,1)";
            fillColor = "rgba(255,122,0,0.25)";
          } else if (isKCI) {
            strokeColor = "rgba(191,90,242,1)"; // purple for KCI
            fillColor = "rgba(191,90,242,0.25)";
          } else if (isME) {
            strokeColor = "rgba(3,202,89,1)"; // bright green for "my territory"
            fillColor = "rgba(3,202,89,0.25)";
          }

          return (
            <Polygon
              key={zone.id}
              coordinates={zone.coordinates}
              strokeWidth={3}
              strokeColor={strokeColor}
              fillColor={fillColor}
            />
          );
        })}
      </MapView>

      {/* Mode toggle */}
      <View style={[styles.modeToggleContainer, { top: insets.top + 8 }]}>
        <TouchableOpacity
          style={[
            styles.modeToggleButton,
            mapMode === "global" && styles.modeToggleButtonActive,
          ]}
          onPress={() => setMapMode("global")}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.modeToggleText,
              mapMode === "global" && styles.modeToggleTextActive,
            ]}
          >
            Global
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.modeToggleButton,
            mapMode === "mine" && styles.modeToggleButtonActive,
          ]}
          onPress={() => setMapMode("mine")}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.modeToggleText,
              mapMode === "mine" && styles.modeToggleTextActive,
            ]}
          >
            My territory
          </Text>
        </TouchableOpacity>
      </View>

      {/* Legend */}
      <View style={[styles.legendContainer, { top: insets.top + 8 + 48 }]}>
        <View style={styles.legendRow}>
          <View style={[styles.legendSwatch, { backgroundColor: "#00C4FF" }]} />
          <Text style={styles.legendText}>LHSS</Text>
        </View>

        <View style={styles.legendRow}>
          <View style={[styles.legendSwatch, { backgroundColor: "#FF7A00" }]} />
          <Text style={styles.legendText}>WCI</Text>
        </View>

        <View style={styles.legendRow}>
          <View style={[styles.legendSwatch, { backgroundColor: "#BF5AF2" }]} />
          <Text style={styles.legendText}>KCI</Text>
        </View>

        <View style={styles.legendRow}>
          <View style={[styles.legendSwatch, { backgroundColor: "#03CA59" }]} />
          <Text style={styles.legendText}>Your territory</Text>
        </View>
      </View>

      {/* Close button */}
      <TouchableOpacity
        style={[styles.closeButton, { top: insets.top + 8 }]}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.closeText}>Close</Text>
      </TouchableOpacity>
    </View>
  );
};

export default MasterMapScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  closeButton: {
    position: "absolute",
    right: 20,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  closeText: {
    color: "#fff",
    fontSize: 13,
  },
  modeToggleContainer: {
    position: "absolute",
    alignSelf: "center",
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 999,
    padding: 4,
  },
  modeToggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  modeToggleButtonActive: {
    backgroundColor: "rgba(3,202,89,0.9)",
  },
  modeToggleText: {
    color: "#cccccc",
    fontSize: 12,
  },
  modeToggleTextActive: {
    color: "#000000",
    fontWeight: "600",
  },
  legendContainer: {
    position: "absolute",
    left: 20,
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: 10,
    borderRadius: 12,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  legendSwatch: {
    width: 14,
    height: 14,
    borderRadius: 3,
    marginRight: 8,
  },
  legendText: {
    color: "#fff",
    fontSize: 12,
  },
});

