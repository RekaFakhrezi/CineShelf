import React from "react";
import { Ionicons } from "@expo/vector-icons";

export function Icon({ name, size = 20, color = "white" }) {
  return <Ionicons name={name} size={size} color={color} />;
}

