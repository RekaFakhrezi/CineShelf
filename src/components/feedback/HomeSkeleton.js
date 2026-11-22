import React from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { THEME } from "../../constants/theme";
import { Skeleton } from "../common/Skeleton";

export function HomeSkeleton({ contentTopPadding = 78, contentBottomPadding = 94 }) {
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingTop: 0,
        paddingBottom: contentBottomPadding,
      }}
    >
      {/* Hero Banner Skeleton */}
      <View style={s.heroSkeletonContainer}>
        {/* Dark cinematic backdrop with gradient */}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: "#12141F" }]}>
          <LinearGradient
            colors={[
              "rgba(13, 23, 36, 0.3)",
              "rgba(13, 23, 36, 0.6)",
              "rgba(13, 23, 36, 0.95)",
              THEME.bg,
            ]}
            locations={[0, 0.45, 0.85, 1.0]}
            style={StyleSheet.absoluteFill}
          />
        </View>

        {/* Hero Bottom Inner Content Skeleton */}
        <View style={[s.heroInnerSkeleton, { paddingTop: contentTopPadding + 14 }]}>
          <Skeleton width={140} height={10} borderRadius={5} style={{ marginBottom: 4 }} />

          {/* Title & Rating Row Skeleton */}
          <View style={s.heroTitleRowSkeleton}>
            <Skeleton width="64%" height={32} borderRadius={8} />
            <Skeleton width={70} height={26} borderRadius={6} />
          </View>

          {/* Tagline Skeleton */}
          <Skeleton width="82%" height={14} borderRadius={6} style={{ marginTop: 6 }} />

          {/* Meta Pills Row Skeleton */}
          <View style={s.metaPillsRowSkeleton}>
            <Skeleton width={50} height={22} borderRadius={7} />
            <Skeleton width={42} height={22} borderRadius={7} />
            <Skeleton width={80} height={22} borderRadius={7} />
            <Skeleton width={60} height={22} borderRadius={7} />
          </View>

          {/* Action CTA Buttons Skeleton */}
          <View style={s.actionRowSkeleton}>
            <Skeleton width="54%" height={46} borderRadius={999} />
            <Skeleton width="42%" height={46} borderRadius={999} />
          </View>

          {/* Centered Dots Skeleton */}
          <View style={s.dotsRowSkeleton}>
            <Skeleton width={24} height={5} borderRadius={3} style={{ backgroundColor: THEME.accent }} />
            <Skeleton width={6} height={5} borderRadius={3} />
            <Skeleton width={6} height={5} borderRadius={3} />
            <Skeleton width={6} height={5} borderRadius={3} />
            <Skeleton width={6} height={5} borderRadius={3} />
          </View>
        </View>
      </View>

      {/* Movies Shelf Skeleton */}
      <View style={s.shelfSkeletonBox}>
        <View style={s.shelfHeaderSkeleton}>
          <Skeleton width={190} height={18} borderRadius={6} />
          <Skeleton width={70} height={14} borderRadius={5} />
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.shelfScrollSkeleton}
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <View key={i} style={{ width: 145 }}>
              <Skeleton width={145} height={215} borderRadius={20} />
              <Skeleton width={110} height={13} borderRadius={5} style={{ marginTop: 8 }} />
              <Skeleton width={75} height={11} borderRadius={4} style={{ marginTop: 5 }} />
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Spotlight Card Skeleton */}
      <View style={s.spotlightSkeleton}>
        <Skeleton width={42} height={42} borderRadius={14} />
        <View style={{ flex: 1, gap: 6 }}>
          <Skeleton width="60%" height={14} borderRadius={5} />
          <Skeleton width="90%" height={11} borderRadius={4} />
        </View>
        <Skeleton width={32} height={32} borderRadius={16} />
      </View>

      {/* Series Shelf Skeleton */}
      <View style={s.shelfSkeletonBox}>
        <View style={s.shelfHeaderSkeleton}>
          <Skeleton width={175} height={18} borderRadius={6} />
          <Skeleton width={70} height={14} borderRadius={5} />
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.shelfScrollSkeleton}
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <View key={i} style={{ width: 145 }}>
              <Skeleton width={145} height={215} borderRadius={20} />
              <Skeleton width={110} height={13} borderRadius={5} style={{ marginTop: 8 }} />
              <Skeleton width={75} height={11} borderRadius={4} style={{ marginTop: 5 }} />
            </View>
          ))}
        </ScrollView>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  heroSkeletonContainer: {
    width: "100%",
    minHeight: 490,
    position: "relative",
    justifyContent: "flex-end",
    marginBottom: 8,
  },
  heroInnerSkeleton: {
    paddingHorizontal: 20,
    paddingBottom: 22,
    gap: 8,
    zIndex: 2,
  },
  heroTitleRowSkeleton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  metaPillsRowSkeleton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginVertical: 4,
  },
  actionRowSkeleton: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  dotsRowSkeleton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 14,
    paddingTop: 4,
  },
  shelfSkeletonBox: {
    marginTop: 24,
  },
  shelfHeaderSkeleton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  shelfScrollSkeleton: {
    paddingHorizontal: 20,
    gap: 14,
  },
  spotlightSkeleton: {
    marginHorizontal: 16,
    marginTop: 28,
    borderRadius: 22,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
  },
});

