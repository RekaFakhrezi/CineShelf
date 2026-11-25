import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { THEME } from "../constants/theme";
import { Icon } from "../components/common/Icon";
import { Button } from "../components/common/Button";
import appConfig from "../../app.json";

export function ProfileScreen({
  profileScrollRef,
  savedCount = 0,
  totalTitles = 0,
  watchedCount = 0,
  shelvesCount = 0,
  isApi,
  connectionUrl,
  openSettings,
  handleScroll,
  contentTopPadding,
  contentBottomPadding,
  user,
  onLogin,
  onLogout,
  loggingOut = false,
  syncStatus = "",
}) {
  const [logoutError, setLogoutError] = useState("");
  const displayName = user
    ? (typeof user.user_metadata?.name === "string" && user.user_metadata.name.trim())
      || user.email?.split("@")[0] || "Akun CineShelf"
    : "Guest";
  const initial = Array.from(displayName)[0].toUpperCase();
  const logout = async () => {
    setLogoutError("");
    try {
      const success = await onLogout();
      if (success === false) setLogoutError("Belum dapat keluar. Periksa koneksi dan coba lagi.");
    } catch (error) {
      setLogoutError(error.message || "Belum dapat keluar. Coba lagi.");
    }
  };
  return (
    <ScrollView
      ref={profileScrollRef}
      showsVerticalScrollIndicator={false}
      onScroll={handleScroll}
      scrollEventThrottle={16}
      contentContainerStyle={[
        s.profileContentBox,
        {
          paddingTop: contentTopPadding,
          paddingBottom: contentBottomPadding,
        },
      ]}
    >
      <View style={s.profileCardBox}>
        <View style={s.profileAvatarLarge}>
          <Text style={s.profileAvatarLargeText}>{initial}</Text>
        </View>
        <Text style={s.profileUserName}>{displayName}</Text>
        <Text style={s.profileUserSub}>{user ? user.email : "Belum login. Masuk untuk menyimpan watchlist dan rakmu."}</Text>

        {/* 4-Item Stats Grid */}
        <View style={s.profileStatsContainer}>
          <View style={s.profileStatItem}>
            <Text style={s.profileStatVal}>{savedCount}</Text>
            <Text style={s.profileStatLabel}>Watchlist</Text>
          </View>
          <View style={s.profileStatDivider} />
          <View style={s.profileStatItem}>
            <Text style={[s.profileStatVal, { color: THEME.green }]}>
              {watchedCount}
            </Text>
            <Text style={s.profileStatLabel}>Ditonton</Text>
          </View>
          <View style={s.profileStatDivider} />
          <View style={s.profileStatItem}>
            <Text style={[s.profileStatVal, { color: THEME.accentSoft }]}>
              {shelvesCount}
            </Text>
            <Text style={s.profileStatLabel}>Rak Tematik</Text>
          </View>
          <View style={s.profileStatDivider} />
          <View style={s.profileStatItem}>
            <Text style={s.profileStatVal}>{totalTitles}</Text>
            <Text style={s.profileStatLabel}>Katalog</Text>
          </View>
        </View>
        {!!syncStatus && (
          <Text style={s.syncStatus} accessibilityLiveRegion="polite">{syncStatus}</Text>
        )}
        {!!logoutError && (
          <Text style={s.logoutError} accessibilityRole="alert">{logoutError}</Text>
        )}
        <View style={s.logoutButton}>
          <Button
            label={user ? loggingOut ? "Sedang keluar…" : "Keluar dari akun" : "Masuk / Daftar"}
            icon={user ? "log-out-outline" : "log-in-outline"}
            secondary={!!user}
            disabled={loggingOut}
            onPress={user ? logout : onLogin}
          />
        </View>
      </View>

      <Text style={s.sectionHeaderTitle}>Tentang CineShelf</Text>
      <View style={[s.statusCardBox, { marginBottom: 24, gap: 12 }]}>
        <Text style={s.statusCardTitle}>Katalog film dan serial pribadi</Text>
        <Text style={s.statusCardDesc}>Temukan judul, susun watchlist ke dalam rak, dan catat tontonan serta penilaianmu. Dikembangkan sebagai tugas akhir individu Praktikum Pemrograman Perangkat Bergerak 2026 menggunakan React Native dan API buatan sendiri.</Text>
        <Text style={s.statusCardDesc}>Katalog awal berisi judul fiktif dan ilustrasi Unsplash untuk pembelajaran. Pengguna juga dapat menambahkan film, serial, dan cover ke katalog bersama. Rating awal adalah data contoh; CineShelf tidak menyediakan layanan streaming.</Text>
        <Text style={s.statusCardSubtitle}>Versi {appConfig.expo.version} · React Native / Expo</Text>
        <Text style={s.statusCardSubtitle}>Source: github.com/RekaFakhrezi/CineShelf</Text>
      </View>

      {/* App & Connection Status */}
      <View style={{ marginBottom: 12 }}>
        
      </View>
      <Text style={s.sectionHeaderTitle}>Status & Pengaturan</Text>

      <View style={s.statusCardBox}>
        
        

        <View style={s.statusCardHeader}>
          <View style={s.statusIconCircle}>
            <Icon name="server-outline" size={20} color={THEME.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.statusCardTitle}>Sumber Katalog</Text>
            <Text style={s.statusCardSubtitle}>
              Mode aktif: {isApi ? "CineShelf REST API" : "Demo Data Lokal"}
            </Text>
          </View>
        </View>

        <Text style={s.statusCardDesc}>
          {isApi
            ? `Alamat API: ${connectionUrl}`
            : "Menggunakan data katalog contoh offline tanpa koneksi backend."}
        </Text>

        <View style={{ marginTop: 14 }}>
          <Button
            label="Ganti Sumber / Sambungkan API"
            icon="settings-outline"
            secondary
            onPress={openSettings}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  profileContentBox: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sectionHeaderTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 12,
  },
  profileCardBox: {
    marginTop: 6,
    marginBottom: 24,
    backgroundColor: THEME.bgCard,
    borderColor: THEME.pixelBorder,
    borderWidth: 1,
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
  },
  profileAvatarLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: THEME.accentDark,
    borderColor: THEME.accent,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  profileAvatarLargeText: {
    color: "white",
    fontSize: 30,
    fontWeight: "700",
  },
  profileUserName: {
    color: "white",
    fontSize: 19,
    fontWeight: "800",
    textAlign: "center",
  },
  profileUserSub: {
    color: THEME.textMuted,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
    textAlign: "center",
  },
  syncStatus: {
    color: THEME.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 18,
  },
  logoutError: {
    color: THEME.accentSoft,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 12,
  },
  logoutButton: {
    width: "100%",
    marginTop: 16,
  },
  profileStatsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 20,
    width: "100%",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
  },
  profileStatItem: {
    flex: 1,
    alignItems: "center",
  },
  profileStatVal: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
    
  },
  profileStatLabel: {
    color: THEME.textMuted,
    fontSize: 11,
    marginTop: 2,
    fontWeight: "600",
  },
  profileStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  statusCardBox: {
    backgroundColor: THEME.bgCard,
    borderColor: THEME.pixelBorder,
    borderWidth: 1,
    borderRadius: 12,
    padding: 20,
    position: "relative",
    overflow: "hidden",
  },
  statusCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 10,
  },
  statusIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(184, 61, 74, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(184, 61, 74, 0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  statusCardTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "800",
  },
  statusCardSubtitle: {
    color: THEME.textSecondary,
    fontSize: 12,
  },
  statusCardDesc: {
    color: THEME.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
});
