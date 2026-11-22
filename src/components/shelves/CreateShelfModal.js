import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Modal,
  StyleSheet,
  Platform,
} from "react-native";
import { SHELF_ICONS } from "../../constants/shelfIcons";
import { THEME } from "../../constants/theme";
import { Icon } from "../common/Icon";
import { ScalePressable } from "../common/ScalePressable";
import { DotPatternBackground, TechKicker, HalftoneCornerDeco } from "../common/DitherAccent";

export function CreateShelfModal({ visible, onClose, onCreateShelf }) {
  const [name, setName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("albums-outline");

  const icons = SHELF_ICONS;

  const handleCreate = () => {
    if (!name.trim()) return;
    onCreateShelf(name.trim(), selectedIcon);
    setName("");
    setSelectedIcon("albums-outline");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={s.backdrop}>
        <ScalePressable
          onPress={onClose}
          style={StyleSheet.absoluteFill}
          accessibilityLabel="Tutup dialog"
        />

        <View style={s.modalBox}>
          
          

          {/* Header */}
          <View style={s.headerRow}>
            <View style={{ gap: 2 }}>
              
              <Text style={s.title}>Buat Rak Tematik</Text>
            </View>
            <ScalePressable onPress={onClose} style={s.closeBtn}>
              <Icon name="close" size={18} color="white" />
            </ScalePressable>
          </View>

          {/* Form */}
          <View style={s.formGroup}>
            <Text style={s.label}>Pilih Ikon Rak</Text>
            <View style={s.iconSelectorRow}>
              {icons.map((icon) => {
                const isSelected = selectedIcon === icon.name;
                return (
                  <ScalePressable
                    key={icon.name}
                    onPress={() => setSelectedIcon(icon.name)}
                    accessibilityLabel={icon.label}
                    accessibilityState={{ selected: isSelected }}
                    style={[s.iconChoice, isSelected && s.iconChoiceSelected]}
                  >
                    <Icon name={icon.name} size={22} color={isSelected ? THEME.accentSoft : THEME.textSecondary} />
                  </ScalePressable>
                );
              })}
            </View>
          </View>

          <View style={s.formGroup}>
            <Text style={s.label}>Nama Rak</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="cth. Maraton Akhir Pekan, Comfort Movies..."
              placeholderTextColor={THEME.textMuted}
              style={s.input}
              maxLength={30}
              autoFocus
            />
          </View>

          {/* Actions */}
          <View style={s.actionsRow}>
            <View style={s.cancelCol}>
              <ScalePressable
                onPress={onClose}
                style={s.cancelBtn}
                accessibilityLabel="Batal"
              >
                <Text style={s.cancelText}>Batal</Text>
              </ScalePressable>
            </View>

            <View style={s.submitCol}>
              <ScalePressable
                onPress={handleCreate}
                disabled={!name.trim()}
                style={[s.submitBtn, !name.trim() && s.submitBtnDisabled]}
                accessibilityLabel="Simpan rak tematik baru"
              >
                <Icon name="checkmark" size={16} color="white" />
                <Text style={s.submitText}>Simpan Rak</Text>
              </ScalePressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalBox: {
    width: "100%",
    maxWidth: 440,
    backgroundColor: "#121422",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.pixelBorder,
    padding: 22,
    gap: 18,
    overflow: "hidden",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    color: "white",
    fontSize: 18,
    fontWeight: "800",
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  formGroup: {
    gap: 8,
  },
  label: {
    color: THEME.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  iconSelectorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  iconChoice: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  iconChoiceSelected: {
    backgroundColor: THEME.accentDark,
    borderColor: THEME.accent,
  },
  iconEmoji: {
    fontSize: 18,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "white",
    fontSize: 14,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 8,
  },
  cancelCol: {
    flex: 1,
  },
  submitCol: {
    flex: 1.5,
  },
  cancelBtn: {
    width: "100%",
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.07)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: {
    color: THEME.textSecondary,
    fontSize: 14,
    fontWeight: "700",
  },
  submitBtn: {
    width: "100%",
    height: 48,
    borderRadius: 14,
    backgroundColor: THEME.accent,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 7,
    shadowColor: THEME.accent,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0,
    shadowRadius: 8,
  },
  submitBtnDisabled: {
    backgroundColor: "rgba(184, 61, 74, 0.28)",
    opacity: 0.5,
  },
  submitText: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
  },
});

