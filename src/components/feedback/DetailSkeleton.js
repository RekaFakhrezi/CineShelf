import React from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { Skeleton } from "../common/Skeleton";

export function DetailSkeleton({
  contentTopPadding = 78,
  contentBottomPadding = 94,
}) {
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingTop: contentTopPadding,
        paddingBottom: contentBottomPadding,
      }}
    >
      {/* Artwork Hero Skeleton */}
      <View style={s.detailArtworkSkeleton}>
        <Skeleton width={38} height={38} borderRadius={19} />
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Skeleton width={120} height={10} borderRadius={5} />
            <Skeleton width={50} height={20} borderRadius={10} />
          </View>
          <Skeleton width="75%" height={32} borderRadius={8} />
        </View>
      </View>

      {/* Body Skeleton */}
      <View style={s.detailBodySkeleton}>
        {/* Meta Pills */}
        <View style={s.metaRowSkeleton}>
          <Skeleton width={70} height={24} borderRadius={7} />
          <Skeleton width={48} height={24} borderRadius={7} />
          <Skeleton width={42} height={24} borderRadius={7} />
          <Skeleton width={64} height={24} borderRadius={7} />
        </View>

        {/* Tagline */}
        <Skeleton width="85%" height={16} borderRadius={6} style={{ marginVertical: 14 }} />

        {/* Action Row */}
        <View style={s.actionRowSkeleton}>
          <Skeleton width="100%" height={46} borderRadius={999} />
        </View>

        {/* Synopsis Section */}
        <View style={{ marginBottom: 20 }}>
          <Skeleton width={100} height={16} borderRadius={5} style={{ marginBottom: 10 }} />
          <Skeleton width="100%" height={13} borderRadius={4} style={{ marginBottom: 6 }} />
          <Skeleton width="96%" height={13} borderRadius={4} style={{ marginBottom: 6 }} />
          <Skeleton width="70%" height={13} borderRadius={4} />
        </View>

        {/* Credits Card */}
        <View style={s.creditsCardSkeleton}>
          <Skeleton width="80%" height={14} borderRadius={5} />
          <Skeleton width="60%" height={14} borderRadius={5} />
        </View>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  detailArtworkSkeleton: {
    height: 360,
    backgroundColor: "#141624",
    padding: 20,
    justifyContent: "space-between",
  },
  detailBodySkeleton: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  metaRowSkeleton: {
    flexDirection: "row",
    gap: 8,
  },
  actionRowSkeleton: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
  },
  creditsCardSkeleton: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 18,
    padding: 16,
    gap: 12,
    marginBottom: 24,
  },
});

