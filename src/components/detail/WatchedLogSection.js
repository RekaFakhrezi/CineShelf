import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { THEME } from "../../constants/theme";
import { Icon } from "../common/Icon";
import { ScalePressable } from "../common/ScalePressable";
import { DotPatternBackground, TechKicker, HalftoneCornerDeco } from "../common/DitherAccent";

export function WatchedLogSection({
  isWatched,
  onToggleWatched,
  rating,
  onRate,
  reaction,
  onReact,
}) {
  const reactions = [
    { emoji: "🔥", label: "Masterpiece" },
    { emoji: "🤯", label: "Mindblown" },
    { emoji: "😭", label: "Mewek" },
    { emoji: "👏", label: "Puas" },
    { emoji: "😴", label: "Biasa" },
  ];

  return (
    <View style={s.container}>
      
      

      {/* Header */}
      <View style={s.headerRow}>
        <View style={{ gap: 2 }}>
          
          <Text style={s.title}>Jurnal & Status Menonton</Text>
        </View>

        {/* Toggle Watched Status */}
        <ScalePressable
          onPress={onToggleWatched}
          style={[s.watchedToggleBtn, isWatched && s.watchedToggleBtnActive]}
          accessibilityLabel={isWatched ? "Sudah Ditonton" : "Tandai Sudah Ditonton"}
        >
          <Icon
            name={isWatched ? "checkmark-circle" : "ellipse-outline"}
            size={16}
            color={isWatched ? "white" : THEME.textSecondary}
          />
          <Text
            style={[
              s.watchedToggleText,
              isWatched && s.watchedToggleTextActive,
            ]}
          >
            {isWatched ? "Sudah Ditonton" : "Belum Nonton"}
          </Text>
        </ScalePressable>
      </View>

      {/* When Marked As Watched, show Rating & Reaction */}
      {isWatched && (
        <View style={s.diaryBox}>
          {/* Star Rating Picker */}
          <View style={s.ratingRow}>
            <Text style={s.diaryLabel}>Rating Pribadimu:</Text>
            <View style={s.starsGroup}>
              {[1, 2, 3, 4, 5].map((star) => {
                const filled = (rating || 0) >= star;
                return (
                  <ScalePressable
                    key={star}
                    onPress={() => onRate(star)}
                    style={s.starBtn}
                    accessibilityLabel={`Beri rating ${star} bintang`}
                  >
                    <Icon
                      name={filled ? "star" : "star-outline"}
                      size={24}
                      color={filled ? THEME.star : THEME.textMuted}
                    />
                  </ScalePressable>
                );
              })}
            </View>
          </View>

          {/* Quick Reaction Emojis */}
          <View style={s.reactionRow}>
            <Text style={s.diaryLabel}>Kesan / Reaksi Cepat:</Text>
            <View style={s.emojiRow}>
              {reactions.map((r) => {
                const isSelected = reaction === r.emoji;
                return (
                  <ScalePressable
                    key={r.emoji}
                    onPress={() => onReact(isSelected ? null : r.emoji)}
                    style={[
                      s.emojiChip,
                      isSelected && s.emojiChipSelected,
                    ]}
                  >
                    <Text style={s.emojiChar}>{r.emoji}</Text>
                    <Text
                      style={[
                        s.emojiText,
                        isSelected && s.emojiTextSelected,
                      ]}
                    >
                      {r.label}
                    </Text>
                  </ScalePressable>
                );
              })}
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    backgroundColor: "#131626",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: THEME.pixelBorder,
    padding: 18,
    gap: 14,
    overflow: "hidden",
    position: "relative",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    color: "white",
    fontSize: 16,
    fontWeight: "800",
  },
  watchedToggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  watchedToggleBtnActive: {
    backgroundColor: THEME.accentDark,
    borderColor: THEME.accent,
  },
  watchedToggleText: {
    color: THEME.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  watchedToggleTextActive: {
    color: "white",
    fontWeight: "700",
  },
  diaryBox: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
    gap: 12,
  },
  ratingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  diaryLabel: {
    color: THEME.textSecondary,
    fontSize: 12,
    fontWeight: "700",
  },
  starsGroup: {
    flexDirection: "row",
    gap: 4,
  },
  starBtn: {
    padding: 2,
  },
  reactionRow: {
    gap: 8,
  },
  emojiRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  emojiChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  emojiChipSelected: {
    backgroundColor: THEME.accentDark,
    borderColor: THEME.accent,
  },
  emojiChar: {
    fontSize: 15,
  },
  emojiText: {
    color: THEME.textMuted,
    fontSize: 11,
    fontWeight: "600",
  },
  emojiTextSelected: {
    color: "white",
    fontWeight: "700",
  },
});

