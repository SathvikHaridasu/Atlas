import React, { createContext, ReactNode, useContext, useState } from "react";

export interface RunStats {
  points: number;
  totalDistanceMeters: number;
  elapsedSeconds: number;
}

interface RunStatsContextValue extends RunStats {
  updateStats: (partial: Partial<RunStats>) => void;
}

const RunStatsContext = createContext<RunStatsContextValue | undefined>(
  undefined
);

const initialStats: RunStats = {
  points: 0,
  totalDistanceMeters: 0,
  elapsedSeconds: 0,
};

export const RunStatsProvider = ({ children }: { children: ReactNode }) => {
  const [stats, setStats] = useState<RunStats>(initialStats);

  const updateStats = (partial: Partial<RunStats>) => {
    setStats((prev) => ({ ...prev, ...partial }));
  };

  return (
    <RunStatsContext.Provider value={{ ...stats, updateStats }}>
      {children}
    </RunStatsContext.Provider>
  );
};

export const useRunStats = (): RunStatsContextValue => {
  const ctx = useContext(RunStatsContext);
  if (!ctx) {
    throw new Error("useRunStats must be used within RunStatsProvider");
  }
  return ctx;
};

