import React, { createContext, ReactNode, useContext, useState } from "react";
import { AppTheme, darkTheme, lightTheme } from "../theme";

interface ThemeContextValue {
  theme: AppTheme;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [isDark, setIsDark] = useState(true);

  const toggleTheme = () => setIsDark((prev) => !prev);

  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useAppTheme must be used inside ThemeProvider");
  return ctx;
};

