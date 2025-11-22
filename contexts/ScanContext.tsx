import React, { createContext, ReactNode, useContext, useState } from 'react';

interface ScanContextType {
  scanData: any | null;
  setScanData: (data: any) => void;
  clearScanData: () => void;
}

const ScanContext = createContext<ScanContextType | undefined>(undefined);

export function ScanProvider({ children }: { children: ReactNode }) {
  const [scanData, setScanData] = useState<any | null>(null);

  const clearScanData = () => {
    setScanData(null);
  };

  return (
    <ScanContext.Provider value={{ scanData, setScanData, clearScanData }}>
      {children}
    </ScanContext.Provider>
  );
}

export function useScan() {
  const context = useContext(ScanContext);
  if (context === undefined) {
    throw new Error('useScan must be used within a ScanProvider');
  }
  return context;
}

