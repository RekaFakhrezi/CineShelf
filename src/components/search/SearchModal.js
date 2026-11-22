import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  Modal,
  ScrollView,
  Platform,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { THEME } from "../../constants/theme";
import { Icon } from "../common/Icon";
import { ScalePressable } from "../common/ScalePressable";
import { Artwork } from "../common/Artwork";

export function SearchModal({
  visible,
  onClose,
  catalog = [],
  onOpenDetail,
}) {
  const [query, setQuery] = useState("");
  const { height: windowHeight } = useWindowDimensions();

  // Reset query whenever modal opens
  useEffect(() => {
    if (visible) {
      setQuery("");
    }
  }, [visible]);

  // Top trending titles (sorted by rating descending)
  const trendingList = useMemo(() => {
    return [...catalog]
      .sort((a, b) => (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0))
      .slice(0, 10);
  }, [catalog]);

  // Search filtered results
  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return catalog.filter((item) => {
      const matchTitle = item.title?.toLowerCase().includes(q);
      const matchGenre = item.genre?.toLowerCase().includes(q);
      const matchCast = item.cast?.toLowerCase().includes(q);
      const matchDirector = item.director?.toLowerCase().includes(q);
      return matchTitle || matchGenre || matchCast || matchDirector;
    });
  }, [catalog, query]);

  const handleSelectItem = (item) => {
    onClose();
    onOpenDetail(item);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={s.modalBackdrop}>
        {/* Clickable backdrop dismiss area */}
        <ScalePressable
          onPress={onClose}
          style={StyleSheet.absoluteFill}
          accessibilityLabel="Tutup pencarian"
        />

        {/* Search Bottom Sheet / Dialog Card */}
        <View style={[s.searchSheetBox, { maxHeight: windowHeight * 0.88 }]}>
          {/* Top Grab Handle */}
          <View style={s.grabHandle} />

          {/* Modal Header */}
          <View style={s.modalHeaderRow}>
            <Text style={s.modalTitleText}>Search</Text>
            <ScalePressable
              onPress={onClose}
              accessibilityLabel="Tutup dialog pencarian"
              style={s.closeCircleBtn}
            >
              <Icon name="close" size={20} color="white" />
            </ScalePressable>
          </View>

          {/* Search Input Bar (Matching user's reference) */}
          <View style={s.searchBarContainer}>
            <Icon name="search-outline" size={19} color={THEME.textMuted} />
            <TextInput
              autoFocus={true}
              accessibilityLabel="Cari film atau serial"
              placeholder="Cari judul, artis, genre, atau serial..."
              placeholderTextColor={THEME.textMuted}
              style={s.searchInput}
              value={query}
              onChangeText={setQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {query !== "" && (
              <ScalePressable
                onPress={() => setQuery("")}
                accessibilityLabel="Hapus pencarian"
              >
                <Icon name="close-circle" size={18} color={THEME.textMuted} />
              </ScalePressable>
            )}
          </View>

          {/* Results or Trending Content */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={s.scrollContent}
          >
            {query.trim() === "" ? (
              // POPULAR / TRENDING SEARCH LIST (Exact layout as user's reference image)
              <View style={s.trendingSection}>
                <Text style={s.sectionHeaderKicker}>PENCARIAN POPULER</Text>
                {trendingList.map((item, idx) => {
                  const isTopOne = idx === 0;
                  return (
                    <ScalePressable
                      key={item.id}
                      onPress={() => handleSelectItem(item)}
                      style={s.trendingRow}
                    >
                      {/* Rank pill: #1 is highlighted red, others dark glass */}
                      <View
                        style={[
                          s.rankBadge,
                          isTopOne ? s.rankBadgeTop : s.rankBadgeNormal,
                        ]}
                      >
                        <Text
                          style={[
                            s.rankBadgeText,
                            isTopOne && s.rankBadgeTextTop,
                          ]}
                        >
                          #{idx + 1}
                        </Text>
                      </View>

                      {/* Title & Metadata */}
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text numberOfLines={1} style={s.trendingItemTitle}>
                          {item.title}
                        </Text>
                        <Text style={s.trendingItemSub}>
                          {(item.type || "film").toUpperCase()} · {item.genre} · ★ {item.rating}
                        </Text>
                      </View>

                      {/* Right subtle arrow / dash */}
                      <Icon
                        name="chevron-forward"
                        size={16}
                        color={THEME.textMuted}
                      />
                    </ScalePressable>
                  );
                })}
              </View>
            ) : searchResults.length > 0 ? (
              // SEARCH RESULTS LIST
              <View style={s.resultsSection}>
                <Text style={s.sectionHeaderKicker}>
                  HASIL PENCARIAN ({searchResults.length})
                </Text>
                {searchResults.map((item) => (
                  <ScalePressable
                    key={item.id}
                    onPress={() => handleSelectItem(item)}
                    style={s.resultCardRow}
                  >
                    {/* Poster Thumbnail */}
                    <Artwork item={item} style={s.resultThumbnail}>
                      <View style={s.resultThumbTypeBadge}>
                        <Text style={s.resultThumbTypeText}>
                          {(item.type || "film").toUpperCase()}
                        </Text>
                      </View>
                    </Artwork>

                    {/* Result Info */}
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text numberOfLines={1} style={s.resultTitleText}>
                        {item.title}
                      </Text>
                      <Text numberOfLines={1} style={s.resultTaglineText}>
                        {item.tagline || item.synopsis}
                      </Text>
                      <View style={s.resultMetaRow}>
                        <View style={s.resultRatingBadge}>
                          <Icon name="star" size={11} color={THEME.star} />
                          <Text style={s.resultRatingText}>{item.rating}</Text>
                        </View>
                        <Text style={s.resultMetaDot}>·</Text>
                        <Text style={s.resultMetaText}>{item.year}</Text>
                        <Text style={s.resultMetaDot}>·</Text>
                        <Text style={s.resultMetaText}>{item.genre}</Text>
                      </View>
                    </View>

                    <Icon
                      name="chevron-forward"
                      size={18}
                      color={THEME.accent}
                    />
                  </ScalePressable>
                ))}
              </View>
            ) : (
              // EMPTY STATE
              <View style={s.emptyBox}>
                <View style={s.emptyIconCircle}>
                  <Icon name="search-outline" size={32} color={THEME.accent} />
                </View>
                <Text style={s.emptyTitle}>Judul Tidak Ditemukan</Text>
                <Text style={s.emptySub}>
                  Tidak ada film atau serial yang cocok dengan "{query}". Coba
                  gunakan kata kunci lain atau judul film lainnya.
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.78)",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  searchSheetBox: {
    width: "100%",
    maxWidth: 580,
    backgroundColor: "#131522",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0,
    shadowRadius: 24,
  },
  grabHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255, 255, 255, 0.22)",
    alignSelf: "center",
    marginBottom: 14,
  },
  modalHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  modalTitleText: {
    color: "white",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.4,
  },
  closeCircleBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 18,
    paddingHorizontal: 16,
    height: 48,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    color: "white",
    fontSize: 14,
    height: "100%",
    ...Platform.select({ web: { outlineStyle: "none" } }),
  },
  scrollContent: {
    paddingBottom: 24,
  },
  sectionHeaderKicker: {
    color: THEME.textMuted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 12,
    marginTop: 4,
  },
  trendingSection: {
    gap: 4,
  },
  trendingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  rankBadge: {
    minWidth: 32,
    height: 24,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  rankBadgeTop: {
    backgroundColor: "rgba(184, 61, 74, 0.2)",
    borderWidth: 1,
    borderColor: THEME.accent,
  },
  rankBadgeNormal: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  rankBadgeText: {
    color: THEME.textSecondary,
    fontSize: 11,
    fontWeight: "800",
  },
  rankBadgeTextTop: {
    color: THEME.accent,
  },
  trendingItemTitle: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
  },
  trendingItemSub: {
    color: THEME.textMuted,
    fontSize: 11,
  },
  resultsSection: {
    gap: 10,
  },
  resultCardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 10,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 16,
  },
  resultThumbnail: {
    width: 52,
    height: 74,
    borderRadius: 10,
    overflow: "hidden",
    justifyContent: "flex-end",
    padding: 4,
  },
  resultThumbTypeBadge: {
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
    alignSelf: "flex-start",
  },
  resultThumbTypeText: {
    color: "white",
    fontSize: 7,
    fontWeight: "800",
  },
  resultTitleText: {
    color: "white",
    fontSize: 14,
    fontWeight: "800",
  },
  resultTaglineText: {
    color: THEME.textMuted,
    fontSize: 11,
  },
  resultMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 2,
  },
  resultRatingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  resultRatingText: {
    color: THEME.star,
    fontSize: 11,
    fontWeight: "700",
  },
  resultMetaDot: {
    color: THEME.textMuted,
    fontSize: 11,
  },
  resultMetaText: {
    color: THEME.textSecondary,
    fontSize: 11,
  },
  emptyBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 36,
    paddingHorizontal: 20,
    gap: 8,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(184, 61, 74, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  emptyTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
  },
  emptySub: {
    color: THEME.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    maxWidth: 280,
  },
});

