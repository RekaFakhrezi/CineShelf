import React, { useState } from "react";
import { View, StyleSheet, ImageBackground } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export function Artwork({ item, style, children }) {
  const [failed, setFailed] = useState(false);
  return (
    <View style={[{ backgroundColor: item.color || "#181A24", overflow: "hidden" }, style]}>
      {!failed && item.image && (
        <ImageBackground
          source={{ uri: item.image }}
          onError={() => setFailed(true)}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
      )}
      <LinearGradient
        colors={[
          "rgba(13, 23, 36, 0)",
          "rgba(13, 23, 36, 0.1)",
          "rgba(13, 23, 36, 0.8)",
        ]}
        locations={[0, 0.6, 1]}
        style={StyleSheet.absoluteFill}
      />
      {children}
    </View>
  );
}

