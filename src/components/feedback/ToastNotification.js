import React from "react";
import { View, Text, Animated, Platform, StyleSheet } from "react-native";
import { THEME } from "../../constants/theme";
import { Icon } from "../common/Icon";

export function ToastNotification({ notice, toastAnim, topInset }) {
  if (!notice?.text) return null;

  return (
    <Animated.View
      accessibilityLiveRegion="polite"
      pointerEvents="none"
      style={[
        s.toastBox,
        {
          top: Math.max(topInset, 10) + 62,
          opacity: toastAnim,
          transform: [
            {
              translateY: toastAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-14, 0],
              }),
            },
          ],
        },
        Platform.select({
          web: {
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          },
        }),
      ]}
    >
      <View
        style={[
          s.toastIconBadge,
          notice.type === "unsave" && s.toastIconBadgeUnsave,
        ]}
      >
        <Icon
          name={
            notice.type === "save"
              ? "bookmark"
              : notice.type === "unsave"
              ? "bookmark-outline"
              : "checkmark"
          }
          color={notice.type === "unsave" ? THEME.textSecondary : "white"}
          size={13}
        />
      </View>
      <Text numberOfLines={2} style={s.toastText}>
        {notice.text}
      </Text>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  toastBox: {
    position: "absolute",
    left: 20,
    right: 20,
    maxWidth: 420,
    alignSelf: "center",
    backgroundColor: "rgba(18, 20, 32, 0.96)",
    borderColor: "rgba(184, 61, 74, 0.35)",
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    shadowColor: THEME.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0,
    shadowRadius: 14,
    elevation: 14,
    zIndex: 99999,
  },
  toastIconBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: THEME.accent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: THEME.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0,
    shadowRadius: 5,
  },
  toastIconBadgeUnsave: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.16)",
    shadowOpacity: 0,
  },
  toastText: {
    color: "white",
    fontSize: 12,
    fontWeight: "700",
    flex: 1,
  },
});

