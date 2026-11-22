import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Modal,
  Animated,
  ActivityIndicator,
  ScrollView,
  Easing,
  useWindowDimensions,
  StyleSheet,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { THEME } from "../../constants/theme";
import { Icon } from "../common/Icon";
import { ScalePressable } from "../common/ScalePressable";
import { Artwork } from "../common/Artwork";
import { DotPatternBackground, TechKicker, HalftoneCornerDeco } from "../common/DitherAccent";

const CARD_WIDTH = 145;
const CARD_GAP = 12;
const STEP = CARD_WIDTH + CARD_GAP;
const REEL_SIZE = 26;
const WINNER_INDEX = 20;

export function CineRouletteModal({
  visible,
  onClose,
  catalog = [],
  initialMood = null,
  onOpenDetail,
}) {
  const { height: windowHeight } = useWindowDimensions();
  const [selectedMood, setSelectedMood] = useState(initialMood || "all");
  const [isSpinning, setIsSpinning] = useState(false);
  const [pickedItem, setPickedItem] = useState(null);
  const [reelItems, setReelItems] = useState([]);
  const [containerWidth, setContainerWidth] = useState(360);

  // Animations
  const reelAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Filter pool by mood
  const getCandidates = (mood) => {
    if (!catalog || catalog.length === 0) return [];
    if (mood === "santai") {
      return catalog.filter(
        (x) =>
          x.genre?.toLowerCase().includes("komedi") ||
          x.genre?.toLowerCase().includes("animasi") ||
          x.genre?.toLowerCase().includes("keluarga") ||
          x.genre?.toLowerCase().includes("romance"),
      );
    }
    if (mood === "mikir") {
      return catalog.filter(
        (x) =>
          x.genre?.toLowerCase().includes("sci-fi") ||
          x.genre?.toLowerCase().includes("misteri") ||
          x.genre?.toLowerCase().includes("thriller"),
      );
    }
    if (mood === "adrenalin") {
      return catalog.filter(
        (x) =>
          x.genre?.toLowerCase().includes("aksi") ||
          x.genre?.toLowerCase().includes("action") ||
          x.genre?.toLowerCase().includes("petualangan") ||
          x.genre?.toLowerCase().includes("kejahatan"),
      );
    }
    if (mood === "drama") {
      return catalog.filter((x) => x.genre?.toLowerCase().includes("drama"));
    }
    if (mood === "singkat") {
      return catalog.filter((x) => {
        const m = x.duration?.match(/(\d+)j\s*(\d+)?m?/);
        if (m) {
          const hours = parseInt(m[1], 10) || 0;
          const mins = parseInt(m[2], 10) || 0;
          return hours * 60 + mins <= 100;
        }
        return true;
      });
    }
    return catalog;
  };

  const spinRoulette = (moodToUse = selectedMood) => {
    let pool = getCandidates(moodToUse);
    if (pool.length === 0) pool = catalog;
    if (pool.length === 0) return;

    const winner = pool[Math.floor(Math.random() * pool.length)];

    // Build reel with REEL_SIZE cards, placing winner at WINNER_INDEX
    const newReel = Array.from({ length: REEL_SIZE }, (_, i) => {
      if (i === WINNER_INDEX) return winner;
      return pool[Math.floor(Math.random() * pool.length)];
    });

    setReelItems(newReel);
    setPickedItem(null);
    reelAnim.stopAnimation();
    setIsSpinning(true);
    reelAnim.setValue(0);

    // Smooth horizontal sliding animation: fast spin -> natural inertia deceleration -> lock on winner
    Animated.timing(reelAnim, {
      toValue: 1,
      duration: 4500,
      easing: Easing.bezier(0.12, 0.9, 0.22, 1),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) return;
      setPickedItem(winner);
      setIsSpinning(false);

      // Winner card pop animation
      pulseAnim.setValue(0.92);
      Animated.spring(pulseAnim, {
        toValue: 1,
        friction: 4,
        tension: 90,
        useNativeDriver: true,
      }).start();
    });
  };

  useEffect(() => {
    if (visible) {
      setSelectedMood(initialMood || "all");
      spinRoulette(initialMood || "all");
    }
    return () => {
      reelAnim.stopAnimation();
      pulseAnim.stopAnimation();
    };
  }, [visible, initialMood]);

  // Center alignment math for the sliding strip
  const centerOffset = containerWidth / 2 - CARD_WIDTH / 2;
  const startOffset = centerOffset;
  const endOffset = centerOffset - WINNER_INDEX * STEP;
  const translateX = reelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [startOffset, endOffset],
  });

  const moodReasons = {
    santai: "Cocok buat santai sore atau melepaskan penat setelah seharian beraktivitas.",
    mikir: "Pilihan pas buat kamu yang suka plot twist dan mikir teka-teki jalan cerita.",
    adrenalin: "Siap-siap dibuat berdebar dan duduk di ujung kursi dengan aksi serunya!",
    drama: "Kisah mendalam yang menyentuh hati dan sarat emosi penuh makna.",
    singkat: "Durasi pas dan padat, bisa selesai ditonton tanpa takut kemalaman.",
    all: "Satu pilihan dari koleksimu untuk ditonton hari ini.",
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={s.modalBackdrop}>
        <ScalePressable
          onPress={onClose}
          style={StyleSheet.absoluteFill}
          accessibilityLabel="Tutup dialog"
        />

        <View style={[s.modalCard, { maxHeight: windowHeight * 0.92 }]}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.modalContent}>
          {/* Dot pattern & dither accent on modal backdrop */}
          
          

          {/* Modal Header */}
          <View style={s.headerRow}>
            <View style={{ gap: 2 }}>
              
              <Text style={s.headerTitle}>CineRoulette</Text>
            </View>
            <ScalePressable
              onPress={onClose}
              accessibilityLabel="Tutup"
              style={s.closeBtn}
            >
              <Icon name="close" size={20} color="white" />
            </ScalePressable>
          </View>

          {/* Mood Selector Tabs */}
          <View style={s.moodChipsRow}>
            {[
              { id: "all", label: "Semua" },
              { id: "santai", label: "Santai" },
              { id: "mikir", label: "Bikin mikir" },
              { id: "adrenalin", label: "Adrenalin" },
              { id: "drama", label: "Drama" },
              { id: "singkat", label: "Di bawah 100 menit" },
            ].map((m) => {
              const active = selectedMood === m.id;
              return (
                <ScalePressable
                  key={m.id}
                  disabled={isSpinning}
                  onPress={() => {
                    setSelectedMood(m.id);
                    spinRoulette(m.id);
                  }}
                  style={[s.moodChip, active && s.moodChipActive]}
                >
                  <Text style={[s.moodChipText, active && s.moodChipTextActive]}>
                    {m.label}
                  </Text>
                </ScalePressable>
              );
            })}
          </View>

          {/* Sliding Cards Reel Viewport */}
          <View
            style={s.reelViewport}
            onLayout={(e) => {
              const w = e.nativeEvent.layout.width;
              if (w > 0) setContainerWidth(w);
            }}
          >
            {/* Edge fade gradients */}
            <LinearGradient
              colors={[THEME.bgSecondary, "rgba(21, 34, 50, 0)"]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              pointerEvents="none"
              style={s.edgeFadeLeft}
            />
            <LinearGradient
              colors={["rgba(21, 34, 50, 0)", THEME.bgSecondary]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              pointerEvents="none"
              style={s.edgeFadeRight}
            />

            {/* Target Alignment Indicator (Center Selector Frame) */}
            <View pointerEvents="none" style={s.targetCenterBox}>
              <View style={s.targetArrowTop} />
              <View style={s.targetArrowBottom} />
            </View>

            {/* Moving Reel Track of Cards */}
            <Animated.View
              style={[
                s.reelTrack,
                {
                  transform: [{ translateX }],
                },
              ]}
            >
              {(reelItems.length > 0 ? reelItems : [pickedItem || catalog[0]]).map(
                (item, idx) => {
                  if (!item) return null;
                  const isWinner = !isSpinning && idx === WINNER_INDEX;
                  return (
                    <View
                      key={`${item.id}-${idx}`}
                      style={[
                        s.reelCard,
                        isWinner && s.reelCardWinner,
                      ]}
                    >
                      <Artwork item={item} style={s.reelArtwork}>
                        <LinearGradient
                          colors={["transparent", "rgba(13, 23, 36, 0.75)", THEME.bg]}
                          style={StyleSheet.absoluteFill}
                        />
                        <View style={s.reelTopRow}>
                          <View style={s.reelTypeBadge}>
                            <Text style={s.reelTypeBadgeText}>
                              {(item.type || "film").toUpperCase()}
                            </Text>
                          </View>
                          <View style={s.reelRatingBadge}>
                            <Icon name="star" size={10} color={THEME.star} />
                            <Text style={s.reelRatingBadgeText}>{item.rating}</Text>
                          </View>
                        </View>
                        <View style={s.reelBottomTitle}>
                          <Text numberOfLines={1} style={s.reelCardTitleText}>
                            {item.title}
                          </Text>
                        </View>
                      </Artwork>
                    </View>
                  );
                },
              )}
            </Animated.View>
          </View>

          {/* Winner Details Panel */}
          {isSpinning ? (
            <View style={[s.infoBox, s.spinningInfo]} accessibilityLiveRegion="polite" accessibilityState={{ busy: true }}>
              <ActivityIndicator color={THEME.accentSoft} />
              <Text style={s.itemTitle}>Mengacak tontonan...</Text>
              <Text style={s.itemMeta}>Detail akan muncul setelah pilihan berhenti.</Text>
            </View>
          ) : pickedItem ? (
            <Animated.View
              style={[
                s.infoBox,
                { transform: [{ scale: pulseAnim }] },
              ]}
            >
              <View style={s.infoTitleRow}>
                <Text numberOfLines={1} style={s.itemTitle}>
                  {pickedItem.title}
                </Text>
                {!isSpinning && (
                  <View style={s.ratingBadgeBig}>
                    <Icon name="star" size={14} color={THEME.star} />
                    <Text style={s.ratingBadgeBigText}>
                      {pickedItem.rating}
                      <Text style={{ fontSize: 11, color: THEME.textMuted }}>/10</Text>
                    </Text>
                  </View>
                )}
              </View>

              <Text style={s.itemMeta}>
                {pickedItem.year}  ·  {pickedItem.genre}  ·  {pickedItem.duration}
              </Text>

              <Text numberOfLines={2} style={s.itemTagline}>
                "{pickedItem.tagline || pickedItem.synopsis}"
              </Text>

              {/* Match reason */}
              <View style={s.reasonBox}>
                <Icon name="sparkles" size={14} color={THEME.accentSoft} />
                <Text style={s.reasonText}>
                  {moodReasons[selectedMood] || moodReasons.all}
                </Text>
              </View>
            </Animated.View>
          ) : null}

          {/* Action CTAs */}
          <View style={s.actionRow}>
            <ScalePressable
              disabled={isSpinning}
              onPress={() => spinRoulette()}
              style={s.rerollBtn}
              accessibilityLabel="Putar roulette lagi"
              containerStyle={{ flex: 1 }}
            >
              <Icon name="dice-outline" size={17} color="white" />
              <Text style={s.rerollBtnText}>
                {isSpinning ? "Mengacak..." : "Putar Lagi"}
              </Text>
            </ScalePressable>

            <ScalePressable
              disabled={isSpinning || !pickedItem}
              onPress={() => {
                onClose();
                if (pickedItem) onOpenDetail(pickedItem);
              }}
              style={s.detailBtn}
              accessibilityLabel="Lihat detail film terpilih"
              containerStyle={{ flex: 1 }}
            >
              <Icon name="information-circle-outline" size={17} color="white" />
              <Text style={s.detailBtnText}>Lihat Detail</Text>
            </ScalePressable>
          </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalCard: {
    width: "100%",
    maxWidth: 500,
    backgroundColor: THEME.bgSecondary,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: THEME.pixelBorder,
    shadowColor: "#000",
    shadowOpacity: 0.28,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
    overflow: "hidden",
  },
  modalContent: { padding: 20, gap: 14 },
  spinningInfo: { minHeight: 150, alignItems: "center", justifyContent: "center", gap: 12 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "800",
  },
  closeBtn: {
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  moodChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  moodChip: {
    minHeight: 44,
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  moodChipActive: {
    backgroundColor: THEME.accentDark,
    borderColor: THEME.accent,
  },
  moodChipText: {
    color: THEME.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  moodChipTextActive: {
    color: "white",
  },

  // Reel Viewport
  reelViewport: {
    width: "100%",
    height: 206,
    borderRadius: 18,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    overflow: "hidden",
    justifyContent: "center",
    position: "relative",
  },
  edgeFadeLeft: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 38,
    zIndex: 5,
  },
  edgeFadeRight: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 38,
    zIndex: 5,
  },
  targetCenterBox: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: "50%",
    width: CARD_WIDTH + 6,
    marginLeft: -(CARD_WIDTH + 6) / 2,
    borderWidth: 2,
    borderColor: "rgba(184, 61, 74, 0.65)",
    borderRadius: 16,
    zIndex: 4,
    shadowColor: THEME.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 10,
  },
  targetArrowTop: {
    position: "absolute",
    top: -2,
    alignSelf: "center",
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: THEME.accent,
  },
  targetArrowBottom: {
    position: "absolute",
    bottom: -2,
    alignSelf: "center",
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 6,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: THEME.accent,
  },
  reelTrack: {
    flexDirection: "row",
    alignItems: "center",
    height: 196,
  },
  reelCard: {
    width: CARD_WIDTH,
    height: 186,
    marginRight: CARD_GAP,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.12)",
    backgroundColor: THEME.bgElevated,
  },
  reelCardWinner: {
    borderColor: THEME.accent,
    borderWidth: 2,
    shadowColor: THEME.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0,
    shadowRadius: 12,
  },
  reelArtwork: {
    width: "100%",
    height: "100%",
    justifyContent: "space-between",
    padding: 10,
  },
  reelTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reelTypeBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 5,
    backgroundColor: "rgba(0,0,0,0.65)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  reelTypeBadgeText: {
    color: "white",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  reelRatingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 5,
    backgroundColor: "rgba(0,0,0,0.65)",
  },
  reelRatingBadgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "700",
  },
  reelBottomTitle: {
    paddingBottom: 2,
  },
  reelCardTitleText: {
    color: "white",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: -0.2,
  },

  // Info Box Below
  infoBox: {
    minHeight: 150,
    padding: 14,
    borderRadius: 18,
    backgroundColor: THEME.bgElevated,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    gap: 6,
  },
  infoTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  itemTitle: {
    flexShrink: 1,
    color: "white",
    fontSize: 18,
    fontWeight: "800",
  },
  ratingBadgeBig: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingBadgeBigText: {
    color: "white",
    fontSize: 16,
    fontWeight: "800",
  },
  itemMeta: {
    color: THEME.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  itemTagline: {
    color: THEME.textMuted,
    fontSize: 12,
    fontStyle: "italic",
    lineHeight: 18,
  },
  reasonBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
    padding: 10,
    borderRadius: 12,
    backgroundColor: "rgba(184, 61, 74, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(184, 61, 74, 0.2)",
  },
  reasonText: {
    flex: 1,
    color: THEME.accentSoft,
    fontSize: 11,
    fontWeight: "600",
    lineHeight: 16,
  },

  // Actions
  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  rerollBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  rerollBtnText: {
    color: "white",
    fontSize: 13,
    fontWeight: "700",
  },
  detailBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: THEME.accent,
  },
  detailBtnText: {
    color: "white",
    fontSize: 13,
    fontWeight: "700",
  },
});
