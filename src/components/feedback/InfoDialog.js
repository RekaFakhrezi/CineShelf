import React from "react";
import { View, Text, Modal, StyleSheet } from "react-native";
import { THEME } from "../../constants/theme";
import { Icon } from "../common/Icon";
import { Button } from "../common/Button";
import { ScalePressable } from "../common/ScalePressable";

export function InfoDialog({ dialog, onClose }) {
  return (
    <Modal
      visible={!!dialog}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={s.modalBackdrop}>
        <View style={s.modalCardBox}>
          <View style={s.modalHeaderRow}>
            <Icon name="information-circle" size={28} color={THEME.accent} />
            <ScalePressable
              onPress={onClose}
              accessibilityLabel="Tutup dialog"
            >
              <Icon name="close" size={22} color={THEME.textSecondary} />
            </ScalePressable>
          </View>
          <Text style={s.modalTitleText}>{dialog?.title}</Text>
          <Text style={s.modalSubText}>{dialog?.body}</Text>
          <View style={{ marginTop: 18 }}>
            <Button label="Mengerti" icon="checkmark" onPress={onClose} />
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
});

