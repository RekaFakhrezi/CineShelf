import React, { useState } from "react";
import { View, Text, ImageBackground, StyleSheet, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { THEME } from "../../constants/theme";
import { Icon } from "../common/Icon";
import { Button } from "../common/Button";
import { ScalePressable } from "../common/ScalePressable";

export function HeroBannerCarousel({ items = [], saved = [], ready, onOpen, onToggleSave, topPadding }) {
  const [index, setIndex] = useState(0);
  const [failedImage, setFailedImage] = useState(null);
  const { width } = useWindowDimensions();
  const count = Math.min(items.length, 5);
  const activeIndex = index % (count || 1);
  const item = items[activeIndex];
  if (!item) return null;
  const wide = width >= 768;
  const isSaved = saved.includes(item.id);
  return <View style={{ paddingTop: topPadding + 20 }}>
    <View style={s.intro}><Text style={s.heading}>Ada cerita untuk hari ini.</Text>
      <Text style={s.sub}>Temukan film, simpan pilihan, nikmati ceritanya.</Text></View>
    <View style={s.featureFrame}><View style={[s.feature, { minHeight: wide ? 420 : 460, backgroundColor: item.color || THEME.bgCard }]}>
      {item.image && failedImage !== item.image && <ImageBackground source={{ uri: item.image }}
        onError={() => setFailedImage(item.image)} resizeMode="cover" style={StyleSheet.absoluteFill} />}
      <LinearGradient colors={["rgba(13,23,36,0.05)", "rgba(13,23,36,0.35)", "rgba(13,23,36,0.98)"]}
        locations={[0, 0.35, 1]} style={StyleSheet.absoluteFill} />
      <View style={[s.content, wide && { maxWidth: 580, padding: 32 }]}>
        <Text style={s.pick}>Pilihan CineShelf</Text>
        <Text style={[s.title, wide && { fontSize: 44, lineHeight: 50 }]}>{item.title}</Text>
        <View style={s.meta}><Icon name="star" size={16} color={THEME.star} /><Text style={s.rating}>{item.rating}</Text>
          <Text style={s.metaText}>{item.year}</Text><Text style={s.metaText}>{item.genre}</Text><Text style={s.metaText}>{item.duration}</Text></View>
        <Text style={s.tagline}>{item.tagline}</Text>
        <View style={s.actions}><Button label="Lihat detail" onPress={() => onOpen(item)} />
          <Button label={isSaved ? "Tersimpan" : "Watchlist"} icon={isSaved ? "bookmark" : "add-outline"}
            secondary disabled={!ready} onPress={() => onToggleSave(item)} /></View>
      </View>
    </View>
    </View>
    {count > 1 && <View style={s.controls}>
      <Text style={s.sub}>{activeIndex + 1} dari {count} pilihan</Text>
      <View style={s.arrows}>{[-1, 1].map(direction => <ScalePressable key={direction}
        onPress={() => setIndex((activeIndex + direction + count) % count)}
        accessibilityLabel={direction < 0 ? "Pilihan sebelumnya" : "Pilihan berikutnya"} style={s.arrow}>
        <Icon name={direction < 0 ? "arrow-back" : "arrow-forward"} size={20} color={THEME.textPrimary} />
      </ScalePressable>)}</View>
    </View>}
  </View>;
}
const s = StyleSheet.create({
  intro: { paddingHorizontal: 20, marginBottom: 24, gap: 8 },
  heading: { color: THEME.textPrimary, fontSize: 27, lineHeight: 34, fontWeight: "700", letterSpacing: -0.8 },
  sub: { color: THEME.textSecondary, fontSize: 13, lineHeight: 20 },
  featureFrame: { marginHorizontal: 20, borderRadius: 16, ...THEME.raisedShadow },
  feature: { borderWidth: 1, borderColor: THEME.raisedBorder, borderRadius: 16, overflow: "hidden", justifyContent: "flex-end" },
  content: { padding: 24, gap: 14 },
  pick: { color: THEME.textPrimary, fontSize: 12, fontWeight: "600", alignSelf: "flex-start", backgroundColor: "rgba(13,23,36,0.72)", borderWidth: 1, borderColor: THEME.raisedBorder, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6 },
  title: { color: THEME.textPrimary, fontSize: 34, lineHeight: 40, fontWeight: "800", letterSpacing: -1 },
  meta: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", columnGap: 12, rowGap: 8 },
  rating: { color: THEME.star, fontSize: 14, fontWeight: "700", marginLeft: -6 },
  metaText: { color: THEME.textSecondary, fontSize: 13 },
  tagline: { color: THEME.textPrimary, fontSize: 15, lineHeight: 23 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 4 },
  controls: { paddingHorizontal: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
  arrows: { flexDirection: "row", gap: 8 },
  arrow: { width: 48, height: 48, alignItems: "center", justifyContent: "center" },
});
