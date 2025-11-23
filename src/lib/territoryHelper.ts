import { supabase } from "../../lib/supabaseClient";

export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface TerritoryTile {
  id: number;
  tile_x: number;
  tile_y: number;
  owner_user_id: string;
  scope_type: string;
  scope_id: string | null;
  capture_score: number;
}

export const GRID_SIZE_DEGREES = 0.005; 
// ~500–600m tiles depending on latitude; larger zones for better visualization

/**
 * Converts GPS coordinates to tile grid indices
 */
export const coordToTile = (lat: number, lng: number): { tile_x: number; tile_y: number } => {
  const tile_x = Math.floor(lng / GRID_SIZE_DEGREES);
  const tile_y = Math.floor(lat / GRID_SIZE_DEGREES);
  return { tile_x, tile_y };
};

/**
 * Converts tile indices back to lat/lng bounding box
 * Used for drawing polygons on maps
 */
export const tileToBounds = (tile_x: number, tile_y: number) => {
  const west = tile_x * GRID_SIZE_DEGREES;
  const south = tile_y * GRID_SIZE_DEGREES;
  const east = west + GRID_SIZE_DEGREES;
  const north = south + GRID_SIZE_DEGREES;
  return { west, south, east, north };
};

/**
 * Captures territory tiles for a completed run
 * Converts the run path into unique tiles and saves them to Supabase
 */
export const captureTerritoryForRun = async (
  userId: string,
  pathCoords: LatLng[],
  estimatedDistanceMeters: number
): Promise<void> => {
  try {
    if (!userId || pathCoords.length < 2 || estimatedDistanceMeters <= 0) return;

    // Map of "tile_x:tile_y" -> tile object to dedupe tiles
    const tileMap = new Map<string, { tile_x: number; tile_y: number }>();

    for (const coord of pathCoords) {
      const { latitude, longitude } = coord;
      const { tile_x, tile_y } = coordToTile(latitude, longitude);
      const key = `${tile_x}:${tile_y}`;
      if (!tileMap.has(key)) {
        tileMap.set(key, { tile_x, tile_y });
      }
    }

    const tiles = Array.from(tileMap.values());
    if (tiles.length === 0) return;

    // Simple: same score for every visited tile in this run
    const scorePerTile = estimatedDistanceMeters / tiles.length;

    const rows = tiles.map((t) => ({
      tile_x: t.tile_x,
      tile_y: t.tile_y,
      owner_user_id: userId,
      scope_type: "global",
      scope_id: null as string | null,
      capture_score: scorePerTile,
    }));

    const { error } = await supabase
      .from("territories")
      .upsert(rows, {
        onConflict: "tile_x, tile_y, scope_type, scope_id",
      });

    if (error) {
      console.warn("Error capturing territory:", error);
    }
  } catch (err) {
    console.warn("Unexpected error capturing territory:", err);
  }
};

/**
 * Fetches territory tiles for a given map region
 * Used to draw territory overlays on the map
 */
export const fetchTerritoriesForRegion = async (params: {
  north: number;
  south: number;
  east: number;
  west: number;
}): Promise<TerritoryTile[]> => {
  const { north, south, east, west } = params;

  // Convert region bounds to tile coordinate ranges
  const minTile = coordToTile(south, west);
  const maxTile = coordToTile(north, east);

  const minTileX = Math.min(minTile.tile_x, maxTile.tile_x);
  const maxTileX = Math.max(minTile.tile_x, maxTile.tile_x);
  const minTileY = Math.min(minTile.tile_y, maxTile.tile_y);
  const maxTileY = Math.max(minTile.tile_y, maxTile.tile_y);

  const { data, error } = await supabase
    .from("territories")
    .select("*")
    .eq("scope_type", "global")
    .is("scope_id", null)
    .gte("tile_x", minTileX)
    .lte("tile_x", maxTileX)
    .gte("tile_y", minTileY)
    .lte("tile_y", maxTileY);

  if (error) {
    console.warn("Error fetching territories:", error);
    return [];
  }

  return (data ?? []) as TerritoryTile[];
};

