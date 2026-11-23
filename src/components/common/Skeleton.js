import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet } from "react-native";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { THEME } from "../../constants/theme";

export function Skeleton({
  width = "100%",
  height = 20,
  borderRadius = 8,
  style,
}) {
  const reducedMotion = useReducedMotion();
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (reducedMotion) { pulseAnim.setValue(0.45); return; }
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.7,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim, reducedMotion]);

  return (
    <Animated.View
      style={[
        s.skeletonBase,
        {
          width,
          height,
          borderRadius,
          opacity: pulseAnim,
        },
        style,
      ]}
    />
  );
}

const s = StyleSheet.create({
  skeletonBase: {
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
  },
});

