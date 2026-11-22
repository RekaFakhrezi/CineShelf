import React from "react";
import { View, StyleSheet } from "react-native";
import { THEME } from "../../constants/theme";
import { Icon } from "./Icon";
import { ScalePressable } from "./ScalePressable";

export function BookmarkButton({ active, onPress, style }) {
  return <ScalePressable onPress={event => { event.stopPropagation(); onPress(); }}
    accessibilityLabel={active ? "Hapus dari watchlist" : "Tambah ke watchlist"}
    containerStyle={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}
    accessibilityState={{ selected: active }} hitSlop={8} scaleTo={0.92} style={[s.button, style]}>
    <View pointerEvents="none" accessible={false} style={s.shadow}><Icon name="bookmark" size={26} color="rgba(0,0,0,0.65)" /></View>
    <Icon name={active ? "bookmark" : "bookmark-outline"} size={24} color={active ? THEME.accentSoft : "white"} />
  </ScalePressable>;
}
const s = StyleSheet.create({
  button: { width: 28, height: 28, alignItems: "center", justifyContent: "center" },
  shadow: { position: "absolute", top: 2, left: 1 },
});
