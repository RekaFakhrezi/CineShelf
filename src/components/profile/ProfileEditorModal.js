import React, { useEffect, useRef, useState } from "react";
import { Image, Keyboard, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { THEME } from "../../constants/theme";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { Button } from "../common/Button";
import { Icon } from "../common/Icon";
import { ScalePressable } from "../common/ScalePressable";

const SIZE_ERROR = "Pilih foto JPG, PNG, atau WebP maksimal 2 MB.";
const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

function AvatarImage({ uri }) {
  const [status, setStatus] = useState("loading");
  return status !== "failed" && (
    <Image
      source={{ uri }}
      style={[s.avatarImage, status === "loading" && { opacity: 0 }]}
      onLoad={() => setStatus("loaded")}
      onError={() => setStatus("failed")}
      accessible={false}
    />
  );
}

export function ProfileAvatar({ name, uri }) {
  return (
    <View style={s.avatar}>
      <Text style={s.initial} accessible={false}>{Array.from(name.trim() || "A")[0].toUpperCase()}</Text>
      {!!uri && <AvatarImage key={uri} uri={uri} />}
    </View>
  );
}

function releasePhoto(uri) {
  if (Platform.OS === "web" && uri?.startsWith("blob:")) URL.revokeObjectURL(uri);
}

export function ProfileEditorModal({ user, avatarUrl, updateProfile, onSaved, onClose }) {
  const [draft, setDraft] = useState({});
  const [photo, setPhoto] = useState();
  const [operation, setOperation] = useState(null);
  const [error, setError] = useState("");
  const [photoError, setPhotoError] = useState("");
  const active = useRef(false);
  const pending = useRef(null);
  const emailInput = useRef(null);
  const passwordInput = useRef(null);
  const confirmInput = useRef(null);
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const web = Platform.OS === "web";
  const savedName = typeof user.user_metadata?.name === "string" ? user.user_metadata.name.trim() : "";
  const savedEmail = user.email || "";
  const hasPhoto = !!(avatarUrl || user.user_metadata?.cineshelf_avatar);
  const name = draft.name ?? savedName;
  const email = draft.email ?? savedEmail;
  const password = draft.password ?? "";
  const confirmation = draft.confirmation ?? "";
  const preview = photo === undefined ? avatarUrl : photo?.uri;
  const saving = operation === "save";

  useEffect(() => {
    active.current = true;
    return () => { active.current = false; };
  }, []);
  useEffect(() => () => releasePhoto(photo?.uri), [photo]);

  const change = (key, value) => {
    setDraft(previous => ({ ...previous, [key]: value }));
    setError("");
  };
  const close = () => { if (pending.current !== "save") onClose(); };
  const pickPhoto = async () => {
    if (pending.current) return;
    pending.current = "pick";
    setOperation("pick");
    setPhotoError("");
    let image;
    let accepted = false;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"], base64: true, quality: 0.8, allowsMultipleSelection: false,
      });
      if (result.canceled) return;
      image = result.assets?.[0];
      if (!active.current) return;
      const base64 = image?.base64;
      const padding = base64?.endsWith("==") ? 2 : base64?.endsWith("=") ? 1 : 0;
      if (!base64 || base64.length * 0.75 - padding > MAX_PHOTO_BYTES ||
        (web && image.mimeType && !/^image\/(jpeg|png|webp)$/i.test(image.mimeType))) throw Error(SIZE_ERROR);
      if (!image.uri || (web && (!image.width || !image.height))) throw Error("Foto tidak dapat dibuka. Coba pilih foto lain.");
      setPhoto({ uri: image.uri, base64 });
      setError("");
      accepted = true;
    } catch (e) {
      if (active.current) setPhotoError(e.message || "Foto tidak dapat dibuka. Coba pilih foto lain.");
    } finally {
      if (!accepted) releasePhoto(image?.uri);
      pending.current = null;
      if (active.current) setOperation(null);
    }
  };

  const save = async () => {
    if (pending.current) return;
    const patch = {};
    if (name.trim() !== savedName) {
      if (!name.trim()) return setError("Isi nama tampilan.");
      patch.name = name.trim();
    }
    if (email.trim().toLowerCase() !== savedEmail.toLowerCase()) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError("Masukkan alamat email yang valid.");
      patch.email = email.trim();
    }
    if (password || confirmation) {
      if (password.length < 6) return setError("Gunakan kata sandi minimal 6 karakter.");
      if (password !== confirmation) return setError("Konfirmasi kata sandi belum cocok.");
      patch.password = password;
    }
    if (photo) patch.avatar = { base64: photo.base64 };
    else if (photo === null && hasPhoto) patch.avatar = null;
    if (!Object.keys(patch).length) return onClose();

    pending.current = "save";
    setOperation("save");
    setError("");
    Keyboard.dismiss();
    try {
      const result = await updateProfile(patch);
      if (active.current) onSaved(result);
    } catch (e) {
      if (active.current) setError(e.message || "Profil belum dapat disimpan. Coba lagi.");
    } finally {
      pending.current = null;
      if (active.current) setOperation(null);
    }
  };

  const field = (key, label, value, props) => (
    <View style={s.field}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        style={s.input}
        placeholderTextColor={THEME.textMuted}
        value={value}
        onChangeText={text => change(key, text)}
        editable={!saving}
        {...props}
      />
    </View>
  );
  const passwordProps = { secureTextEntry: true, autoComplete: "new-password", autoCapitalize: "none", autoCorrect: false };

  return (
    <Modal visible transparent animationType={reducedMotion ? "none" : "fade"} onRequestClose={close}>
      <KeyboardAvoidingView style={s.backdrop} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View
          style={[s.panel, { marginTop: Math.max(insets.top, 12), marginBottom: Math.max(insets.bottom, 12) }]}
          accessibilityViewIsModal
          {...(web ? { role: "dialog", "aria-modal": true, "aria-labelledby": "profile-editor-title" } : {})}
        >
          <View style={s.header}>
            <Text nativeID="profile-editor-title" accessibilityRole="header" style={s.heading}>Edit profil</Text>
            <ScalePressable disabled={saving} onPress={close} accessibilityLabel="Tutup edit profil" style={s.close}>
              <Icon name="close" size={22} color={THEME.textPrimary} />
            </ScalePressable>
          </View>
          <ScrollView keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled" contentContainerStyle={s.body}>
            <View style={s.photoRow}>
              <ProfileAvatar name={name || email} uri={preview} />
              <View style={s.photoControls}>
                <Text style={s.label}>Foto profil</Text>
                <Text style={s.hint}>JPG, PNG, atau WebP. Maksimal 2 MB.</Text>
                <View style={s.photoActions}>
                  <Button label="Pilih foto" icon="image-outline" size="sm" secondary disabled={!!operation} onPress={pickPhoto} />
                  {(photo || (photo === undefined && hasPhoto)) && (
                    <Button label="Hapus foto" size="sm" ghost disabled={!!operation} onPress={() => {
                      setPhoto(hasPhoto ? null : undefined);
                      setPhotoError("");
                      setError("");
                    }} />
                  )}
                </View>
              </View>
            </View>
            {!!photoError && <Text accessibilityRole="alert" style={s.error}>{photoError}</Text>}
            {field("name", "Nama tampilan", name, {
              placeholder: "Nama panggilanmu", autoComplete: "name", maxLength: 80, returnKeyType: "next",
              onSubmitEditing: () => emailInput.current?.focus(),
            })}
            {field("email", "Email", email, {
              ref: emailInput, keyboardType: "email-address", autoComplete: "email", autoCapitalize: "none",
              autoCorrect: false, returnKeyType: "next", onSubmitEditing: () => passwordInput.current?.focus(),
            })}
            <View style={s.passwordFields}>
              <Text style={s.hint}>Kosongkan kedua kolom jika tidak ingin mengubah kata sandi.</Text>
              {field("password", "Kata sandi baru", password, {
                ...passwordProps, ref: passwordInput, placeholder: "Minimal 6 karakter", returnKeyType: "next",
                onSubmitEditing: () => confirmInput.current?.focus(),
              })}
              {field("confirmation", "Konfirmasi kata sandi baru", confirmation, {
                ...passwordProps, ref: confirmInput, returnKeyType: "done", onSubmitEditing: save,
              })}
            </View>
            {!!error && <Text accessibilityRole="alert" accessibilityLiveRegion="assertive" style={s.error}>{error}</Text>}
            <Button label={saving ? "Menyimpan…" : "Simpan perubahan"} icon="checkmark-outline" disabled={!!operation} onPress={save} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.65)", paddingHorizontal: 12, alignItems: "center", justifyContent: "center" },
  panel: { width: "100%", maxWidth: 520, flexShrink: 1, minHeight: 0, overflow: "hidden", backgroundColor: THEME.bg, borderWidth: 1, borderColor: THEME.raisedBorder, borderRadius: 18 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: THEME.cardBorder },
  heading: { flex: 1, color: THEME.textPrimary, fontSize: 22, fontWeight: "800" },
  close: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  body: { padding: 20, gap: 16 },
  photoRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 14, padding: 14, borderRadius: 12, backgroundColor: THEME.bgSecondary },
  photoControls: { flexGrow: 1, flexBasis: 150, gap: 3 },
  photoActions: { flexDirection: "row", flexWrap: "wrap", columnGap: 8 },
  avatar: { width: 72, height: 72, borderRadius: 36, borderWidth: 2, borderColor: THEME.accent, backgroundColor: THEME.accentDark, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  initial: { color: THEME.textPrimary, fontSize: 30, fontWeight: "700" },
  avatarImage: { position: "absolute", width: "100%", height: "100%", backgroundColor: THEME.accentDark },
  field: { gap: 7 },
  label: { color: THEME.textPrimary, fontSize: 14, fontWeight: "600" },
  input: { minHeight: 48, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 9, borderWidth: 1, borderColor: THEME.raisedBorder, backgroundColor: THEME.bgSecondary, color: THEME.textPrimary, fontSize: 16 },
  passwordFields: { gap: 12, borderTopWidth: 1, borderTopColor: THEME.cardBorder, paddingTop: 14 },
  hint: { color: THEME.textSecondary, fontSize: 13, lineHeight: 19 },
  error: { color: THEME.accentSoft, fontSize: 14, lineHeight: 20 },
});
