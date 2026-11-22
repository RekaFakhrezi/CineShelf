import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { shelfIconName } from "../../constants/shelfIcons";
import { THEME } from "../../constants/theme";
import { Icon } from "../common/Icon";
import { ScalePressable } from "../common/ScalePressable";

export function ShelfSelector({
  shelves = [],
  activeShelfId = "all",
  onSelectShelf,
  onOpenCreateShelf,
  shelfCounts = {},
  onDeleteShelf,
}) {
  return (
    <View style={s.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
      >
        {shelves.map((shelf) => {
          const active = activeShelfId === shelf.id;
          const count = shelfCounts[shelf.id] ?? 0;
          return (
            <ScalePressable
              key={shelf.id}
              onPress={() => onSelectShelf(shelf.id)}
              style={[s.shelfPill, active && s.shelfPillActive]}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
            >
              <Icon name={shelfIconName(shelf.icon)} size={18} color={active ? THEME.accentSoft : THEME.textSecondary} />
              <Text style={[s.shelfName, active && s.shelfNameActive]}>
                {shelf.name}
              </Text>
              <View style={[s.countBadge, active && s.countBadgeActive]}>
                <Text style={[s.countText, active && s.countTextActive]}>
                  {count}
                </Text>
              </View>

              {!shelf.isDefault && active && (
                <ScalePressable
                  onPress={() => onDeleteShelf(shelf.id)}
                  style={s.deleteShelfBtn}
                  accessibilityLabel="Hapus rak"
                >
                  <Icon name="close" size={12} color={THEME.textMuted} />
                </ScalePressable>
              )}
            </ScalePressable>
          );
        })}

        {/* Create New Shelf Pill */}
        {onOpenCreateShelf && (
          <ScalePressable
            onPress={onOpenCreateShelf}
            style={s.addShelfPill}
            accessibilityLabel="Buat rak baru"
          >
            <Icon name="add" size={14} color={THEME.accentSoft} />
            <Text style={s.addShelfPillText}>Rak Baru</Text>
          </ScalePressable>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  wrapper: {
    paddingTop: 2,
    paddingBottom: 8,
  },
  scrollContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingRight: 10,
  },
  shelfPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    minHeight: 48,
    paddingVertical: 10,
    paddingHorizontal: 13,
    borderRadius: 8,
    backgroundColor: THEME.bgElevated,
    borderWidth: 1,
    borderColor: THEME.cardBorder,
  },
  shelfPillActive: {
    backgroundColor: THEME.accentDark,
    borderColor: THEME.accent,
  },
  shelfIcon: {
    fontSize: 13,
  },
  shelfName: {
    color: THEME.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  shelfNameActive: {
    color: "white",
    fontWeight: "700",
  },
  countBadge: {
    paddingVertical: 1,
    paddingHorizontal: 6,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  countBadgeActive: {
    backgroundColor: THEME.accent,
  },
  countText: {
    color: THEME.textMuted,
    fontSize: 10,
    fontWeight: "700",
  },
  countTextActive: {
    color: "white",
  },
  deleteShelfBtn: {
    marginLeft: 2,
    padding: 2,
  },
  addShelfPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "rgba(184, 61, 74, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(184, 61, 74, 0.28)",
  },
  addShelfPillText: {
    color: THEME.accentSoft,
    fontSize: 12,
    fontWeight: "700",
  },
});
