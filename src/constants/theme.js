import { Platform } from "react-native";

// CineShelf: midnight-blue surfaces, ticket-red actions, clear neutral text.
export const THEME = {
  bg: "#0D1724",
  bgSecondary: "#152232",
  bgElevated: "#1C2C3F",
  bgCard: "#192A3C",
  surfaceHighlight: "#263A50",
  raisedBorder: "rgba(199, 219, 241, 0.18)",
  raisedShadow: { shadowColor: "#000", shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 3 },
  cardBorder: "rgba(255, 255, 255, 0.08)",
  cardBorderHover: "rgba(255, 59, 78, 0.4)",
  islandBg: "rgba(16, 18, 28, 0.92)",
  islandBorder: "rgba(255, 255, 255, 0.12)",
  accent: "#B83D4A",
  accentGlow: "rgba(184, 61, 74, 0.12)",
  accentDark: "#322332",
  accentSoft: "#F28B94",
  textPrimary: "#FFFFFF",
  textSecondary: "#BAC5D2",
  textMuted: "#9BAABD",
  star: "#E7BD72",
  green: "#4ADE80",
  glass: "rgba(255, 255, 255, 0.06)",
  glassBorder: "rgba(255, 255, 255, 0.1)",
  // Grunge / dither / pixel design system tokens (matching omp.sh & manga halftone)
  ditherDot: "rgba(255, 255, 255, 0.08)",
  ditherAccent: "rgba(184, 61, 74, 0.22)",
  pixelBorder: "rgba(255, 255, 255, 0.14)",
  fontMono: Platform.select({
    ios: "Courier",
    android: "monospace",
    default: "monospace",
  }),
};

export const STORAGE_KEYS = {
  WATCHLIST: "cineshelf.watchlist.v1",
  CONNECTION: "cineshelf.connection.v1",
  SHELVES: "cineshelf.shelves.v1",
  WATCHED: "cineshelf.watched.v1",
  RATINGS: "cineshelf.ratings.v1",
};

