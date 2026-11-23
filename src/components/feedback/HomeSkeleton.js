import React from "react";
import { ScrollView } from "react-native";
import { HeroBannerCarousel } from "../home/HeroBannerCarousel";
import { CineRouletteCard } from "../home/CineRouletteCard";
import { Shelf } from "../home/Shelf";

// Compose the same sections as HomeScreen so geometry cannot drift into a separate wireframe.
export function HomeSkeleton({ contentTopPadding = 76, contentBottomPadding = 94 }) {
  return <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: contentBottomPadding }}
    accessibilityLabel="Memuat Beranda" accessibilityState={{ busy: true }}>
    <HeroBannerCarousel loading topPadding={contentTopPadding} />
    <CineRouletteCard loading />
    <Shelf loading title="Film untuk dijelajahi" subtitle="Dari petualangan besar sampai cerita sehari-hari." />
    <Shelf loading title="Satu episode lagi" subtitle="Serial yang bisa kamu ikuti pelan-pelan." />
  </ScrollView>;
}
