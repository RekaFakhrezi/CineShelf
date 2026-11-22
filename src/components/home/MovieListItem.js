import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { THEME } from "../../constants/theme";
import { Icon } from "../common/Icon";
import { Artwork } from "../common/Artwork";
import { BookmarkButton } from "../common/BookmarkButton";
import { ScalePressable } from "../common/ScalePressable";

// Sleek horizontal list row card with flush left artwork, horizontal fade gradient, and corner save button
export function MovieListItem({ item, onOpen, saved, onToggleSave }) {
  if (!item) return null;

  return (
    <ScalePressable
      onPress={() => onOpen(item)}
      accessibilityLabel={`Detail ${item.title}`}
      style={s.rowCard}
    >
      {/* 1. Full Flush Artwork on the Left with Horizontal Fade Gradient to Right */}
      <View style={s.artworkFadeContainer} pointerEvents="none">
        <Artwork item={item} style={s.artworkBackground}>
          {/* Horizontal fade: clear on left -> gradually dissolving into card background #11131E */}
          <LinearGradient
            colors={[
              "rgba(17, 19, 30, 0.05)",
              "rgba(17, 19, 30, 0.35)",
              "rgba(17, 19, 30, 0.8)",
              "#11131E",
            ]}
            locations={[0, 0.35, 0.72, 1]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
          {/* Subtle vertical vignette for depth */}
          <LinearGradient
            colors={["rgba(13, 23, 36, 0.35)", "transparent", "rgba(13, 23, 36, 0.5)"]}
            style={StyleSheet.absoluteFill}
          />
        </Artwork>
      </View>

      {/* 2. Top-Left Mini Type Badge (FILM / SERIAL) */}
      <View style={s.typeBadge} pointerEvents="none">
        <Text style={s.typeBadgeText}>
          {(item.type || "film").toUpperCase()}
        </Text>
      </View>

      {/* 3. Top-Right Corner Save / Bookmark Button */}
      {onToggleSave && (
        <View style={s.topRightBookmark}>
          <BookmarkButton
            active={saved}
            onPress={() => onToggleSave(item)}
          />
        </View>
      )}

      {/* 4. Movie Info Content (Positioned cleanly on dark gradient) */}
      <View style={s.infoColumn}>
        {/* Title */}
        <Text numberOfLines={1} style={s.itemTitle}>
          {item.title}
        </Text>

        {/* Metadata: Genre badge + Year · Age · Duration */}
        <View style={s.metaRow}>
          <View style={s.genrePill}>
            <Text style={s.genrePillText}>
              {(item.genre || "FILM").toUpperCase()}
            </Text>
          </View>
          <Text style={s.metaText}>
            {item.year}  ·  {item.age}  ·  {item.duration}
          </Text>
        </View>

        {/* Tagline / Synopsis preview */}
        <Text numberOfLines={1} style={s.taglineText}>
          "{item.tagline || item.synopsis}"
        </Text>

        {/* Star Rating Score */}
        <View style={s.ratingRow}>
          <Icon name="star" size={13} color={THEME.star} />
          <Text style={s.ratingScore}>
            {item.rating}
            <Text style={s.ratingMax}>/10</Text>
          </Text>
        </View>
      </View>
    </ScalePressable>
  );
}

const s = StyleSheet.create({
  rowCard: {
    backgroundColor: "#11131E",
    borderWidth: 1,
    borderColor: THEME.pixelBorder,
    borderRadius: 18,
    marginBottom: 10,
    position: "relative",
    overflow: "hidden",
    minHeight: 104,
    justifyContent: "center",
  },
  artworkFadeContainer: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 145,
    overflow: "hidden",
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
  },
  artworkBackground: {
    width: "100%",
    height: "100%",
  },
  typeBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    zIndex: 2,
  },
  typeBadgeText: {
    color: "white",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  topRightBookmark: {
    position: "absolute",
    top: 10,
    right: 12,
    zIndex: 3,
  },
  infoColumn: {
    paddingLeft: 96,
    paddingRight: 46,
    paddingVertical: 12,
    gap: 4,
    justifyContent: "center",
  },
  itemTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  genrePill: {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  genrePillText: {
    color: THEME.textSecondary,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  metaText: {
    color: THEME.textMuted,
    fontSize: 11,
    fontWeight: "600",
  },
  taglineText: {
    color: THEME.textSecondary,
    fontSize: 11,
    fontStyle: "italic",
    lineHeight: 15,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  ratingScore: {
    color: "white",
    fontSize: 12.5,
    fontWeight: "800",
  },
  ratingMax: {
    color: THEME.textMuted,
    fontSize: 10,
    fontWeight: "500",
  },
});
