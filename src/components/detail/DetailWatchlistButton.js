import React, { useRef } from "react";
import { View, Text, Pressable, Animated, Platform, StyleSheet } from "react-native";
import { THEME } from "../../constants/theme";
import { Icon } from "../common/Icon";

// Interactive Detail Watchlist CTA Button with tactile bounce, expanding ripple ring, and state morphing
export function DetailWatchlistButton({ active, onPress, disabled }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const ringScale = useRef(new Animated.Value(0.8)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;

  const handlePress = () => {
    ringScale.setValue(0.8);
    ringOpacity.setValue(0.8);

    Animated.parallel([
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.94,
          duration: 90,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 100,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(ringScale, {
        toValue: 1.8,
        duration: 320,
        useNativeDriver: true,
      }),
      Animated.timing(ringOpacity, {
        toValue: 0,
        duration: 320,
        useNativeDriver: true,
      }),
    ]).start();

    onPress();
  };

  return (
    <View style={s.detailWatchlistBtnWrapper}>
      {/* Expanding Ripple Ring */}
      <Animated.View
        pointerEvents="none"
        style={[
          s.detailWatchlistPulseRing,
          {
            transform: [{ scale: ringScale }],
            opacity: ringOpacity,
          },
        ]}
      />
      <Animated.View style={[{ transform: [{ scale: scaleAnim }] }]}>
        <Pressable
          disabled={disabled}
          onPress={handlePress}
          accessibilityRole="button"
          accessibilityLabel={active ? "Tersimpan di Watchlist" : "Tambah ke Watchlist"}
          style={[
            s.btn,
            s.btnMd,
            active ? s.detailWatchlistActiveBtn : s.btnPrimary,
            Platform.select({ web: { cursor: disabled ? "default" : "pointer" } }),
          ]}
        >
          <Icon
            name={active ? "bookmark" : "bookmark-outline"}
            size={18}
            color="white"
          />
          <Text style={s.btnText}>
            {active ? "Tersimpan" : "+ Watchlist"}
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  detailWatchlistBtnWrapper: {
    width: "100%",
    position: "relative",
  },
  detailWatchlistPulseRing: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: 8,
    backgroundColor: THEME.accent,
  },
  detailWatchlistActiveBtn: {
    backgroundColor: "rgba(184, 61, 74, 0.22)",
    borderWidth: 1.5,
    borderColor: THEME.accent,
    shadowColor: THEME.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0,
    shadowRadius: 14,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    gap: 8,
  },
  btnMd: {
    height: 48,
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  btnPrimary: {
    backgroundColor: THEME.accent,
    shadowColor: THEME.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0,
    shadowRadius: 10,
  },
  btnText: {
    color: "white",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
});

