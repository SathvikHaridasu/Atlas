import type { LatLng } from "./territoryHelper";

export type GroupId = "LHSS" | "WCI" | "KCI" | "ME";

export interface GroupZone {
  id: string;
  group: GroupId;
  name: string;
  coordinates: LatLng[]; // polygon vertices in order
}

/**
 * NOTE:
 * These coordinates are just rough placeholders around Waterloo.
 * Later, replace them with real road-intersection coords from Google Maps.
 */
export const SAMPLE_ZONES: GroupZone[] = [
  {
    id: "lhss-north-1",
    group: "LHSS",
    name: "North Waterloo Zone",
    coordinates: [
      // Rough polygon roughly north-west of city centre
      { latitude: 43.483, longitude: -80.560 }, // top-left
      { latitude: 43.485, longitude: -80.540 }, // top-right
      { latitude: 43.476, longitude: -80.532 }, // mid-right
      { latitude: 43.470, longitude: -80.538 }, // lower-right
      { latitude: 43.468, longitude: -80.552 }, // lower-left
      { latitude: 43.474, longitude: -80.562 }, // mid-left
    ],
  },
  {
    id: "lhss-uw-park",
    group: "LHSS",
    name: "University / Park Zone",
    coordinates: [
      { latitude: 43.475, longitude: -80.545 },
      { latitude: 43.478, longitude: -80.535 },
      { latitude: 43.472, longitude: -80.528 },
      { latitude: 43.468, longitude: -80.530 },
      { latitude: 43.466, longitude: -80.540 },
    ],
  },
  {
    id: "wci-central-1",
    group: "WCI",
    name: "Central Waterloo Zone",
    coordinates: [
      { latitude: 43.470, longitude: -80.535 }, // top-left
      { latitude: 43.470, longitude: -80.520 }, // top-right
      { latitude: 43.462, longitude: -80.515 }, // mid-right
      { latitude: 43.456, longitude: -80.522 }, // lower-right
      { latitude: 43.456, longitude: -80.535 }, // lower-left
      { latitude: 43.462, longitude: -80.542 }, // mid-left
    ],
  },
  {
    id: "wci-south-1",
    group: "WCI",
    name: "South Waterloo Zone",
    coordinates: [
      { latitude: 43.459, longitude: -80.540 },
      { latitude: 43.459, longitude: -80.525 },
      { latitude: 43.452, longitude: -80.520 },
      { latitude: 43.445, longitude: -80.525 },
      { latitude: 43.445, longitude: -80.540 },
    ],
  },
  {
    id: "kci-east-1",
    group: "KCI",
    name: "East Kitchener Zone",
    coordinates: [
      { latitude: 43.4575, longitude: -80.5165 },
      { latitude: 43.4620, longitude: -80.5105 },
      { latitude: 43.4660, longitude: -80.5120 },
      { latitude: 43.4680, longitude: -80.5185 },
      { latitude: 43.4650, longitude: -80.5240 },
      { latitude: 43.4595, longitude: -80.5235 },
    ],
  },
  {
    id: "kci-southeast-1",
    group: "KCI",
    name: "Southeast Kitchener Zone",
    coordinates: [
      { latitude: 43.453, longitude: -80.515 },
      { latitude: 43.456, longitude: -80.508 },
      { latitude: 43.450, longitude: -80.505 },
      { latitude: 43.447, longitude: -80.512 },
      { latitude: 43.449, longitude: -80.518 },
    ],
  },
  {
    id: "me-home-zone",
    group: "ME",
    name: "My Home Loop",
    coordinates: [
      { latitude: 43.467, longitude: -80.535 },
      { latitude: 43.469, longitude: -80.528 },
      { latitude: 43.463, longitude: -80.525 },
      { latitude: 43.460, longitude: -80.532 },
    ],
  },
  {
    id: "me-school-zone",
    group: "ME",
    name: "My School Loop",
    coordinates: [
      { latitude: 43.472, longitude: -80.545 },
      { latitude: 43.474, longitude: -80.538 },
      { latitude: 43.469, longitude: -80.534 },
      { latitude: 43.466, longitude: -80.540 },
    ],
  },
];

