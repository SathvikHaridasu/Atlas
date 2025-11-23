import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
} from "react";
import type { Region } from "react-native-maps";

interface MapStateContextValue {
  masterRegion: Region | null;
  setMasterRegion: (region: Region) => void;
}

const MapStateContext = createContext<MapStateContextValue | undefined>(
  undefined
);

export const MapStateProvider = ({ children }: { children: ReactNode }) => {
  const [masterRegion, setMasterRegion] = useState<Region | null>(null);

  return (
    <MapStateContext.Provider value={{ masterRegion, setMasterRegion }}>
      {children}
    </MapStateContext.Provider>
  );
};

export const useMapState = (): MapStateContextValue => {
  const ctx = useContext(MapStateContext);
  if (!ctx) {
    throw new Error("useMapState must be used within MapStateProvider");
  }
  return ctx;
};

