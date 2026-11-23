import React, { useEffect, useRef, useState } from "react";
import { View, Text, ImageBackground, ScrollView, Pressable, StyleSheet, Platform, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { THEME } from "../../constants/theme";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { Icon } from "../common/Icon";
import { Button } from "../common/Button";
import { ScalePressable } from "../common/ScalePressable";

export function HeroBannerCarousel({ items = [], saved = [], ready, onOpen, onToggleSave, topPadding = 76 }) {
  const slides = items.slice(0, 5);
  const count = slides.length;
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [width, setWidth] = useState(Math.min(windowWidth, 1040));
  const [index, setIndex] = useState(0);
  const [failedImages, setFailedImages] = useState({});
  const [announcement, setAnnouncement] = useState("");
  const track = useRef(null);
  const current = useRef(0);
  const pending = useRef(null);
  const scrollTimer = useRef(null);
  useEffect(() => () => clearTimeout(scrollTimer.current), []);
  const reducedMotion = useReducedMotion();
  const wide = width >= 768;
  const height = wide ? 520 : Math.min(580, Math.max(520, windowHeight * 0.68));

  useEffect(() => {
    current.current = Math.min(current.current, Math.max(0, count - 1));
    pending.current = null;
    setIndex(current.current);
    track.current?.scrollTo({ x: current.current * width, animated: false });
  }, [width, count]);

  const goTo = target => {
    if (!count) return;
    const next = (target + count) % count;
    const from = pending.current ?? current.current;
    pending.current = next;
    setIndex(next);
    // Native paging on mobile; RN Web maps pagingEnabled to CSS scroll snap.
    // A boundary wrap jumps directly instead of sweeping through four covers.
    track.current?.scrollTo({ x: next * width, animated: !reducedMotion && Math.abs(next - from) < count - 1 });
  };
  const position = event => Math.max(0, Math.min(count - 1, Math.round(event.nativeEvent.contentOffset.x / width)));
  const settle = event => {
    const next = position(event);
    if (pending.current !== null && next !== pending.current) return;
    pending.current = null;
    if (next !== current.current) setAnnouncement("Pilihan " + (next + 1) + " dari " + count + ": " + slides[next]?.title);
    current.current = next;
    setIndex(next);
  };
  if (!count) return null;

  return <View onLayout={event => {
    const measured = event.nativeEvent.layout.width;
    if (measured > 0 && measured !== width) setWidth(measured);
  }} style={{ paddingTop: Math.max(0, topPadding - 8) }}>
    <View style={{ height }} accessibilityLabel="Pilihan CineShelf">
      <ScrollView ref={track} horizontal pagingEnabled showsHorizontalScrollIndicator={false}
        directionalLockEnabled scrollEventThrottle={16}
        style={[s.track, Platform.OS === "web" && { overscrollBehaviorX: "contain" }]}
        onScrollBeginDrag={() => { pending.current = null; }}
        onScroll={event => {
          if (pending.current === null) setIndex(position(event));
          // RN Web does not emit momentum-end for programmatic scrolling.
          if (Platform.OS === "web") {
            const x = event.nativeEvent.contentOffset.x;
            clearTimeout(scrollTimer.current);
            scrollTimer.current = setTimeout(() => settle({ nativeEvent: { contentOffset: { x } } }), 150);
          }
        }}
        onMomentumScrollEnd={Platform.OS === "web" ? undefined : settle}>
        {slides.map((item, slideIndex) => <View key={item.id} style={[s.slide, { width, height }]}
          accessibilityLabel={"Pilihan " + (slideIndex + 1) + " dari " + count + ": " + item.title}>
          {item.image && !failedImages[item.image] && <ImageBackground source={{ uri: item.image }}
            onError={() => setFailedImages(previous => ({ ...previous, [item.image]: true }))}
            resizeMode="cover" style={StyleSheet.absoluteFill} />}
          <LinearGradient pointerEvents="none"
            colors={[THEME.bg, "rgba(13,23,36,0.05)", "rgba(13,23,36,0.08)", "rgba(13,23,36,0.87)", THEME.bg]}
            locations={[0, 0.19, 0.43, 0.75, 1]} style={StyleSheet.absoluteFill} />
          <View style={[s.content, wide && s.wideContent]}>
            <Text style={s.pick}>Pilihan CineShelf</Text>
            <Text style={[s.title, wide && s.wideTitle]}>{item.title}</Text>
            <View style={s.meta}><Icon name="star" size={14} color={THEME.star} /><Text style={s.rating}>{item.rating}</Text>
              <Text style={s.metaText}>{item.year}</Text><Text style={s.metaText}>{item.genre}</Text><Text style={s.metaText}>{item.duration}</Text></View>
            <Text style={s.tagline}>{item.tagline}</Text>
            <View style={s.actions}><Button label="Lihat detail" onPress={() => onOpen(item)} />
              <Button label={saved.includes(item.id) ? "Tersimpan" : "Watchlist"}
                icon={saved.includes(item.id) ? "bookmark" : "add-outline"}
                secondary disabled={!ready} onPress={() => onToggleSave(item)} /></View>
          </View>
        </View>)}
      </ScrollView>
      {count > 1 && [-1, 1].map(direction => <ScalePressable key={direction}
        containerStyle={[s.arrowPosition, direction < 0 ? { left: 8 } : { right: 8 }]}
        onPress={() => goTo((pending.current ?? current.current) + direction)}
        accessibilityLabel={direction < 0 ? "Pilihan sebelumnya" : "Pilihan berikutnya"} style={s.arrow}>
        <Icon name={direction < 0 ? "chevron-back" : "chevron-forward"} size={22} color={THEME.textPrimary} />
      </ScalePressable>)}
    </View>
    {count > 1 && <View style={s.dots} accessibilityLabel="Pilih cover">
      {slides.map((item, dotIndex) => <Pressable accessibilityRole="button" key={item.id} onPress={() => goTo(dotIndex)}
        accessibilityLabel={"Tampilkan pilihan " + (dotIndex + 1) + ": " + item.title}
        accessibilityState={{ selected: index === dotIndex }}
        {...(Platform.OS === "web" ? { "aria-current": index === dotIndex ? "true" : undefined } : {})} style={s.dotTarget}>
        <View style={[s.dot, index === dotIndex && s.activeDot]} />
      </Pressable>)}
    </View>}
    <Text accessibilityLiveRegion="polite" role={Platform.OS === "web" ? "status" : undefined} style={s.status}>{announcement}</Text>
  </View>;
}

const s = StyleSheet.create({
  track: { flex: 1 },
  slide: { backgroundColor: THEME.bg, justifyContent: "flex-end", overflow: "hidden" },
  content: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 22, gap: 11 },
  wideContent: { maxWidth: 650, paddingHorizontal: 48, paddingBottom: 30, gap: 14 },
  pick: { color: THEME.textSecondary, fontSize: 12, fontWeight: "600" },
  title: { color: THEME.textPrimary, fontSize: 34, lineHeight: 40, fontWeight: "800", letterSpacing: -1 },
  wideTitle: { fontSize: 46, lineHeight: 52 },
  meta: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", columnGap: 10, rowGap: 6 },
  rating: { color: THEME.star, fontSize: 13, fontWeight: "700", marginLeft: -5 },
  metaText: { color: THEME.textSecondary, fontSize: 12 },
  tagline: { color: THEME.textPrimary, fontSize: 14, lineHeight: 21 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 2 },
  arrowPosition: { position: "absolute", top: "38%" },
  arrow: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(13,23,36,0.52)", alignItems: "center", justifyContent: "center" },
  dots: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingBottom: 6 },
  dotTarget: { width: 36, height: 44, alignItems: "center", justifyContent: "center" },
  dot: { width: 6, height: 6, borderRadius: 4, backgroundColor: THEME.textMuted },
  activeDot: { width: 20, backgroundColor: THEME.textPrimary },
  status: { position: "absolute", width: 1, height: 1, overflow: "hidden", opacity: 0 },
});
