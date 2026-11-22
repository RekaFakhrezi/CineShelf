import React from "react";
import { Text, StyleSheet } from "react-native";
import { THEME } from "../../constants/theme";
import { Icon } from "./Icon";
import { ScalePressable } from "./ScalePressable";

export function Button({
  label,
  title,
  variant,
  icon,
  onPress,
  secondary = false,
  ghost = false,
  disabled = false,
  style,
  size = "md",
}) {
  label = label ?? title;
  secondary = secondary || variant === "outline";
  const isSm = size === "sm";
  return (
    <ScalePressable
      disabled={disabled}
      onPress={onPress}
      accessibilityLabel={label}
      hitSlop={{ top: isSm ? 7 : 5, bottom: isSm ? 7 : 5, left: 2, right: 2 }}
      containerStyle={[{ minHeight: 48, justifyContent: "center" }, style?.flex ? { flex: style.flex } : undefined]}
      style={[
        s.btn,
        isSm ? s.btnSm : s.btnMd,
        secondary ? s.btnSecondary : ghost ? s.btnGhost : s.btnPrimary,
        style,
      ]}
    >
      {icon && (
        <Icon
          name={icon}
          size={isSm ? 15 : 16}
          color={ghost ? THEME.textSecondary : "white"}
        />
      )}
      <Text
        style={[
          s.btnText,
          isSm && { fontSize: 12 },
          ghost && { color: THEME.textSecondary },
        ]}
      >
        {label}
      </Text>
    </ScalePressable>
  );
}

const s = StyleSheet.create({
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    gap: 6,
  },
  btnMd: {
    minHeight: 38,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  btnSm: {
    minHeight: 34,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  btnPrimary: {
    backgroundColor: THEME.accent,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.22)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.22)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  btnSecondary: {
    backgroundColor: THEME.bgElevated,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  btnGhost: {
    backgroundColor: "transparent",
  },
  btnText: {
    color: "white",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
});

