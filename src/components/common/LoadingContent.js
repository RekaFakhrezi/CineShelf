import React from "react";
import { View, StyleSheet } from "react-native";
import { Skeleton } from "./Skeleton";
// Keep the real text's dimensions, including wrapping, while drawing its placeholder.
export function LoadingContent({ loading, children }) {
  if (!loading) return children;
  return <View style={{ position: "relative" }}><View style={{ opacity: 0 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">{children}</View>
    <Skeleton width="100%" height="100%" borderRadius={4} style={StyleSheet.absoluteFill} />
  </View>;
}
