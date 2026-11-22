import React, { createContext, useContext, useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

const ReducedMotionContext = createContext(true);

// One OS preference listener for all press feedback and screen transitions.
export function MotionProvider({ children }) {
  const [reducedMotion, setReducedMotion] = useState(true);
  useEffect(() => {
    let active = true;
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", value => {
      if (active) setReducedMotion(value);
    });
    AccessibilityInfo.isReduceMotionEnabled().then(value => {
      if (active) setReducedMotion(value);
    }).catch(() => {});
    return () => { active = false; subscription.remove(); };
  }, []);
  return <ReducedMotionContext.Provider value={reducedMotion}>{children}</ReducedMotionContext.Provider>;
}

export const useReducedMotion = () => useContext(ReducedMotionContext);
