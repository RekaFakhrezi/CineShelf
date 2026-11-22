import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { THEME } from "../../constants/theme";
import { tabs } from "../../constants/tabs";
import { Icon } from "../common/Icon";
import { ScalePressable } from "../common/ScalePressable";

export function FloatingBottomCapsule({ tab, navigate, savedCount, bottomInset }) {
  return <View style={[s.bar, { paddingBottom: Math.max(bottomInset, 8) }]}><View style={s.tabs}>
    {tabs.map(t => { const active = tab === t.id;
      return <ScalePressable key={t.id} onPress={() => navigate(t.id)} accessibilityRole="tab"
        accessibilityLabel={t.label + (t.id === "watchlist" ? ', ' + savedCount + ' tersimpan' : '')}
        accessibilityState={{ selected: active }} containerStyle={{ flex: 1 }} style={s.tab}>
        <Icon name={active ? t.icon : t.icon + "-outline"} size={22} color={active ? THEME.accentSoft : THEME.textMuted} />
        <Text style={[s.label, active && { color: THEME.textPrimary }]}>{t.label}</Text>
        {active && <View style={s.mark} />}
      </ScalePressable>;
    })}
  </View></View>;
}
const s = StyleSheet.create({
  bar: { position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 100, backgroundColor: THEME.bgSecondary, borderTopWidth: 1, borderTopColor: THEME.cardBorder, paddingTop: 8, shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.18, shadowRadius: 12, elevation: 8 },
  tabs: { flexDirection: "row", width: "100%", maxWidth: 1040, alignSelf: "center" },
  tab: { minHeight: 54, alignItems: "center", justifyContent: "center", gap: 5 },
  label: { fontSize: 11, fontWeight: "600", color: THEME.textMuted },
  mark: { position: "absolute", top: -8, height: 2, width: 24, backgroundColor: THEME.accentSoft },
});
