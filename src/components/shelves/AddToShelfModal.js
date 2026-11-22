import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  ScrollView,
  StyleSheet,
  Platform,
} from "react-native";
import { shelfIconName } from "../../constants/shelfIcons";
import { THEME } from "../../constants/theme";
import { Icon } from "../common/Icon";
import { ScalePressable } from "../common/ScalePressable";
import { Artwork } from "../common/Artwork";
import { DotPatternBackground, TechKicker, HalftoneCornerDeco } from "../common/DitherAccent";

export function AddToShelfModal({
  visible,
  onClose,
  item,
  saved = [],
  shelves = [],
  onApplyShelves,
  onRemoveFromWatchlist,
  onOpenCreateShelf,
}) {
  const [selectedShelfIds, setSelectedShelfIds] = useState([]);
  const [inWatchlist, setInWatchlist] = useState(true);

  // Initialize selections when modal opens for item
  useEffect(() => {
    if (visible && item) {
      const isCurrentlySaved = saved.includes(item.id);
      setInWatchlist(isCurrentlySaved || true); // Default true when opening save modal
      const shelfIds = shelves
        .filter((s) => !s.isDefault && (s.items || []).includes(item.id))
        .map((s) => s.id);
      setSelectedShelfIds(shelfIds);
    }
  }, [visible, item, saved, shelves]);

  if (!item) return null;

  const toggleShelf = (shelfId) => {
    setSelectedShelfIds((prev) =>
      prev.includes(shelfId)
        ? prev.filter((id) => id !== shelfId)
        : [...prev, shelfId],
    );
    // If selecting any custom shelf, ensure Watchlist is also checked
    setInWatchlist(true);
  };

  const handleSave = () => {
    onApplyShelves(item, selectedShelfIds, inWatchlist);
    onClose();
  };

  const handleRemove = () => {
    onRemoveFromWatchlist(item);
    onClose();
  };

  const isAlreadySaved = saved.includes(item.id);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={s.backdrop}>
        <ScalePressable
          onPress={onClose}
          style={StyleSheet.absoluteFill}
          accessibilityLabel="Tutup dialog"
        />

        <View style={s.bottomSheet}>
          
          

          {/* Grab Handle */}
          <View style={s.grabHandle} />

          {/* Header with Title and Thumbnail */}
          <View style={s.headerRow}>
            <View style={{ gap: 2, flex: 1 }}>
              
              <Text numberOfLines={1} style={s.title}>
                Simpan ke Rak
              </Text>
            </View>
            <ScalePressable onPress={onClose} style={s.closeBtn}>
              <Icon name="close" size={18} color="white" />
            </ScalePressable>
          </View>

          {/* Item Preview Strip */}
          <View style={s.itemStrip}>
            <Artwork item={item} style={s.itemThumb} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text numberOfLines={1} style={s.itemStripTitle}>
                {item.title}
              </Text>
              <Text style={s.itemStripSub}>
                {(item.type || "film").toUpperCase()} · {item.genre} · ★ {item.rating}
              </Text>
            </View>
          </View>

          {/* Shelves List */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.listContent}
          >
            {/* 1. Watchlist Utama (Semua) */}
            <ScalePressable
              onPress={() => setInWatchlist((v) => !v)}
              style={[s.shelfItemRow, inWatchlist && s.shelfItemRowActive]}
            >
              <View style={s.shelfIconBox}>
                <Icon name="albums-outline" size={20} color={THEME.textSecondary} />
              </View>

              <View style={{ flex: 1, gap: 2 }}>
                <Text style={s.shelfTitleText}>Watchlist Utama (Semua)</Text>
                <Text style={s.shelfCountText}>
                  Tersimpan di daftar tontonan utama
                </Text>
              </View>

              <View
                style={[s.checkboxCircle, inWatchlist && s.checkboxCircleActive]}
              >
                {inWatchlist && (
                  <Icon name="checkmark" size={14} color="white" />
                )}
              </View>
            </ScalePressable>

            {/* 2. Custom Thematic Shelves */}
            {shelves
              .filter((s) => !s.isDefault)
              .map((shelf) => {
                const isChecked = selectedShelfIds.includes(shelf.id);
                return (
                  <ScalePressable
                    key={shelf.id}
                    onPress={() => toggleShelf(shelf.id)}
                    style={[s.shelfItemRow, isChecked && s.shelfItemRowActive]}
                  >
                    <View style={s.shelfIconBox}>
                      <Icon name={shelfIconName(shelf.icon)} size={20} color={THEME.textSecondary} />
                    </View>

                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={s.shelfTitleText}>{shelf.name}</Text>
                      <Text style={s.shelfCountText}>
                        {(shelf.items || []).length} judul tersimpan
                      </Text>
                    </View>

                    <View
                      style={[
                        s.checkboxCircle,
                        isChecked && s.checkboxCircleActive,
                      ]}
                    >
                      {isChecked && (
                        <Icon name="checkmark" size={14} color="white" />
                      )}
                    </View>
                  </ScalePressable>
                );
              })}

            {/* Create New Shelf Button */}
            <ScalePressable
              onPress={() => {
                onClose();
                onOpenCreateShelf();
              }}
              style={s.addNewShelfBtn}
            >
              <Icon name="add-circle-outline" size={18} color={THEME.accentSoft} />
              <Text style={s.addNewShelfText}>+ Buat Rak Tematik Baru</Text>
            </ScalePressable>
          </ScrollView>

          {/* Action CTAs */}
          <View style={s.actionsRow}>
            {isAlreadySaved && (
              <View style={s.removeCol}>
                <ScalePressable
                  onPress={handleRemove}
                  style={s.removeBtn}
                  accessibilityLabel="Hapus dari Watchlist"
                >
                  <Icon name="trash-outline" size={16} color="#FF5A6E" />
                  <Text style={s.removeBtnText}>Hapus</Text>
                </ScalePressable>
              </View>
            )}

            <View style={s.saveCol}>
              <ScalePressable
                onPress={handleSave}
                style={s.saveBtn}
                accessibilityLabel="Simpan pilihan rak"
              >
                <Icon name="bookmark" size={16} color="white" />
                <Text style={s.saveBtnText}>Simpan ke Rak</Text>
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
    backgroundColor: "rgba(0,0,0,0.78)",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  bottomSheet: {
    width: "100%",
    maxWidth: 540,
    backgroundColor: "#121422",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: THEME.pixelBorder,
    padding: 22,
    gap: 14,
    overflow: "hidden",
  },
  grabHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignSelf: "center",
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
  itemStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 10,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  itemThumb: {
    width: 38,
    height: 48,
    borderRadius: 8,
  },
  itemStripTitle: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
  },
  itemStripSub: {
    color: THEME.textMuted,
    fontSize: 11,
  },
  listContent: {
    gap: 9,
    paddingVertical: 4,
  },
  shelfItemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 12,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  shelfItemRowActive: {
    backgroundColor: THEME.accentDark,
    borderColor: "rgba(184, 61, 74, 0.4)",
  },
  shelfIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    justifyContent: "center",
    alignItems: "center",
  },
  shelfEmoji: {
    fontSize: 18,
  },
  shelfTitleText: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
  },
  shelfCountText: {
    color: THEME.textMuted,
    fontSize: 11,
  },
  checkboxCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxCircleActive: {
    backgroundColor: THEME.accent,
    borderColor: THEME.accent,
  },
  addNewShelfBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(184, 61, 74, 0.4)",
    backgroundColor: "rgba(184, 61, 74, 0.05)",
    justifyContent: "center",
    marginTop: 2,
  },
  addNewShelfText: {
    color: THEME.accentSoft,
    fontSize: 13,
    fontWeight: "700",
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 6,
  },
  removeCol: {
    flex: 1,
  },
  saveCol: {
    flex: 2,
  },
  removeBtn: {
    width: "100%",
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 14,
    backgroundColor: "rgba(255, 90, 110, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(255, 90, 110, 0.3)",
  },
  removeBtnText: {
    color: "#FF5A6E",
    fontSize: 13,
    fontWeight: "700",
  },
  saveBtn: {
    width: "100%",
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    backgroundColor: THEME.accent,
  },
  saveBtnText: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
  },
});
