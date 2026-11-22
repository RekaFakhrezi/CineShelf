import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { THEME } from "../../constants/theme";
import { Icon } from "../common/Icon";
import { ScalePressable } from "../common/ScalePressable";
export function CineRouletteCard({ onSelectMood, onOpenRoulette }) {
  const moods = [{ id: "santai", label: "Santai", icon: "cafe-outline" }, { id: "mikir", label: "Bikin mikir", icon: "bulb-outline" },
    { id: "adrenalin", label: "Menegangkan", icon: "flash-outline" }, { id: "drama", label: "Emosional", icon: "heart-outline" }, { id: "singkat", label: "Di bawah 100 menit", icon: "time-outline" }];
  return <View style={s.section}>
    <LinearGradient pointerEvents="none" colors={[THEME.surfaceHighlight, THEME.bgSecondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
    <View style={s.header}><View style={{ flex: 1, gap: 6 }}><Text style={s.title}>Lagi ingin nonton apa?</Text>
      <Text style={s.description}>Mulai dari suasana hatimu.</Text></View>
      <ScalePressable onPress={onOpenRoulette} accessibilityLabel="Acak tontonan dengan CineRoulette" style={s.shuffle}>
        <Icon name="shuffle-outline" size={20} color={THEME.textPrimary} /><Text style={s.shuffleText}>Acak</Text>
      </ScalePressable></View>
    <View style={s.moods}>{moods.map(m => <ScalePressable key={m.id} onPress={() => onSelectMood(m.id)} style={s.mood}>
      <Icon name={m.icon} size={18} color={THEME.textSecondary} /><Text style={s.moodText}>{m.label}</Text>
    </ScalePressable>)}</View>
  </View>;
}
const s = StyleSheet.create({
  section: { marginHorizontal: 20, marginTop: 32, padding: 20, borderWidth: 1, borderColor: THEME.raisedBorder, borderRadius: 16, overflow: "hidden", gap: 20 },
  header: { flexDirection: "row", gap: 12, alignItems: "center" },
  title: { color: THEME.textPrimary, fontSize: 20, fontWeight: "700", letterSpacing: -0.4 },
  description: { color: THEME.textSecondary, fontSize: 14 },
  shuffle: { minHeight: 48, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12 },
  shuffleText: { color: THEME.textPrimary, fontSize: 14, fontWeight: "600" },
  moods: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  mood: { minHeight: 48, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(13,23,36,0.55)", borderWidth: 1, borderColor: THEME.raisedBorder, borderRadius: 8 },
  moodText: { color: THEME.textPrimary, fontSize: 13 },
});
