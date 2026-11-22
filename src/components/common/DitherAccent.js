import React from "react";
import { View, Text, Image, Platform, StyleSheet } from "react-native";
import { THEME } from "../../constants/theme";

/**
 * DotPatternBackground:
 * Renders a repeating micro-dot halftone/dither matrix pattern (inspired by omp.sh and manga screentone).
 * On Web: CSS radial-gradient dots.
 * On Native: Repeating 88-byte PNG asset with tintColor.
 */
export function DotPatternBackground({
  accent = false,
  opacity = 0.6,
  style,
  pointerEvents = "none",
}) {
  const dotColor = accent ? THEME.ditherAccent : THEME.ditherDot;

  if (Platform.OS === "web") {
    return (
      <View
        pointerEvents={pointerEvents}
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundImage: `radial-gradient(circle, ${dotColor} 1.2px, transparent 1.2px)`,
            backgroundSize: accent ? "10px 10px" : "8px 8px",
            opacity,
          },
          style,
        ]}
      />
    );
  }

  return (
    <View
      pointerEvents={pointerEvents}
      style={[StyleSheet.absoluteFill, { overflow: "hidden", opacity }, style]}
    >
      <Image
        source={require("../../../assets/dither-pattern.png")}
        style={[
          StyleSheet.absoluteFill,
          {
            width: "100%",
            height: "100%",
            tintColor: accent ? THEME.accent : "#FFFFFF",
          },
        ]}
        resizeMode="repeat"
      />
    </View>
  );
}

/**
 * TechKicker:
 * Monospace retro-cyber / developer kicker badge (e.g. [ 01 // CINESHELF_SELECT ]).
 */
export function TechKicker({
  label,
  accent = false,
  dot = true,
  style,
  textStyle,
}) {
  return (
    <View style={[s.techKickerRow, style]}>
      {dot && (
        <View
          style={[
            s.kickerDot,
            { backgroundColor: accent ? THEME.accent : THEME.textSecondary },
          ]}
        />
      )}
      <Text
        style={[
          s.kickerText,
          { color: accent ? THEME.accentSoft : THEME.textMuted },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

/**
 * HalftoneCornerDeco:
 * Pixel corner crosshairs (+) or brackets (┌ ┐) for cards.
 */
export function HalftoneCornerDeco({ color = THEME.pixelBorder }) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Text style={[s.cornerText, { top: 6, left: 8, color }]}>+</Text>
      <Text style={[s.cornerText, { top: 6, right: 8, color }]}>+</Text>
      <Text style={[s.cornerText, { bottom: 6, left: 8, color }]}>+</Text>
      <Text style={[s.cornerText, { bottom: 6, right: 8, color }]}>+</Text>
    </View>
  );
}

/**
 * DitherCardBox:
 * Card container with subtle dot-matrix background, pixelated borders, and retro feel.
 */
export function DitherCardBox({
  children,
  accent = false,
  showCorners = true,
  style,
}) {
  return (
    <View
      style={[
        s.cardBox,
        accent && s.cardBoxAccent,
        style,
      ]}
    >
      
      
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  techKickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  kickerDot: {
    width: 6,
    height: 6,
    borderRadius: 1, // subtle squarish dot
  },
  kickerText: {
    fontFamily: THEME.fontMono,
    fontSize: 11,
    letterSpacing: 1.2,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  cornerText: {
    position: "absolute",
    fontFamily: THEME.fontMono,
    fontSize: 10,
    fontWeight: "bold",
    opacity: 0.6,
  },
  cardBox: {
    position: "relative",
    backgroundColor: THEME.bgCard,
    borderWidth: 1,
    borderColor: THEME.pixelBorder,
    borderRadius: 20,
    overflow: "hidden",
  },
  cardBoxAccent: {
    borderColor: "rgba(184, 61, 74, 0.35)",
    backgroundColor: "#190F16",
  },
});

