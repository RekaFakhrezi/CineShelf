import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { THEME } from "../../constants/theme";
import { Icon } from "../common/Icon";
import { ScalePressable } from "../common/ScalePressable";
import { Poster } from "./Poster";

// Horizontal Shelf
export function Shelf({ title, subtitle, items, onOpen, saved, onAll, onToggleSave }) {
  return (
    <View style={s.shelfContainer}>
      <View style={s.shelfHeader}>
        <View style={{ flex: 1 }}>
          <Text style={s.shelfTitle}>{title}</Text>
          {subtitle && <Text style={s.shelfSubtitle}>{subtitle}</Text>}
        </View>
        {onAll && (
          <ScalePressable onPress={onAll} style={s.seeAllBtn}>
            <Text style={s.seeAllText}>Lihat semua</Text>
            <Icon name="chevron-forward" size={14} color={THEME.textSecondary} />
          </ScalePressable>
        )}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.shelfScroll}
      >
        {items.map((item) => (
          <Poster
            key={item.id}
            item={item}
            onOpen={onOpen}
            saved={saved.includes(item.id)}
            onToggleSave={onToggleSave}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  shelfContainer: {
    marginTop: 32,
  },
  shelfHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  shelfTitle: {
    color: "white",
    fontSize: 21,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  shelfSubtitle: {
    color: THEME.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  seeAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minHeight: 48,
    justifyContent: "center",
    paddingVertical: 8,
  },
  seeAllText: {
    color: THEME.textSecondary,
    fontSize: 12,
    fontWeight: "700",
  },
  shelfScroll: {
    paddingHorizontal: 20,
    gap: 16,
  },
});

