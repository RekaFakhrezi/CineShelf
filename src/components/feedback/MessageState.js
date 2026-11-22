import React from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { THEME } from "../../constants/theme";
import { Icon } from "../common/Icon";
import { Button } from "../common/Button";

export function MessageState({ message, retry, loading = false, openSettings }) {
  return (
    <View style={s.emptyBox}>
      <View style={s.emptyIconContainer}>
        {loading ? (
          <ActivityIndicator size="large" color={THEME.accent} />
        ) : (
          <Icon name="cloud-offline-outline" size={38} color={THEME.accent} />
        )}
      </View>
      <Text style={s.emptyTitleText}>
        {loading ? "Menghubungkan ke Server..." : "Katalog Belum Tersedia"}
      </Text>
      <Text style={s.emptyDescText}>{message}</Text>
      {!loading && (
        <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
          {retry && <Button label="Coba Lagi" icon="refresh" onPress={retry} />}
          {openSettings && (
            <Button
              label="Pengaturan"
              icon="settings-outline"
              secondary
              onPress={openSettings}
            />
          )}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  emptyBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 24,
    gap: 12,
  },
  emptyIconContainer: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: "rgba(184, 61, 74, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitleText: {
    color: "white",
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  emptyDescText: {
    color: THEME.textSecondary,
    fontSize: 13,
    textAlign: "center",
    maxWidth: 320,
    lineHeight: 20,
  },
});

