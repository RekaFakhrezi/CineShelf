import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { THEME } from "../constants/theme";
import { HeroBannerCarousel } from "../components/home/HeroBannerCarousel";
import { Shelf } from "../components/home/Shelf";
import { CineRouletteCard } from "../components/home/CineRouletteCard";

export function HomeScreen({
  homeScrollRef,
  handleScroll,
  contentTopPadding,
  contentBottomPadding,
  heroItems,
  saved,
  ready,
  onOpenDetail,
  onToggleSave,
  movies,
  series,
  navigate,
  onSelectMood,
  onOpenRoulette,
}) {
  return (
    <ScrollView
      ref={homeScrollRef}
      showsVerticalScrollIndicator={false}
      onScroll={handleScroll}
      scrollEventThrottle={16}
      contentContainerStyle={[
        s.scrollContent,
        {
          paddingTop: 0,
          paddingBottom: contentBottomPadding,
        },
      ]}
    >
      {/* Full-width, user-controlled cover carousel */}
      {heroItems && heroItems.length > 0 ? (
        <HeroBannerCarousel
          items={heroItems}
          saved={saved}
          ready={ready}
          onOpen={onOpenDetail}
          onToggleSave={onToggleSave}
          topPadding={contentTopPadding}
        />
      ) : (
        <View style={[s.emptyBox, { paddingTop: contentTopPadding }]}>
          <Text style={s.emptyTitleText}>Katalog masih kosong</Text>
          <Text style={s.emptyDescText}>
            Tambahkan judul melalui API atau aktifkan mode demo.
          </Text>
        </View>
      )}

      {/* IDE 2: Mood Matcher & CineRoulette Interactive Card */}
      <CineRouletteCard
        onSelectMood={onSelectMood}
        onOpenRoulette={onOpenRoulette}
      />

      {/* Movies Shelf */}
      <Shelf
        title="Film untuk dijelajahi"
        subtitle="Dari petualangan besar sampai cerita sehari-hari."
        items={movies || []}
        onOpen={onOpenDetail}
        saved={saved}
        onAll={() => navigate("film")}
        onToggleSave={onToggleSave}
      />

      {/* Series Shelf */}
      <Shelf
        title="Satu episode lagi"
        subtitle="Serial yang bisa kamu ikuti pelan-pelan."
        items={series || []}
        onOpen={onOpenDetail}
        saved={saved}
        onAll={() => navigate("serial")}
        onToggleSave={onToggleSave}
      />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 0,
  },
  emptyBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 24,
    gap: 12,
  },
  emptyTitleText: {
    color: "white",
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  emptyDescText: {
    color: THEME.textSecondary,
    fontSize: 13,
    textAlign: "center",
    maxWidth: 320,
    lineHeight: 20,
  },
  spotlightCard: {
    marginHorizontal: 16,
    marginTop: 28,
    borderRadius: 22,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    overflow: "hidden",
    position: "relative",
  },
  spotlightIconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(184, 61, 74, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(184, 61, 74, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  spotlightTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 2,
  },
  spotlightSub: {
    color: THEME.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
  spotlightArrowPill: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
});
