import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { THEME } from "../../constants/theme";
import { Icon } from "../common/Icon";
import { Artwork } from "../common/Artwork";
import { BookmarkButton } from "../common/BookmarkButton";
import { ScalePressable } from "../common/ScalePressable";
export function Poster({ item, onOpen, saved, width = 136, rank, onToggleSave }) {
  return <View style={{ width }}>
    <View style={s.posterFrame}>
      <ScalePressable onPress={() => onOpen(item)} accessibilityLabel={'Detail ' + item.title}>
        <Artwork item={item} style={[s.art, { height: width * 1.44 }]}>
          <Text numberOfLines={3} style={s.artTitle}>{item.title}</Text>
        </Artwork>
      </ScalePressable>
      {onToggleSave && <View style={s.save}><BookmarkButton active={saved} onPress={() => onToggleSave(item)} /></View>}
    </View>
    <ScalePressable onPress={() => onOpen(item)} accessibilityLabel={'Detail ' + item.title} style={s.info}>
      <Text numberOfLines={2} style={s.title}>{rank ? rank + '. ' : ''}{item.title}</Text>
      <View style={s.meta}><Icon name="star" size={12} color={THEME.star} /><Text style={s.score}>{item.rating}</Text><Text style={s.year}>{item.year}</Text></View>
      <Text numberOfLines={1} style={s.genre}>{item.genre}</Text>
    </ScalePressable>
  </View>;
}
const s = StyleSheet.create({
  posterFrame: { position: "relative", borderRadius: 12, backgroundColor: THEME.bgCard, ...THEME.raisedShadow },
  art: { borderRadius: 12, justifyContent: "flex-end", padding: 10 },
  artTitle: { color: "white", fontSize: 17, fontWeight: "800", lineHeight: 21, letterSpacing: -0.5 },
  save: { position: "absolute", top: 0, right: 0 },
  info: { paddingTop: 12, gap: 6, minHeight: 84 },
  title: { color: THEME.textPrimary, fontSize: 14, lineHeight: 20, fontWeight: "600" },
  meta: { flexDirection: "row", alignItems: "center", gap: 5 },
  score: { color: THEME.textPrimary, fontSize: 12 },
  year: { color: THEME.textSecondary, fontSize: 12, marginLeft: 7 },
  genre: { color: THEME.textMuted, fontSize: 12 },
});
