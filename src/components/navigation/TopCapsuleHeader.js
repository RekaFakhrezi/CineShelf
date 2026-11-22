import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { THEME } from "../../constants/theme";
import { Icon } from "../common/Icon";
import { ScalePressable } from "../common/ScalePressable";

export function TopCapsuleHeader({ tab, navigate, savedCount, width, topInset, onOpenSearch }) {
  const compact = width < 768;
  return <View style={[s.header, { paddingTop: Math.max(topInset, 8) }]}>
    <View style={s.inner}>
      <ScalePressable onPress={() => navigate("home")} accessibilityLabel="Beranda CineShelf" style={s.brand}>
        <View style={s.logo}><Icon name="film-outline" size={22} color="white" /></View>
        <Text style={s.wordmark}>CineShelf</Text>
      </ScalePressable>

      <ScalePressable onPress={onOpenSearch} accessibilityLabel="Cari film atau serial" style={s.search}>
        <Icon name="search-outline" size={22} color={THEME.textPrimary} />
        {!compact && <Text style={s.navText}>Cari judul</Text>}
      </ScalePressable>
    </View>
  </View>;
}
const s = StyleSheet.create({
  header: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 100, backgroundColor: THEME.bg, borderBottomWidth: 1, borderBottomColor: THEME.cardBorder },
  inner: { width: "100%", maxWidth: 1040, alignSelf: "center", minHeight: 60, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  brand: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 48 },
  logo: { width: 32, height: 32, borderRadius: 8, backgroundColor: THEME.accent, alignItems: "center", justifyContent: "center" },
  wordmark: { color: THEME.textPrimary, fontSize: 21, fontWeight: "800", letterSpacing: -0.8 },
  nav: { flexDirection: "row", gap: 8 },
  navItem: { minHeight: 48, paddingHorizontal: 10, justifyContent: "center", borderBottomWidth: 2, borderBottomColor: "transparent" },
  selected: { borderBottomColor: THEME.accentSoft },
  navText: { fontSize: 13, color: THEME.textSecondary, fontWeight: "500" },
  search: { minHeight: 48, minWidth: 48, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
});
