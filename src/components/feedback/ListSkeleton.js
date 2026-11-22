import React from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { Skeleton } from "../common/Skeleton";

export function ListSkeleton({
  columns = 2,
  gridWidth = 160,
  contentTopPadding = 78,
  contentBottomPadding = 94,
}) {
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        s.listSkeletonContainer,
        {
          paddingTop: contentTopPadding,
          paddingBottom: contentBottomPadding,
        },
      ]}
    >
      {/* Header Skeleton */}
      <View style={s.headerBoxSkeleton}>
        <Skeleton width={130} height={10} borderRadius={5} style={{ marginBottom: 6 }} />
        <Skeleton width="60%" height={28} borderRadius={8} style={{ marginBottom: 6 }} />
        <Skeleton width="80%" height={12} borderRadius={5} />

        {/* Search Bar Skeleton */}
        <Skeleton width="100%" height={46} borderRadius={18} style={{ marginTop: 16 }} />

        {/* Genre Chips Skeleton */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.genreChipsSkeleton}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} width={i === 0 ? 65 : 75} height={32} borderRadius={20} />
          ))}
        </ScrollView>

        {/* Result Meta Row */}
        <Skeleton width={140} height={11} borderRadius={4} style={{ marginBottom: 16 }} />
      </View>

      {/* Grid Poster Skeletons */}
      <View style={s.gridRowSkeleton}>
        {Array.from({ length: columns * 3 }).map((_, i) => (
          <View key={i} style={{ width: gridWidth, marginBottom: 20 }}>
            <Skeleton width={gridWidth} height={gridWidth * 1.48} borderRadius={20} />
            <Skeleton width={gridWidth * 0.75} height={13} borderRadius={5} style={{ marginTop: 8 }} />
            <Skeleton width={gridWidth * 0.5} height={11} borderRadius={4} style={{ marginTop: 5 }} />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  listSkeletonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  headerBoxSkeleton: {
    paddingTop: 6,
    marginBottom: 8,
  },
  genreChipsSkeleton: {
    paddingVertical: 12,
    gap: 8,
  },
  gridRowSkeleton: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 14,
  },
});

