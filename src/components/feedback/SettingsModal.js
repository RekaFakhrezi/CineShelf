import React from "react";
import { View, Text, TextInput, Modal, Platform, StyleSheet } from "react-native";
import { THEME } from "../../constants/theme";
import { Icon } from "../common/Icon";
import { Button } from "../common/Button";
import { ScalePressable } from "../common/ScalePressable";

export function SettingsModal({
  visible,
  onClose,
  checking,
  urlDraft,
  setUrlDraft,
  connectionError,
  onSaveConnection,
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!checking) onClose();
      }}
    >
      <View style={s.modalBackdrop}>
        <View style={s.modalCardBox}>
          <View style={s.modalHeaderRow}>
            <Text style={s.modalTitleText}>Sumber Katalog</Text>
            <ScalePressable
              onPress={() => !checking && onClose()}
              accessibilityLabel="Tutup dialog"
            >
              <Icon name="close" size={22} color={THEME.textSecondary} />
            </ScalePressable>
          </View>
          <Text style={s.modalSubText}>
            Pilih katalog API atau katalog contoh lokal. Login dan penyimpanan
            rak tetap membutuhkan backend Supabase yang terhubung.
          </Text>

          <TextInput
            accessibilityLabel="Alamat CineShelf API"
            value={urlDraft}
            onChangeText={setUrlDraft}
            editable={!checking}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            placeholder="http://192.168.1.10:5002/api"
            placeholderTextColor={THEME.textMuted}
            style={s.modalInput}
          />

          {connectionError !== "" && (
            <Text style={s.modalErrorText}>{connectionError}</Text>
          )}

          <View style={{ gap: 10, marginTop: 18 }}>
            <Button
              label={checking ? "Menghubungkan..." : "Uji & Hubungkan ke API"}
              icon="link"
              disabled={checking}
              onPress={() => onSaveConnection("api")}
            />
            <Button
              label="Gunakan Katalog Demo"
              icon="eye-outline"
              secondary
              disabled={checking}
              onPress={() => onSaveConnection("demo")}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.78)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  modalCardBox: {
    width: "100%",
    maxWidth: 440,
    backgroundColor: "#161826",
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderWidth: 1,
    borderRadius: 12,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0,
    shadowRadius: 30,
  },
  modalHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  modalTitleText: {
    color: "white",
    fontSize: 20,
    fontWeight: "800",
  },
  modalSubText: {
    color: THEME.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 16,
  },
  modalInput: {
    color: "white",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    ...Platform.select({ web: { outlineStyle: "none" } }),
  },
  modalErrorText: {
    color: "#FFA0AC",
    fontSize: 12,
    marginTop: 8,
  },
});

