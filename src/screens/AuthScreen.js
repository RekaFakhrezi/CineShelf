import React, { useRef, useState } from "react";
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView,
  StyleSheet, Text, TextInput, useWindowDimensions, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "../components/common/Button";
import { Icon } from "../components/common/Icon";
import { THEME } from "../constants/theme";

export function AuthScreen({ auth, openSettings }) {
  const [signup, setSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [validation, setValidation] = useState("");
  const passwordInput = useRef(null);
  const insets = useSafeAreaInsets();
  const wide = useWindowDimensions().width >= 820;
  const disabled = auth.busy || !auth.ready;

  const submit = async () => {
    if (disabled) return;
    if (!email.trim() || !password) {
      setValidation("Isi email dan kata sandi terlebih dahulu.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setValidation("Masukkan alamat email yang valid.");
      return;
    }
    if (signup && (!name.trim() || name.trim().length > 80)) {
      setValidation("Isi nama tampilan, maksimal 80 karakter.");
      return;
    }
    if (signup && password.length < 6) {
      setValidation("Gunakan kata sandi minimal 6 karakter.");
      return;
    }
    setValidation("");
    const success = signup
      ? await auth.signup(email, password, name)
      : await auth.login(email, password);
    if (success) setPassword("");
  };

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={[s.scroll, {
          paddingTop: insets.top + 28,
          paddingBottom: insets.bottom + 28,
          paddingLeft: insets.left + 24,
          paddingRight: insets.right + 24,
        }]}
      >
        <View style={[s.layout, wide && s.wideLayout]}>
          <View style={[s.intro, wide && s.wideIntro]}>
            <View style={s.brand}>
              <View style={s.ticket}><Icon name="ticket-outline" size={26} color={THEME.textPrimary} /></View>
              <Text style={s.brandName}>CineShelf</Text>
            </View>
            <Text accessibilityRole="header" style={[s.title, wide && s.wideTitle]}>Rak pribadi, akun sendiri.</Text>
            <Text style={s.description}>Simpan film yang ingin kamu tonton, susun rak, dan catat tontonanmu. Semuanya terhubung ke akunmu.</Text>
            {wide && (
              <View style={s.libraryNote}>
                <Icon name="albums-outline" size={22} color={THEME.accentSoft} />
                <Text style={s.noteText}>Katalog bersama. Watchlist dan rak hanya milikmu.</Text>
              </View>
            )}
          </View>

          <View style={[s.form, wide && s.wideForm]}>
            <View style={s.tabs}>
              {[false, true].map((isSignup) => (
                <Pressable
                  key={String(isSignup)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: signup === isSignup, disabled }}
                  disabled={disabled}
                  onPress={() => { setSignup(isSignup); setValidation(""); }}
                  style={({ pressed }) => [s.tab, signup === isSignup && s.activeTab, pressed && s.pressed]}
                >
                  <Text style={[s.tabText, signup === isSignup && s.activeTabText]}>{isSignup ? "Buat akun" : "Masuk"}</Text>
                </Pressable>
              ))}
            </View>
            <Text accessibilityRole="header" style={s.formTitle}>{signup ? "Mulai koleksi pribadimu" : "Selamat datang kembali"}</Text>
            <Text style={s.formDescription}>{signup ? "Buat akun dengan email dan kata sandi." : "Masuk untuk membuka rak dan watchlist-mu."}</Text>

            {signup && (
              <View style={s.field}>
                <Text style={s.label}>Nama tampilan</Text>
                <TextInput
                  accessibilityLabel="Nama tampilan"
                  style={s.input}
                  placeholder="Nama panggilanmu"
                  placeholderTextColor={THEME.textMuted}
                  value={name}
                  onChangeText={setName}
                  autoComplete="name"
                  textContentType="name"
                  maxLength={80}
                  editable={!disabled}
                />
              </View>
            )}
            <View style={s.field}>
              <Text style={s.label}>Email</Text>
              <TextInput
                accessibilityLabel="Email"
                style={s.input}
                placeholder="nama@email.com"
                placeholderTextColor={THEME.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="next"
                onSubmitEditing={() => passwordInput.current?.focus()}
                editable={!disabled}
              />
            </View>
            <View style={s.field}>
              <Text style={s.label}>Kata sandi</Text>
              <TextInput
                ref={passwordInput}
                accessibilityLabel="Kata sandi"
                style={s.input}
                placeholder={signup ? "Minimal 6 karakter" : "Kata sandi akunmu"}
                placeholderTextColor={THEME.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete={signup ? "new-password" : "current-password"}
                textContentType={signup ? "newPassword" : "password"}
                returnKeyType="go"
                onSubmitEditing={submit}
                editable={!disabled}
              />
            </View>

            {!!(validation || auth.error) && (
              <View style={s.errorBox} accessibilityRole="alert" accessibilityLiveRegion="polite">
                <Icon name="alert-circle-outline" size={20} color={THEME.accentSoft} />
                <Text style={s.errorText}>{validation || auth.error}</Text>
              </View>
            )}
            {!!auth.message && <Text accessibilityLiveRegion="polite" style={s.message}>{auth.message}</Text>}
            {disabled && (
              <View style={s.loading} accessibilityLiveRegion="polite">
                <ActivityIndicator size="small" color={THEME.accentSoft} />
                <Text style={s.loadingText}>{auth.ready ? "Memproses akun…" : "Memulihkan sesi…"}</Text>
              </View>
            )}
            <Button
              label={signup ? "Buat akun" : "Masuk"}
              icon={signup ? "person-add-outline" : "log-in-outline"}
              onPress={submit}
              disabled={disabled}
            />
            {!!auth.error && auth.retry && (
              <Button label="Coba pulihkan sesi" icon="refresh-outline" onPress={auth.retry} secondary disabled={disabled} />
            )}
            <View style={s.settings}>
              <Text style={s.settingsHint}>Belum tersambung ke server yang tepat?</Text>
              <Button label="Atur koneksi API" icon="settings-outline" onPress={openSettings} ghost />
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: THEME.bg },
  scroll: { flexGrow: 1, justifyContent: "center" },
  layout: { width: "100%", maxWidth: 1040, alignSelf: "center", gap: 32 },
  wideLayout: { flexDirection: "row", alignItems: "center", gap: 64 },
  intro: { gap: 18 },
  wideIntro: { flex: 1 },
  brand: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 4 },
  ticket: { width: 46, height: 46, borderRadius: 14, backgroundColor: THEME.accent, justifyContent: "center", alignItems: "center" },
  brandName: { color: THEME.textPrimary, fontSize: 24, fontWeight: "800", letterSpacing: -0.7 },
  title: { color: THEME.textPrimary, fontSize: 38, lineHeight: 44, fontWeight: "800", letterSpacing: -1.4, maxWidth: 450 },
  wideTitle: { fontSize: 54, lineHeight: 60, letterSpacing: -2 },
  description: { color: THEME.textSecondary, fontSize: 16, lineHeight: 25, maxWidth: 420 },
  libraryNote: { flexDirection: "row", alignItems: "center", gap: 12, paddingTop: 24, marginTop: 14, borderTopWidth: 1, borderTopColor: THEME.cardBorder },
  noteText: { color: THEME.textMuted, fontSize: 14, lineHeight: 21, flex: 1 },
  form: { backgroundColor: THEME.bgCard, borderWidth: 1, borderColor: THEME.raisedBorder, borderRadius: 20, padding: 22, gap: 16 },
  wideForm: { width: 420 },
  tabs: { flexDirection: "row", padding: 4, backgroundColor: THEME.bg, borderRadius: 12, marginBottom: 6 },
  tab: { flex: 1, minHeight: 44, justifyContent: "center", alignItems: "center", borderRadius: 9 },
  activeTab: { backgroundColor: THEME.surfaceHighlight },
  tabText: { color: THEME.textMuted, fontWeight: "700", fontSize: 15 },
  activeTabText: { color: THEME.textPrimary },
  pressed: { opacity: 0.7 },
  formTitle: { color: THEME.textPrimary, fontSize: 21, lineHeight: 28, fontWeight: "800" },
  formDescription: { color: THEME.textSecondary, fontSize: 14, lineHeight: 21, marginTop: -10 },
  field: { gap: 8 },
  label: { color: THEME.textPrimary, fontSize: 14, fontWeight: "600" },
  input: { backgroundColor: THEME.bg, borderWidth: 1, borderColor: THEME.raisedBorder, borderRadius: 10, minHeight: 50, paddingHorizontal: 14, paddingVertical: 12, color: THEME.textPrimary, fontSize: 16 },
  errorBox: { flexDirection: "row", alignItems: "flex-start", gap: 9, padding: 12, backgroundColor: THEME.accentGlow, borderRadius: 10 },
  errorText: { flex: 1, color: THEME.accentSoft, fontSize: 14, lineHeight: 21 },
  message: { color: THEME.green, fontSize: 14, lineHeight: 21 },
  loading: { flexDirection: "row", alignItems: "center", gap: 10 },
  loadingText: { color: THEME.textSecondary, fontSize: 13 },
  settings: { paddingTop: 14, borderTopWidth: 1, borderTopColor: THEME.cardBorder },
  settingsHint: { color: THEME.textMuted, fontSize: 12, lineHeight: 19, textAlign: "center", marginBottom: 6 },
});
