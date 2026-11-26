import React, { useEffect, useRef, useState } from "react";
import { View, Text, TextInput, Modal, ScrollView, Image, KeyboardAvoidingView, Platform, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { THEME } from "../../constants/theme";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { Icon } from "../common/Icon";
import { Button } from "../common/Button";
import { ScalePressable } from "../common/ScalePressable";

export function AddTitleModal({ visible, initialType = "film", genres = [], api, getToken, onClose, onCreated }) {
  const [form, setForm] = useState({});
  const [cover, setCover] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [extra, setExtra] = useState(false);
  const lock = useRef(false);
  const errorRef = useRef(null);
  const Form = Platform.OS === "web" ? "form" : View;
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    if (!visible) return;
    setForm({ type: initialType, title: "", genre: genres[0] || "", year: String(new Date().getFullYear()), duration: "", synopsis: "", episodes: "1", rating: "", age: "SU", cast: "", director: "", tagline: "" });
    setCover(null); setError(""); setExtra(false); setBusy(false); lock.current = false;
  }, [visible, initialType]);
  const change = (key, value) => { setForm(previous => ({ ...previous, [key]: value })); setError(""); };
  const showError = message => { setError(message); requestAnimationFrame(() => errorRef.current?.focus?.()); };
  const pickCover = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], base64: true, quality: 0.8, allowsMultipleSelection: false });
      if (result.canceled) return;
      const image = result.assets[0];
      if (!image.base64 || image.base64.length * 0.75 > 2 * 1024 * 1024) throw Error("Pilih foto JPG, PNG, atau WebP maksimal 2 MB.");
      setCover({ uri: image.uri, base64: image.base64 }); setError("");
    } catch (e) { showError(e.message || "Foto tidak dapat dibuka. Coba pilih ulang."); }
  };
  const submit = async () => {
    if (lock.current) return;
    if (!cover) return showError("Pilih foto cover terlebih dahulu.");
    if (!form.title?.trim()) return showError("Isi judul film atau serial.");
    if (!form.genre || !genres.includes(form.genre)) return showError("Pilih genre yang tersedia.");
    const year = Number(form.year), episodes = Number(form.episodes), rating = Number(form.rating || 0);
    if (!/^\d{4}$/.test(form.year) || year < 1888 || year > 2100) return showError("Isi tahun rilis antara 1888–2100.");
    if (form.type === "film" && !form.duration?.trim()) return showError("Isi durasi film, misalnya 1j 40m.");
    if (form.type === "serial" && (!Number.isInteger(episodes) || episodes < 1 || episodes > 100)) return showError("Isi jumlah episode antara 1–100.");
    if (!form.synopsis?.trim()) return showError("Tulis sinopsis singkat.");
    if (!Number.isFinite(rating) || rating < 0 || rating > 10) return showError("Rating harus antara 0–10.");
    lock.current = true; setBusy(true); setError("");
    try {
      const title = {
        title: form.title.trim(), genre: form.genre, year, synopsis: form.synopsis.trim(), rating, age: form.age,
        duration: form.type === "serial" ? "1 musim · " + episodes + " episode" : form.duration.trim(),
        cast: form.cast.trim() || "Belum dicantumkan", director: form.director.trim() || "Belum dicantumkan", tagline: form.tagline.trim(),
        ...(form.type === "serial" ? { episodes } : {}),
      };
      const result = await api.contribute({ type: form.type, title, cover: { base64: cover.base64 } }, await getToken());
      onCreated(result.data);
    } catch (e) { showError(e.message); }
    finally { lock.current = false; setBusy(false); }
  };
  const input = (key, label, options = {}) => <View style={s.field} key={key}>
    <Text nativeID={"add-" + key + "-label"} style={s.label}>{label}</Text>
    <TextInput value={form[key] || ""} onChangeText={value => change(key, value)} editable={!busy}
      accessibilityLabel={label} aria-labelledby={Platform.OS === "web" ? "add-" + key + "-label" : undefined}
      placeholderTextColor={THEME.textMuted} style={[s.input, options.multiline && s.textarea]}
      maxLength={key === "synopsis" ? 5000 : 300} returnKeyType={options.multiline ? "default" : "next"} {...options} />
  </View>;
  const choices = (key, values) => <View style={s.choices} accessibilityRole="radiogroup">
    {values.map(([value, label]) => <Pressable key={value} disabled={busy} onPress={() => change(key, value)}
      accessibilityRole="radio" accessibilityLabel={label} accessibilityState={{ checked: form[key] === value }}
      {...(Platform.OS === "web" ? { "aria-checked": form[key] === value } : {})}
      style={[s.choice, form[key] === value && s.selected]}>
      <Text style={[s.choiceText, form[key] === value && { color: THEME.textPrimary }]}>{label}</Text>
      {form[key] === value && <Icon name="checkmark" size={16} color={THEME.accentSoft} />}
    </Pressable>)}
  </View>;
  return <Modal visible={visible} transparent animationType={reducedMotion ? "none" : "fade"} onRequestClose={() => !busy && onClose()}>
    <KeyboardAvoidingView style={s.backdrop} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[s.panel, { marginTop: Math.max(insets.top, 16), marginBottom: Math.max(insets.bottom, 16) }]} accessibilityViewIsModal {...(Platform.OS === "web" ? { role: "dialog", "aria-modal": true, "aria-labelledby": "add-title-heading" } : {})}>
        <View style={s.header}><View style={{ flex: 1, gap: 4 }}><Text nativeID="add-title-heading" accessibilityRole="header" style={s.heading}>Tambah tontonan</Text>
          <Text style={s.help}>Simpan pilihanmu ke katalog bersama.</Text></View>
          <ScalePressable disabled={busy} onPress={onClose} accessibilityLabel="Tutup form tambah tontonan" style={s.close}><Icon name="close" size={22} color="white" /></ScalePressable>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={s.body}>
        <Form style={Platform.OS === "web" ? { display: "flex", flexDirection: "column", gap: 18 } : { gap: 18 }}
          {...(Platform.OS === "web" ? { "aria-label": "Tambah tontonan", noValidate: true, onSubmit: event => { event.preventDefault(); submit(); } } : {})}>
          {choices("type", [["film", "Film"], ["serial", "Serial"]])}
          <ScalePressable disabled={busy} onPress={pickCover} accessibilityLabel={cover ? "Ganti foto cover" : "Pilih foto cover"} style={s.photo}>
            {cover ? <Image source={{ uri: cover.uri }} style={s.preview} accessibilityLabel="Pratinjau cover pilihan" /> : <View style={s.photoIcon}><Icon name="image-outline" size={28} color={THEME.textSecondary} /></View>}
            <View style={{ flex: 1, gap: 5 }}><Text style={s.label}>{cover ? "Ganti foto cover" : "Pilih foto cover *"}</Text><Text style={s.help}>JPG, PNG, atau WebP · maks. 2 MB</Text></View>
            <Icon name="add" size={21} color={THEME.textPrimary} />
          </ScalePressable>
          {input("title", "Judul *", { placeholder: "Judul film atau serial" })}
          <View style={s.field}><Text style={s.label}>Genre *</Text>{choices("genre", genres.map(value => [value, value]))}</View>
          {input("year", "Tahun rilis *", { keyboardType: "number-pad", inputMode: "numeric", maxLength: 4 })}
          {form.type === "serial" ? input("episodes", "Jumlah episode *", { keyboardType: "number-pad", inputMode: "numeric", maxLength: 3 }) : input("duration", "Durasi *", { placeholder: "Contoh: 1j 40m" })}
          {input("synopsis", "Sinopsis *", { placeholder: "Ceritakan secara singkat…", multiline: true, textAlignVertical: "top" })}
          <ScalePressable onPress={() => setExtra(value => !value)} accessibilityLabel="Detail tambahan opsional" accessibilityState={{ expanded: extra }} style={s.extra}>
            <Text style={s.label}>Detail tambahan <Text style={s.help}>(opsional)</Text></Text><Icon name={extra ? "chevron-up" : "chevron-down"} size={18} color={THEME.textSecondary} />
          </ScalePressable>
          {extra && <View style={{ gap: 16 }}>{input("tagline", "Kutipan / tagline")}{input("cast", "Pemeran")}{input("director", "Sutradara")}{input("rating", "Rating awal (0–10)", { keyboardType: "decimal-pad", inputMode: "decimal", maxLength: 4 })}<Text style={s.label}>Batas usia</Text>{choices("age", ["SU", "13+", "16+", "18+"].map(value => [value, value]))}</View>}
          {!!error && <Text ref={errorRef} tabIndex={Platform.OS === "web" ? -1 : undefined} accessibilityRole="alert" accessibilityLiveRegion="assertive" style={s.error}>{error}</Text>}
          {busy && <Text accessibilityLiveRegion="polite" style={s.help}>Mengunggah foto dan menyimpan judul…</Text>}
          {Platform.OS === "web" ? <button type="submit" disabled={busy} style={{ minHeight: 44, borderRadius: 8, padding: "10px 14px", border: "1px solid rgba(255,255,255,0.2)", background: THEME.accent, color: "white", fontSize: 14, fontWeight: 700, cursor: busy ? "wait" : "pointer", opacity: busy ? 0.6 : 1 }}>{busy ? "Menyimpan…" : "Simpan ke katalog"}</button> : <Button label={busy ? "Menyimpan…" : "Simpan ke katalog"} icon="add" disabled={busy} onPress={submit} style={{ alignSelf: "stretch" }} />}
          <Text style={s.help}>* Wajib diisi. Judul dan foto yang ditambahkan dapat dilihat pengguna CineShelf lainnya.</Text>
        </Form>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  </Modal>;
}
const s=StyleSheet.create({
  backdrop:{flex:1,backgroundColor:"rgba(0,0,0,0.65)",paddingHorizontal:12,justifyContent:"center",alignItems:"center"},
  panel:{width:"100%",maxWidth:560,maxHeight:"94%",backgroundColor:THEME.bg,borderRadius:18,borderWidth:1,borderColor:THEME.raisedBorder,overflow:"hidden",flexShrink:1},
  header:{flexDirection:"row",alignItems:"center",padding:20,gap:12,borderBottomWidth:1,borderBottomColor:THEME.cardBorder},
  heading:{color:"white",fontSize:22,fontWeight:"700",letterSpacing:-0.5},
  help:{color:THEME.textSecondary,fontSize:12,lineHeight:18},
  close:{width:44,height:44,alignItems:"center",justifyContent:"center"},
  body:{padding:20,gap:18,paddingBottom:28},field:{gap:8},label:{color:THEME.textPrimary,fontSize:14,fontWeight:"600"},
  input:{backgroundColor:THEME.bgSecondary,color:THEME.textPrimary,minHeight:48,borderWidth:1,borderColor:THEME.raisedBorder,borderRadius:9,paddingHorizontal:12,paddingVertical:12,fontSize:16},
  textarea:{minHeight:110},choices:{flexDirection:"row",flexWrap:"wrap",gap:8},
  choice:{minHeight:48,paddingHorizontal:14,borderRadius:9,borderWidth:1,borderColor:THEME.raisedBorder,backgroundColor:THEME.bgSecondary,alignItems:"center",justifyContent:"center",flexDirection:"row",gap:8},
  selected:{borderColor:THEME.accentSoft,backgroundColor:THEME.accentDark},choiceText:{color:THEME.textSecondary,fontSize:13,fontWeight:"600"},
  photo:{flexDirection:"row",alignItems:"center",gap:14,padding:14,backgroundColor:THEME.bgSecondary,borderWidth:1,borderColor:THEME.raisedBorder,borderRadius:12,minHeight:104},
  photoIcon:{width:54,height:72,alignItems:"center",justifyContent:"center"},preview:{width:54,height:80,borderRadius:6},
  extra:{minHeight:48,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},
  error:{color:THEME.accentSoft,fontSize:14,lineHeight:21},
});
