import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { THEME } from "../constants/theme";
import { Icon } from "../components/common/Icon";
import { Artwork } from "../components/common/Artwork";
import { ScalePressable } from "../components/common/ScalePressable";
import { DetailWatchlistButton } from "../components/detail/DetailWatchlistButton";
import { WatchedLogSection } from "../components/detail/WatchedLogSection";
import { Shelf } from "../components/home/Shelf";
import { DotPatternBackground, TechKicker } from "../components/common/DitherAccent";

export function DetailScreen({
  detailScrollRef,
  detailItem,
  onClose,
  saved,
  ready,
  onToggleSave,
  catalog = [],
  onOpenDetail,
  handleScroll,
  contentTopPadding,
  contentBottomPadding,
  onOpenAddToShelf,
  watchedList = [],
  onToggleWatched,
  userRatings = {},
  onRate,
  userReactions = {},
  onReact,
}) {
  if (!detailItem) return null;

  const isWatched = watchedList.includes(detailItem.id);
  const rating = userRatings[detailItem.id] || 0;
  const reaction = userReactions[detailItem.id] || null;

  return (
    <ScrollView
      ref={detailScrollRef}
      key={detailItem.id}
      showsVerticalScrollIndicator={false}
      onScroll={handleScroll}
      scrollEventThrottle={16}
      contentContainerStyle={[
        s.detailContent,
        {
          paddingTop: contentTopPadding,
          paddingBottom: contentBottomPadding,
        },
      ]}
    >
      {/* Detail Artwork Hero */}
      <Artwork item={detailItem} style={s.detailHeroArtwork}>
        {/* Subtle halftone/dither matrix overlay on hero */}
        

        <LinearGradient
          colors={["rgba(13,23,36,0.6)", "transparent", "rgba(13,23,36,0.95)", THEME.bg]}
          locations={[0, 0.35, 0.8, 1]}
          style={StyleSheet.absoluteFill}
        />

        {/* Back Pill Button */}
        <ScalePressable
          accessibilityLabel="Kembali"
          accessibilityRole="button"
          onPress={onClose}
          style={s.detailBackPill}
        >
          <Icon name="arrow-back" size={20} color="white" />
        </ScalePressable>

        {/* Title & Rating Overlay: Sejajar judul film, tanpa background capsule, format 8.5/10 */}
        <View style={s.detailArtworkBottomText}>
          
          <View style={s.detailTitleRow}>
            <Text numberOfLines={2} style={s.detailHeroTitle}>
              {detailItem.title}
            </Text>
            <View style={s.detailRatingInline}>
              <Icon name="star" size={24} color={THEME.star} />
              <Text style={s.detailRatingScore}>
                {detailItem.rating}
                <Text style={s.detailRatingOutOf}>/10</Text>
              </Text>
            </View>
          </View>
        </View>
      </Artwork>

      {/* Detail Body */}
      <View style={s.detailBodyContainer}>
        {/* Metadata: Clean text without capsule boxes */}
        <View style={s.detailMetaTextRow}>
          <Text style={s.detailMetaInlineText}>
            {detailItem.genre}  ·  {detailItem.year}  ·  {detailItem.age}  ·  {detailItem.duration}
          </Text>
        </View>

        {/* Tagline */}
        <Text style={s.detailTaglineText}>"{detailItem.tagline}"</Text>

        {/* Action Row: Watchlist + Atur Rak (Harmonious rounded pills) */}
        <View style={s.detailActionRow}>
          <View style={s.detailActionCol}>
            <DetailWatchlistButton
              active={saved.includes(detailItem.id)}
              disabled={!ready}
              onPress={() => onToggleSave(detailItem)}
            />
          </View>

          {/* Atur Rak Tematik Button: matching sleek pill */}
          <View style={s.detailActionCol}>
            <ScalePressable
              onPress={() => onOpenAddToShelf && onOpenAddToShelf(detailItem)}
              style={s.aturRakBtn}
              accessibilityLabel="Atur rak tematik untuk film ini"
            >
              <Icon name="albums-outline" size={17} color="white" />
              <Text style={s.aturRakText}>Atur Rak</Text>
            </ScalePressable>
          </View>
        </View>

        {/* 1. KOLOM SINOPSIS */}
        <View style={s.detailSectionBox}>
          <Text style={s.detailSectionTitle}>Sinopsis</Text>
          <Text style={s.detailSynopsisText}>{detailItem.synopsis}</Text>
        </View>

        {/* 2. PEMERAN DAN SUTRADARA */}
        <View style={s.detailCreditsCard}>
          <View style={s.creditItem}>
            <Text style={s.creditLabel}>Pemeran</Text>
            <Text style={s.creditValue}>{detailItem.cast}</Text>
          </View>
          <View style={s.creditItem}>
            <Text style={s.creditLabel}>Sutradara</Text>
            <Text style={s.creditValue}>{detailItem.director}</Text>
          </View>
        </View>



        {/* 5. // DIARY_MENONTON (Jurnal & Status Menonton) */}
        <WatchedLogSection
          isWatched={isWatched}
          onToggleWatched={() => onToggleWatched && onToggleWatched(detailItem.id)}
          rating={rating}
          onRate={(stars) => onRate && onRate(detailItem.id, stars)}
          reaction={reaction}
          onReact={(emoji) => onReact && onReact(detailItem.id, emoji)}
        />

        {/* Series Episodes List (if serial) */}
        {detailItem.episodes && (
          <View style={s.episodesSection}>
            <Text style={s.detailSectionTitle}>
              Musim 1 · {detailItem.episodes} Episode
            </Text>
            {Array.from({ length: detailItem.episodes }, (_, i) => (
              <View key={i} style={s.episodeRowCard}>
                <Text style={s.episodeNumText}>
                  {String(i + 1).padStart(2, "0")}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.episodeNameText}>
                    Episode {i + 1}
                  </Text>
                  <Text style={s.episodeDurationText}>
                    Rincian episode belum tersedia
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Recommendations Shelf */}
      <Shelf
        title="Cerita Terkait Lainnya"
        subtitle="Rekomendasi judul serupa yang mungkin kamu suka"
        items={catalog
          .filter((x) => x.type === detailItem.type && x.id !== detailItem.id)
          .slice(0, 5)}
        onOpen={onOpenDetail}
        saved={saved}
        onToggleSave={onToggleSave}
      />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  detailContent: {
    paddingBottom: 40,
  },
  detailHeroArtwork: {
    height: 480,
    justifyContent: "space-between",
    padding: 20,
    position: "relative",
  },
  detailBackPill: {
    width: 48,
    height: 48,
    borderRadius: 19,
    backgroundColor: "rgba(13, 23, 36, 0.75)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  detailArtworkBottomText: {
    gap: 8,
  },
  detailTitleRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 12,
  },
  detailHeroTitle: {
    flex: 1,
    color: "white",
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  detailRatingInline: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 5,
    paddingBottom: 4,
  },
  detailRatingScore: {
    color: "white",
    fontSize: 24,
    fontWeight: "700",
  },
  detailRatingOutOf: {
    color: THEME.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  detailBodyContainer: {
    padding: 20,
    gap: 18,
  },
  detailMetaTextRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: -4,
  },
  detailMetaInlineText: {
    color: "#CFD3E3",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  detailTaglineText: {
    color: THEME.textSecondary,
    fontSize: 15,
    fontStyle: "italic",
    lineHeight: 22,
  },
  detailActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  detailActionCol: {
    flex: 1,
  },
  aturRakBtn: {
    width: "100%",
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.14)",
  },
  aturRakText: {
    color: "white",
    fontSize: 13,
    fontWeight: "700",
  },
  detailSectionBox: {
    backgroundColor: THEME.bgSecondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.pixelBorder,
    padding: 18,
    gap: 8,
  },
  detailSectionTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "800",
  },
  detailSynopsisText: {
    color: THEME.textSecondary,
    fontSize: 14,
    lineHeight: 22,
  },
  detailCreditsCard: {
    backgroundColor: THEME.bgSecondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.pixelBorder,
    padding: 18,
    gap: 12,
  },
  creditItem: {
    gap: 2,
  },
  creditLabel: {
    color: THEME.textMuted,
    fontSize: 11,
    
    letterSpacing: 1,
    fontWeight: "700",
  },
  creditValue: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  episodesSection: {
    gap: 12,
  },
  episodeRowCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
    borderRadius: 16,
    backgroundColor: THEME.bgSecondary,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  episodeNumText: {
    
    fontSize: 14,
    fontWeight: "800",
    color: THEME.accentSoft,
  },
  episodeNameText: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
  },
  episodeDurationText: {
    color: THEME.textMuted,
    fontSize: 11,
  },
});
