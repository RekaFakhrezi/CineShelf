import Constants from "expo-constants";
import { Platform } from "react-native";
export function defaultApiUrl() {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  // Metro LAN host cocok untuk backend yang dijalankan di laptop yang sama.
  const metroHost = Constants.expoConfig?.hostUri?.split(":")[0];
  const host =
    metroHost && /^(\d{1,3}\.){3}\d{1,3}$/.test(metroHost)
      ? metroHost
      : "127.0.0.1";
  return `http://${Platform.OS === "web" && typeof window !== "undefined" && window.location.hostname === "localhost" ? "localhost" : host}:5002/api`;
}
