import React, { useEffect, useRef } from "react";
import { Animated, Pressable } from "react-native";
import { useReducedMotion } from "../../hooks/useReducedMotion";

export function ScalePressable({ onPress, style, containerStyle, children, disabled = false,
  accessibilityRole = "button", accessibilityLabel, accessibilityState, hitSlop, scaleTo = 0.98 }) {
  const reducedMotion = useReducedMotion();
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (reducedMotion || disabled) { scale.stopAnimation(); scale.setValue(1); }
    return () => scale.stopAnimation();
  }, [reducedMotion, disabled, scale]);
  const animatePress = pressed => {
    scale.stopAnimation();
    if (reducedMotion) { scale.setValue(1); return; }
    Animated.timing(scale, { toValue: pressed ? scaleTo : 1, duration: pressed ? 70 : 120, useNativeDriver: true }).start();
  };
  return <Animated.View style={[containerStyle, { transform: [{ scale }] }]}>
    <Pressable onPress={onPress} disabled={disabled} onPressIn={() => animatePress(true)} onPressOut={() => animatePress(false)}
      hitSlop={hitSlop} accessibilityRole={accessibilityRole} accessibilityLabel={accessibilityLabel}
      accessibilityState={{ ...accessibilityState, disabled }}
      style={({ pressed }) => [typeof style === "function" ? style({ pressed }) : style,
        { opacity: disabled ? 0.45 : pressed ? 0.82 : 1 }]}>{children}</Pressable>
  </Animated.View>;
}
