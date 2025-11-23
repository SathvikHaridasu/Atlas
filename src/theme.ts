export const lightTheme = {
  mode: "light" as const,
  background: "#FFFFFF",
  card: "#F4F4F4",
  text: "#111111",
  mutedText: "#666666",
  accent: "#03CA59",
  border: "#DDDDDD",
};

export const darkTheme = {
  mode: "dark" as const,
  background: "#020202",
  card: "#101010",
  text: "#F9FAFB",
  mutedText: "#9CA3AF",
  accent: "#03CA59",
  border: "#181818",
};

export type AppTheme = typeof lightTheme;

