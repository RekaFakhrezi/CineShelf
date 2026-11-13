import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  Pressable,
  TextInput,
  ImageBackground,
  StatusBar,
  Platform,
  BackHandler,
  Modal,
  useWindowDimensions,
  ActivityIndicator,
} from "react-native";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  catalog as demoCatalog,
  genres as demoGenres,
  filterCatalog,
} from "./catalog";
import { createApi, normalizeApiUrl } from "./src/services/api";
import { defaultApiUrl } from "./src/services/config";
import { useRequest, useDebounced } from "./src/hooks/useRequest";

const RED = "#FF3B4E",
  BG = "#0C0D12",
  MUTED = "#999BAA",
  KEY = "cineshelf.watchlist.v1";
const CONNECTION_KEY = "cineshelf.connection.v1";
const tabs = [
  { id: "home", label: "Beranda", icon: "home" },
  { id: "film", label: "Film", icon: "film" },
  { id: "serial", label: "Serial", icon: "tv" },
  { id: "watchlist", label: "Watchlist", icon: "bookmark" },
  { id: "profile", label: "Profil", icon: "person-circle" },
];
const Icon = ({ name, size = 22, color = "white" }) => (
  <Ionicons name={name} size={size} color={color} />
);
function Button({ label, icon, onPress, secondary = false, disabled = false }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        secondary && s.secondary,
        disabled && { opacity: 0.4 },
        pressed && { opacity: 0.75 },
      ]}
    >
      <Icon name={icon} size={19} />
      <Text style={s.buttonText}>{label}</Text>
    </Pressable>
  );
}
function Artwork({ item, style, children }) {
  const [failed, setFailed] = useState(false);
  return (
    <View style={[{ backgroundColor: item.color, overflow: "hidden" }, style]}>
      {!failed && (
        <ImageBackground
          source={{ uri: item.image }}
          onError={() => setFailed(true)}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
      )}
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,.25)", "#101116"]}
        style={StyleSheet.absoluteFill}
      />
      {children}
    </View>
  );
}
function Poster({ item, onOpen, saved, width = 137, rank }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Detail ${item.title}`}
      onPress={() => onOpen(item)}
      style={({ pressed }) => [{ width, opacity: pressed ? 0.8 : 1 }]}
    >
      <Artwork item={item} style={[s.poster, { height: width * 1.43 }]}>
        <View style={s.posterTop}>
          <Text style={s.tinyBrand}>C</Text>
          {saved && (
            <View style={s.savedDot}>
              <Icon name="bookmark" size={12} />
            </View>
          )}
        </View>
        <View style={s.posterTitle}>
          <Text style={s.posterKicker}>{item.genre.toUpperCase()}</Text>
          <Text
            numberOfLines={3}
            style={[s.posterName, { fontSize: width < 150 ? 20 : 24 }]}
          >
            {item.title.toUpperCase()}
          </Text>
        </View>
      </Artwork>
      <Text numberOfLines={1} style={s.cardTitle}>
        {rank ? `${rank}. ` : ""}
        {item.title}
      </Text>
      <View style={s.metaRow}>
        <Icon name="star" size={11} color="#F6C86A" />
        <Text style={s.cardMeta}>
          {item.rating} · {item.year}
        </Text>
      </View>
    </Pressable>
  );
}
function Shelf({ title, subtitle, items, onOpen, saved, onAll }) {
  return (
    <View style={s.shelf}>
      <View style={s.sectionHead}>
        <View style={{ flex: 1 }}>
          <Text style={s.sectionTitle}>{title}</Text>
          {subtitle && <Text style={s.sectionSub}>{subtitle}</Text>}
        </View>
        {onAll && (
          <Pressable onPress={onAll} accessibilityRole="button">
            <Text style={s.seeAll}>
              Lihat semua <Text>›</Text>
            </Text>
          </Pressable>
        )}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.shelfItems}
      >
        {items.map((item) => (
          <Poster
            key={item.id}
            item={item}
            onOpen={onOpen}
            saved={saved.includes(item.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
}
function CineShelf() {
  const inset = useSafeAreaInsets(),
    { width } = useWindowDimensions();
  const [tab, setTab] = useState("home"),
    [detail, setDetail] = useState(null),
    [query, setQuery] = useState(""),
    [genre, setGenre] = useState("Semua");
  const [connection, setConnection] = useState({
      mode: "api",
      url: defaultApiUrl(),
    }),
    [connectionReady, setConnectionReady] = useState(false);
  const [settings, setSettings] = useState(false),
    [urlDraft, setUrlDraft] = useState(""),
    [connectionError, setConnectionError] = useState(""),
    [checking, setChecking] = useState(false);
  const [page, setPage] = useState(1);
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(CONNECTION_KEY)
      .then((raw) => {
        if (raw && active) {
          const c = JSON.parse(raw);
          if (["api", "demo"].includes(c.mode))
            setConnection({ mode: c.mode, url: normalizeApiUrl(c.url) });
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setConnectionReady(true);
      });
    return () => {
      active = false;
    };
  }, []);
  const api = createApi(connection.url),
    isApi = connection.mode === "api";
  const homeRequest = useRequest(
    async (signal) => {
      const [home, genres] = await Promise.all([
        api.home(signal),
        api.genres(signal),
      ]);
      return { home: home.data, genres: genres.data };
    },
    [connection.url],
    connectionReady && isApi,
  );
  const demoHome = {
    featured: demoCatalog[0],
    movies: demoCatalog.filter((x) => x.type === "film"),
    series: demoCatalog.filter((x) => x.type === "serial"),
    total: demoCatalog.length,
  };
  const home = isApi ? homeRequest.data?.home : demoHome;
  const genres = isApi
    ? ["Semua", ...(homeRequest.data?.genres || [])]
    : demoGenres;
  const catalog = isApi
    ? [...(home?.movies || []), ...(home?.series || [])]
    : demoCatalog;
  const [saved, setSaved] = useState([]),
    [ready, setReady] = useState(false),
    [storageOK, setStorageOK] = useState(true),
    [notice, setNotice] = useState(""),
    [dialog, setDialog] = useState(null);
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (!active) return;
        if (raw) {
          const ids = JSON.parse(raw);
          if (!Array.isArray(ids)) throw Error("invalid");
          setSaved([
            ...new Set(
              ids.filter((id) => typeof id === "string" && id.length <= 100),
            ),
          ]);
        }
      })
      .catch(() => {
        if (active) {
          setStorageOK(false);
          setNotice(
            "Penyimpanan tidak tersedia. Watchlist berlaku selama sesi ini.",
          );
        }
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (!ready || !storageOK) return;
    AsyncStorage.setItem(KEY, JSON.stringify(saved)).catch(() => {
      setStorageOK(false);
      setNotice("Watchlist belum tersimpan ke perangkat.");
    });
  }, [saved, ready, storageOK]);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 3200);
    return () => clearTimeout(t);
  }, [notice]);
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (settings) {
        setSettings(false);
        return true;
      }
      if (dialog) {
        setDialog(null);
        return true;
      }
      if (detail) {
        setDetail(null);
        return true;
      }
      if (tab !== "home") {
        setTab("home");
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [detail, tab, dialog, settings]);
  function navigate(id) {
    setTab(id);
    setPage(1);
    setDetail(null);
    setQuery("");
    setGenre("Semua");
  }
  function toggle(item) {
    if (!ready) return;
    const exists = saved.includes(item.id);
    setSaved((prev) =>
      prev.includes(item.id)
        ? prev.filter((id) => id !== item.id)
        : [...prev, item.id],
    );
    setNotice(exists ? "Dihapus dari watchlist" : "Ditambahkan ke watchlist");
  }
  const debouncedQuery = useDebounced(query);
  const listRequest = useRequest(
    (signal) => api.list(tab, { q: debouncedQuery, genre, page }, signal),
    [connection.url, tab, debouncedQuery, genre, page],
    connectionReady && isApi && ["film", "serial"].includes(tab),
  );
  const savedRequest = useRequest(
    (signal) => api.resolve(saved, signal),
    [connection.url, JSON.stringify(saved)],
    connectionReady && ready && isApi && tab === "watchlist",
  );
  const detailRequest = useRequest(
    (signal) => api.detail(detail, signal),
    [connection.url, detail?.id, detail?.type],
    connectionReady && isApi && !!detail,
  );
  const detailItem = isApi ? detailRequest.data?.data : detail;
  const featured = home?.featured,
    columns = width > 650 ? 4 : 2,
    gridWidth = (Math.min(width, 1000) - 48 - (columns - 1) * 14) / columns;
  const items =
    tab === "watchlist"
      ? filterCatalog(
          isApi
            ? savedRequest.data?.data || []
            : demoCatalog.filter((x) => saved.includes(x.id)),
          query,
          genre,
        )
      : isApi
        ? listRequest.data?.data || []
        : filterCatalog(
            demoCatalog.filter((x) => x.type === tab),
            query,
            genre,
          );
  const listLoading =
    isApi &&
    (tab === "watchlist"
      ? savedRequest.loading
      : listRequest.loading || query !== debouncedQuery);
  const listError = isApi
    ? tab === "watchlist"
      ? savedRequest.error
      : listRequest.error
    : "";
  const reloadList = () =>
    tab === "watchlist" ? savedRequest.retry() : listRequest.retry();
  function openSettings() {
    setUrlDraft(connection.url);
    setConnectionError("");
    setSettings(true);
  }
  async function saveConnection(mode) {
    setConnectionError("");
    setChecking(true);
    try {
      const url = normalizeApiUrl(urlDraft || connection.url);
      if (mode === "api") {
        const result = await createApi(url).health();
        if (result.status !== "ok" || result.service !== "cineshelf-api")
          throw Error("URL ini bukan CineShelf API.");
      }
      const next = { mode, url };
      await AsyncStorage.setItem(CONNECTION_KEY, JSON.stringify(next));
      setConnection(next);
      setSettings(false);
      navigate("home");
      homeRequest.retry();
      setNotice(
        mode === "api"
          ? "Terhubung ke CineShelf API"
          : "Mode demo aktif — katalog contoh lokal",
      );
    } catch (e) {
      setConnectionError(e.message);
    } finally {
      setChecking(false);
    }
  }
  const renderMessage = (message, retry, loading = false) => (
    <View style={s.empty}>
      {loading ? (
        <ActivityIndicator size="large" color={RED} />
      ) : (
        <Icon name="cloud-offline-outline" size={42} color={RED} />
      )}
      <Text style={s.emptyTitle}>
        {loading ? "Memuat katalog..." : "Katalog belum tersedia"}
      </Text>
      <Text style={s.emptyText}>{message}</Text>
      {!loading && (
        <>
          <Button label="Coba lagi" icon="refresh" onPress={retry} />
          <Button
            label="Atur koneksi"
            icon="settings-outline"
            secondary
            onPress={openSettings}
          />
        </>
      )}
    </View>
  );
  const renderHome = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 25 }}
    >
      <View style={s.homeHeader}>
        <View>
          <Text style={s.brand}>
            CINE<Text style={{ color: "white" }}>SHELF</Text>
            <Text style={s.brandDot}>.</Text>
          </Text>
          <Text style={s.greeting}>
            {isApi
              ? "Cerita berikutnya, mulai di sini."
              : "Mode demo · data contoh lokal"}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Buka profil"
          onPress={() => navigate("profile")}
          style={s.avatar}
        >
          <Text style={s.avatarText}>R</Text>
        </Pressable>
      </View>
      {featured ? (
        <Artwork item={featured} style={s.hero}>
          <View style={s.heroBadge}>
            <View style={s.redDot} />
            <Text style={s.heroBadgeText}>PILIHAN MINGGU INI</Text>
          </View>
          <View style={s.heroBottom}>
            <Text style={s.eyebrow}>C I N E S H E L F S E L E C T</Text>
            <Text style={s.heroTitle}>{featured.title.toUpperCase()}</Text>
            <Text style={s.heroTagline}>{featured.tagline}</Text>
            <View style={s.heroMeta}>
              <Text style={s.green}>★ {featured.rating}</Text>
              <Text style={s.muted}>{featured.year}</Text>
              <Text style={s.age}>{featured.age}</Text>
              <Text style={s.muted}>{featured.genre}</Text>
            </View>
            <View style={s.actions}>
              <Button
                label="Lihat detail"
                icon="play"
                onPress={() => setDetail(featured)}
              />
              <Button
                label={saved.includes(featured.id) ? "Tersimpan" : "Watchlist"}
                icon={saved.includes(featured.id) ? "checkmark" : "add"}
                secondary
                disabled={!ready}
                onPress={() => toggle(featured)}
              />
            </View>
          </View>
        </Artwork>
      ) : (
        <View style={s.empty}>
          <Text style={s.emptyTitle}>Katalog masih kosong</Text>
          <Text style={s.emptyText}>
            Tambahkan judul melalui API untuk mulai menjelajah.
          </Text>
        </View>
      )}
      <Shelf
        title="Saatnya menemukan cerita"
        subtitle="Film pilihan untuk mengisi waktu luangmu"
        items={home?.movies || []}
        onOpen={setDetail}
        saved={saved}
        onAll={() => navigate("film")}
      />
      <View style={s.spotlight}>
        <View style={s.spotlightIcon}>
          <Icon name="sparkles" color={RED} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.spotlightTitle}>Satu episode lagi?</Text>
          <Text style={s.sectionSub}>Temukan serial yang bikin penasaran.</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Jelajahi serial"
          onPress={() => navigate("serial")}
        >
          <Icon name="arrow-forward" />
        </Pressable>
      </View>
      <Shelf
        title="Serial yang bikin betah"
        items={home?.series || []}
        onOpen={setDetail}
        saved={saved}
        onAll={() => navigate("serial")}
      />
    </ScrollView>
  );
  const renderList = () => (
    <View style={{ flex: 1 }}>
      <View style={s.listHeader}>
        <Text style={s.eyebrow}>KOLEKSI CINESHELF</Text>
        <Text style={s.pageTitle}>
          {tab === "film"
            ? "Temukan film."
            : tab === "serial"
              ? "Ikuti ceritanya."
              : "Daftar tontonanmu."}
        </Text>
        <Text style={s.sectionSub}>
          {tab === "watchlist"
            ? "Simpan sekarang, nikmati ceritanya nanti."
            : "Pilih suasana. Temukan cerita yang pas."}
        </Text>
        <View style={s.search}>
          <Icon name="search-outline" size={20} color={MUTED} />
          <TextInput
            accessibilityLabel="Cari judul, genre, atau pemeran"
            placeholder="Cari judul, genre, atau pemeran..."
            placeholderTextColor="#777A8A"
            style={s.input}
            value={query}
            onChangeText={(value) => {
              setQuery(value);
              setPage(1);
            }}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query !== "" && (
            <Pressable
              accessibilityLabel="Hapus pencarian"
              accessibilityRole="button"
              onPress={() => {
                setQuery("");
                setPage(1);
              }}
            >
              <Icon name="close-circle" size={20} color={MUTED} />
            </Pressable>
          )}
        </View>
      </View>
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.chips}
        >
          {genres.map((g) => (
            <Pressable
              key={g}
              accessibilityRole="button"
              accessibilityLabel={`Genre ${g}`}
              accessibilityState={{ selected: genre === g }}
              onPress={() => {
                setGenre(g);
                setPage(1);
              }}
              style={[s.chip, genre === g && s.chipActive]}
            >
              <Text style={[s.chipText, genre === g && { color: "white" }]}>
                {g}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
      {listLoading ? (
        renderMessage("Mengambil data dari server.", null, true)
      ) : listError ? (
        renderMessage(listError, reloadList)
      ) : !ready && tab === "watchlist" ? (
        <ActivityIndicator color={RED} style={{ margin: 50 }} />
      ) : (
        <FlatList
          key={columns}
          data={items}
          numColumns={columns}
          keyExtractor={(x) => x.id}
          contentContainerStyle={s.grid}
          columnWrapperStyle={{ gap: 14 }}
          ListFooterComponent={
            isApi &&
            tab !== "watchlist" &&
            (listRequest.data?.pagination.totalPages || 0) > 1 ? (
              <View style={s.pagination}>
                <Button
                  label="Sebelumnya"
                  icon="chevron-back"
                  secondary
                  disabled={page <= 1}
                  onPress={() => setPage((n) => n - 1)}
                />
                <Text style={s.cardMeta}>
                  {page} / {listRequest.data.pagination.totalPages}
                </Text>
                <Button
                  label="Berikutnya"
                  icon="chevron-forward"
                  secondary
                  disabled={page >= listRequest.data.pagination.totalPages}
                  onPress={() => setPage((n) => n + 1)}
                />
              </View>
            ) : null
          }
          ListHeaderComponent={
            <Text style={s.resultCount}>
              {items.length} {tab === "serial" ? "serial" : "judul"} untuk kamu
            </Text>
          }
          renderItem={({ item }) => (
            <View style={{ marginBottom: 23 }}>
              <Poster
                item={item}
                width={gridWidth}
                onOpen={setDetail}
                saved={saved.includes(item.id)}
              />
            </View>
          )}
          ListEmptyComponent={
            <View style={s.empty}>
              <View style={s.emptyIcon}>
                <Icon
                  name={
                    tab === "watchlist" && !query && genre === "Semua"
                      ? "bookmark-outline"
                      : "search-outline"
                  }
                  size={34}
                  color={RED}
                />
              </View>
              <Text style={s.emptyTitle}>
                {tab === "watchlist" && saved.length === 0
                  ? "Watchlist masih kosong"
                  : "Belum ada yang cocok"}
              </Text>
              <Text style={s.emptyText}>
                {tab === "watchlist" && saved.length === 0
                  ? "Ketuk + Watchlist pada film atau serial favoritmu."
                  : "Coba kata kunci lain atau ubah filter genre."}
              </Text>
              <Button
                label={
                  tab === "watchlist" && saved.length === 0
                    ? "Jelajahi film"
                    : "Reset pencarian"
                }
                icon="arrow-forward"
                onPress={() => {
                  if (tab === "watchlist" && saved.length === 0)
                    navigate("film");
                  else {
                    setQuery("");
                    setGenre("Semua");
                    setPage(1);
                  }
                }}
              />
            </View>
          }
        />
      )}
    </View>
  );
  const renderDetail = () => {
    const detail = detailItem;
    return (
      <ScrollView
        key={detail.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        <Artwork item={detail} style={s.detailArt}>
          <Pressable
            accessibilityLabel="Kembali"
            accessibilityRole="button"
            onPress={() => setDetail(null)}
            style={s.back}
          >
            <Icon name="arrow-back" />
          </Pressable>
          <View style={s.detailArtText}>
            <Text style={s.eyebrow}>
              CINESHELF {detail.type === "serial" ? "SERIES" : "FILM"}
            </Text>
            <Text style={s.detailArtTitle}>{detail.title.toUpperCase()}</Text>
          </View>
        </Artwork>
        <View style={s.detailBody}>
          <View style={s.heroMeta}>
            <Text style={s.green}>★ {detail.rating}</Text>
            <Text style={s.muted}>{detail.year}</Text>
            <Text style={s.age}>{detail.age}</Text>
            <Text style={s.muted}>{detail.duration}</Text>
          </View>
          <Text style={s.genreLabel}>{detail.genre}</Text>
          <Text style={s.detailTagline}>{detail.tagline}</Text>
          <View style={s.actions}>
            <Button
              label={saved.includes(detail.id) ? "Tersimpan" : "Watchlist"}
              icon={saved.includes(detail.id) ? "checkmark" : "add"}
              disabled={!ready}
              onPress={() => toggle(detail)}
            />
            <Button
              label="Info demo"
              icon="information-circle-outline"
              secondary
              onPress={() =>
                setDialog({
                  title: "Tentang katalog demo",
                  body: "Film dan serial di prototipe ini adalah cerita fiktif dengan foto ilustrasi. Pemutaran film dan trailer belum tersedia. Kamu sudah bisa menjelajahi katalog, mencari judul, dan menyimpan watchlist.",
                })
              }
            />
          </View>
          <Text style={[s.sectionTitle, { marginTop: 28, marginBottom: 10 }]}>
            Sinopsis
          </Text>
          <Text style={s.synopsis}>{detail.synopsis}</Text>
          <View style={s.credits}>
            <Text style={s.creditLine}>
              <Text style={s.creditKey}>Pemeran </Text>
              {detail.cast}
            </Text>
            <Text style={s.creditLine}>
              <Text style={s.creditKey}>Sutradara </Text>
              {detail.director}
            </Text>
          </View>
          {detail.episodes && (
            <View>
              <Text
                style={[s.sectionTitle, { marginTop: 24, marginBottom: 14 }]}
              >
                Musim 1{" "}
                <Text style={s.sectionSub}> · {detail.episodes} episode</Text>
              </Text>
              {Array.from({ length: detail.episodes }, (_, i) => (
                <View key={i} style={s.episode}>
                  <Text style={s.episodeNumber}>
                    {String(i + 1).padStart(2, "0")}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text style={s.cardTitle}>
                      {
                        [
                          "Sinyal Pertama",
                          "Jejak yang Tertinggal",
                          "Di Balik Pintu",
                          "Titik Balik",
                          "Pilihan",
                          "Awal yang Baru",
                          "Satu Langkah Lagi",
                          "Pulang",
                        ][i]
                      }
                    </Text>
                    <Text style={s.sectionSub}>
                      Episode {i + 1} · {32 + i * 2} menit
                    </Text>
                  </View>
                  <Text style={s.demoBadge}>DEMO</Text>
                </View>
              ))}
            </View>
          )}
        </View>
        <Shelf
          title="Cerita lainnya"
          items={catalog
            .filter((x) => x.type === detail.type && x.id !== detail.id)
            .slice(0, 4)}
          onOpen={setDetail}
          saved={saved}
        />
      </ScrollView>
    );
  };
  const renderProfile = () => (
    <ScrollView contentContainerStyle={s.profileContent}>
      <Text style={s.eyebrow}>RUANG PERSONAL</Text>
      <Text style={s.pageTitle}>Halo, pencinta cerita.</Text>
      <View style={s.profileCard}>
        <View style={s.profileAvatar}>
          <Text style={s.profileInitial}>R</Text>
        </View>
        <Text style={s.profileName}>Penonton CineShelf</Text>
        <Text style={s.sectionSub}>
          Satu tempat untuk semua cerita favorit.
        </Text>
        <View style={s.statRow}>
          <View style={s.stat}>
            <Text style={s.statNumber}>{saved.length}</Text>
            <Text style={s.sectionSub}>Watchlist</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.stat}>
            <Text style={s.statNumber}>{home?.total ?? 0}</Text>
            <Text style={s.sectionSub}>Koleksi judul</Text>
          </View>
        </View>
      </View>
      <Text style={[s.sectionTitle, { marginBottom: 15 }]}>
        Tentang aplikasi
      </Text>
      <View style={s.aboutCard}>
        <View style={s.aboutIcon}>
          <Icon name="film-outline" color={RED} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.spotlightTitle}>CineShelf</Text>
          <Text style={s.sectionSub}>
            Versi 0.2.0 · {isApi ? "Katalog API" : "Demo lokal"}
          </Text>
        </View>
      </View>
      <Text style={s.aboutText}>
        Temukan film dan serial, jelajahi ceritanya, lalu susun daftar
        tontonanmu sendiri.
      </Text>
      <View style={s.infoBox}>
        <Icon name="information-circle-outline" color={MUTED} size={20} />
        <Text style={s.infoText}>
          {isApi
            ? "Katalog diambil dari CineShelf API buatan sendiri."
            : "Mode demo memakai data contoh lokal, tanpa API."}{" "}
          Film dan serial contoh bersifat fiktif. Tidak menyediakan streaming.
          Foto ilustrasi dari Unsplash. Watchlist disimpan di perangkat.
        </Text>
      </View>
      <Text style={s.aboutText}>
        Dikembangkan oleh Muhammad Reka Fakhrezi · Teknik Komputer, Universitas
        Diponegoro.
      </Text>
      <View style={{ marginTop: 20 }}>
        <Button
          label="Sumber katalog"
          icon="server-outline"
          secondary
          onPress={openSettings}
        />
      </View>
      <View style={s.footerBrand}>
        <Text style={s.brand}>
          CINE<Text style={{ color: "white" }}>SHELF</Text>.
        </Text>
        <Text style={s.sectionSub}>A little escape. A great story.</Text>
      </View>
    </ScrollView>
  );
  return (
    <View
      style={[s.root, { paddingTop: inset.top, paddingBottom: inset.bottom }]}
    >
      <StatusBar barStyle="light-content" backgroundColor={BG} />
      <View style={s.frame}>
        <View style={{ flex: 1 }}>
          {!connectionReady
            ? renderMessage("Menyiapkan aplikasi.", null, true)
            : detail
              ? isApi && detailRequest.loading
                ? renderMessage("Mengambil detail judul.", null, true)
                : isApi && detailRequest.error
                  ? renderMessage(detailRequest.error, detailRequest.retry)
                  : detailItem
                    ? renderDetail()
                    : renderMessage(
                        "Judul tidak ditemukan.",
                        detailRequest.retry,
                      )
              : tab === "home"
                ? isApi && homeRequest.loading
                  ? renderMessage("Mengambil katalog dari API.", null, true)
                  : isApi && homeRequest.error
                    ? renderMessage(homeRequest.error, homeRequest.retry)
                    : renderHome()
                : tab === "profile"
                  ? renderProfile()
                  : renderList()}
        </View>
        <View style={s.tabbar}>
          {tabs.map((t) => (
            <Pressable
              key={t.id}
              accessibilityRole="tab"
              accessibilityLabel={t.label}
              accessibilityState={{ selected: tab === t.id }}
              onPress={() => navigate(t.id)}
              style={s.tab}
            >
              <View
                style={[
                  s.tabIndicator,
                  tab === t.id && { backgroundColor: RED },
                ]}
              />
              <Icon
                name={tab === t.id ? t.icon : `${t.icon}-outline`}
                size={23}
                color={tab === t.id ? RED : "#777B8D"}
              />
              <Text style={[s.tabText, tab === t.id && { color: RED }]}>
                {t.label}
              </Text>
              {t.id === "watchlist" && saved.length > 0 && (
                <View style={s.countBadge}>
                  <Text style={s.countBadgeText}>{saved.length}</Text>
                </View>
              )}
            </Pressable>
          ))}
        </View>
        {notice !== "" && (
          <View
            accessibilityLiveRegion="polite"
            pointerEvents="none"
            style={s.toast}
          >
            <Icon name="checkmark-circle" color={RED} size={20} />
            <Text style={s.toastText}>{notice}</Text>
          </View>
        )}
      </View>
      <Modal
        visible={settings}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!checking) setSettings(false);
        }}
      >
        <View style={s.modalBackdrop}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Sumber katalog</Text>
            <Text style={s.synopsis}>
              Hubungkan ke CineShelf API. Gunakan IP laptop jika HP berada di
              Wi-Fi yang sama, atau URL HTTPS backend online.
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
              placeholderTextColor={MUTED}
              style={s.urlInput}
            />
            {connectionError !== "" && (
              <Text accessibilityLiveRegion="polite" style={s.connectionError}>
                {connectionError}
              </Text>
            )}
            <View style={{ gap: 12, marginTop: 18 }}>
              <Button
                label={checking ? "Menghubungkan..." : "Uji dan hubungkan"}
                icon="link"
                disabled={checking}
                onPress={() => saveConnection("api")}
              />
              <Button
                label="Coba mode demo"
                icon="eye-outline"
                secondary
                disabled={checking}
                onPress={() => saveConnection("demo")}
              />
              <Button
                label="Tutup"
                icon="close"
                secondary
                disabled={checking}
                onPress={() => setSettings(false)}
              />
            </View>
          </View>
        </View>
      </Modal>
      <Modal
        visible={!!dialog}
        transparent
        animationType="fade"
        onRequestClose={() => setDialog(null)}
      >
        <View style={s.modalBackdrop}>
          <View style={s.modalCard}>
            <Icon name="information-circle-outline" size={36} color={RED} />
            <Text style={s.modalTitle}>{dialog?.title}</Text>
            <Text style={s.synopsis}>{dialog?.body}</Text>
            <View style={{ marginTop: 22 }}>
              <Button
                label="Mengerti"
                icon="checkmark"
                onPress={() => setDialog(null)}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
export default function App() {
  return (
    <SafeAreaProvider>
      <CineShelf />
    </SafeAreaProvider>
  );
}
const s = StyleSheet.create({
  pagination: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 15,
  },
  urlInput: {
    color: "white",
    borderWidth: 1,
    borderColor: "#444859",
    borderRadius: 10,
    padding: 12,
    marginTop: 18,
    fontSize: 13,
  },
  connectionError: {
    color: "#FF9BA6",
    fontSize: 12,
    lineHeight: 19,
    marginTop: 12,
  },
  root: { flex: 1, backgroundColor: BG },
  frame: { flex: 1, width: "100%", maxWidth: 1000, alignSelf: "center" },
  homeHeader: {
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 23,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brand: { fontSize: 22, fontWeight: "900", letterSpacing: 1, color: RED },
  brandDot: { fontSize: 29 },
  greeting: { color: MUTED, fontSize: 12, marginTop: 5 },
  avatar: {
    width: 39,
    height: 39,
    borderRadius: 14,
    backgroundColor: "#29202B",
    alignItems: "center",
    justifyContent: "center",
    borderColor: "#56313F",
    borderWidth: 1,
  },
  avatarText: { color: "#FF9BA6", fontWeight: "800", fontSize: 17 },
  hero: {
    marginHorizontal: 20,
    height: 420,
    borderRadius: 22,
    borderColor: "#252632",
    borderWidth: 1,
  },
  heroBadge: {
    position: "absolute",
    left: 18,
    top: 18,
    backgroundColor: "#0C0D12CC",
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  redDot: { width: 5, height: 5, borderRadius: 5, backgroundColor: RED },
  heroBadgeText: {
    color: "white",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.3,
  },
  heroBottom: { position: "absolute", bottom: 22, left: 20, right: 20 },
  eyebrow: { color: RED, fontSize: 10, fontWeight: "800", letterSpacing: 2 },
  heroTitle: {
    color: "white",
    fontSize: 45,
    fontWeight: "900",
    lineHeight: 45,
    letterSpacing: -1.5,
    marginTop: 10,
  },
  heroTagline: { color: "#C7C9D2", fontSize: 12, marginTop: 10 },
  heroMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 14,
    flexWrap: "wrap",
  },
  green: { color: "#8AD5AE", fontWeight: "700", fontSize: 12 },
  muted: { color: "#B7BAC6", fontSize: 12 },
  age: {
    color: "#D6D6DF",
    fontSize: 10,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: "#5E606C",
    borderRadius: 3,
  },
  actions: { flexDirection: "row", gap: 10, marginTop: 20 },
  button: {
    flex: 1,
    flexDirection: "row",
    gap: 7,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: RED,
    minHeight: 46,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  secondary: { backgroundColor: "#2B2D37" },
  buttonText: { color: "white", fontSize: 13, fontWeight: "700" },
  shelf: { marginTop: 29 },
  sectionHead: {
    paddingHorizontal: 24,
    marginBottom: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  sectionTitle: {
    color: "#F0F0F5",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  sectionSub: { fontSize: 11, color: MUTED, lineHeight: 18, marginTop: 3 },
  seeAll: { fontSize: 11, color: RED, fontWeight: "600" },
  shelfItems: { paddingHorizontal: 24, gap: 13 },
  poster: { borderRadius: 12, borderWidth: 1, borderColor: "#252732" },
  posterTop: {
    position: "absolute",
    left: 10,
    right: 10,
    top: 9,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  tinyBrand: { color: RED, fontSize: 18, fontWeight: "900" },
  savedDot: { backgroundColor: RED, borderRadius: 6, padding: 4 },
  posterTitle: { position: "absolute", left: 12, right: 9, bottom: 14 },
  posterKicker: {
    color: "#D4D4DC",
    fontSize: 7,
    letterSpacing: 2,
    fontWeight: "600",
    marginBottom: 5,
  },
  posterName: {
    color: "white",
    fontWeight: "900",
    letterSpacing: -0.7,
    lineHeight: 24,
  },
  cardTitle: {
    color: "#E7E8EE",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 9,
  },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 5 },
  cardMeta: { color: MUTED, fontSize: 10 },
  spotlight: {
    marginHorizontal: 24,
    marginTop: 28,
    padding: 16,
    borderWidth: 1,
    borderColor: "#33232E",
    borderRadius: 14,
    backgroundColor: "#19151F",
    flexDirection: "row",
    gap: 13,
    alignItems: "center",
  },
  spotlightIcon: {
    width: 39,
    height: 39,
    borderRadius: 12,
    backgroundColor: "#32212C",
    alignItems: "center",
    justifyContent: "center",
  },
  spotlightTitle: { color: "#EFEFF6", fontWeight: "700", fontSize: 14 },
  tabbar: {
    flexDirection: "row",
    backgroundColor: "#111218",
    borderTopWidth: 1,
    borderTopColor: "#24252F",
    paddingBottom: 10,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 49,
    gap: 5,
  },
  tabIndicator: {
    width: 16,
    height: 2,
    borderRadius: 3,
    position: "absolute",
    top: -8,
  },
  tabText: { fontSize: 9, color: "#777B8D", fontWeight: "600" },
  countBadge: {
    position: "absolute",
    top: 1,
    right: "24%",
    minWidth: 14,
    height: 14,
    backgroundColor: RED,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  countBadgeText: { fontSize: 8, color: "white", fontWeight: "800" },
  listHeader: { paddingHorizontal: 24, paddingTop: 26 },
  pageTitle: {
    fontSize: 29,
    color: "white",
    fontWeight: "800",
    letterSpacing: -1,
    marginTop: 11,
  },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#292B38",
    backgroundColor: "#191B24",
    borderRadius: 12,
    paddingHorizontal: 14,
    marginTop: 23,
    height: 49,
  },
  input: {
    flex: 1,
    color: "white",
    fontSize: 12,
    height: "100%",
    ...Platform.select({ web: { outlineStyle: "none" } }),
  },
  chips: { paddingHorizontal: 24, paddingTop: 17, paddingBottom: 18, gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: "#30323F",
    borderRadius: 20,
    paddingHorizontal: 17,
    paddingVertical: 9,
  },
  chipActive: { backgroundColor: RED, borderColor: RED },
  chipText: { color: "#A8ABBB", fontSize: 11, fontWeight: "600" },
  grid: { paddingHorizontal: 24, paddingBottom: 20 },
  resultCount: { color: MUTED, fontSize: 11, marginBottom: 17 },
  empty: { alignItems: "center", paddingVertical: 45, gap: 12 },
  emptyIcon: { backgroundColor: "#241B26", borderRadius: 22, padding: 20 },
  emptyTitle: { color: "white", fontSize: 20, fontWeight: "700" },
  emptyText: {
    color: MUTED,
    fontSize: 13,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 13,
    maxWidth: 280,
  },
  detailArt: { height: 350 },
  back: {
    position: "absolute",
    top: 18,
    left: 22,
    backgroundColor: "#101116CC",
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  detailArtText: { position: "absolute", bottom: 22, left: 24, right: 24 },
  detailArtTitle: {
    color: "white",
    fontSize: 38,
    fontWeight: "900",
    letterSpacing: -1,
    lineHeight: 40,
    marginTop: 10,
  },
  detailBody: { paddingHorizontal: 24 },
  genreLabel: { color: RED, fontSize: 11, fontWeight: "700", marginTop: 16 },
  detailTagline: {
    color: "#E4E4ED",
    fontSize: 15,
    fontWeight: "600",
    marginTop: 9,
  },
  synopsis: { color: "#B0B3C1", fontSize: 13, lineHeight: 23 },
  credits: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#252732",
    paddingTop: 15,
    gap: 8,
  },
  creditLine: { color: "#C6C8D2", fontSize: 11, lineHeight: 19 },
  creditKey: { color: "#777C91" },
  episode: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    borderBottomColor: "#252732",
    borderBottomWidth: 1,
    paddingBottom: 15,
    paddingTop: 8,
  },
  episodeNumber: { color: "#696D82", fontSize: 23, fontWeight: "800" },
  demoBadge: {
    fontSize: 8,
    color: "#A4A7B4",
    borderWidth: 1,
    borderColor: "#424552",
    padding: 5,
    borderRadius: 4,
  },
  profileContent: { padding: 24, paddingBottom: 35 },
  profileCard: {
    marginTop: 26,
    marginBottom: 30,
    backgroundColor: "#191B25",
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2C2E3B",
  },
  profileAvatar: {
    width: 70,
    height: 70,
    borderRadius: 23,
    backgroundColor: "#442630",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  profileInitial: { color: "#FF9BA6", fontSize: 32, fontWeight: "800" },
  profileName: { color: "white", fontSize: 20, fontWeight: "800" },
  statRow: { flexDirection: "row", marginTop: 25, alignItems: "center" },
  stat: { flex: 1, alignItems: "center" },
  statNumber: { color: "white", fontSize: 25, fontWeight: "800" },
  statDivider: { height: 35, width: 1, backgroundColor: "#363847" },
  aboutCard: { flexDirection: "row", gap: 12, alignItems: "center" },
  aboutIcon: {
    width: 45,
    height: 45,
    backgroundColor: "#28202B",
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  aboutText: { color: "#B0B3C1", fontSize: 13, lineHeight: 23, marginTop: 16 },
  infoBox: {
    marginTop: 24,
    padding: 16,
    borderRadius: 13,
    backgroundColor: "#191B24",
    flexDirection: "row",
    gap: 10,
  },
  infoText: { flex: 1, color: MUTED, fontSize: 11, lineHeight: 19 },
  footerBrand: { alignItems: "center", marginTop: 40, gap: 5 },
  toast: {
    position: "absolute",
    bottom: 85,
    left: 22,
    right: 22,
    backgroundColor: "#2B2D39",
    borderColor: "#464959",
    borderWidth: 1,
    borderRadius: 12,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  toastText: { flex: 1, color: "white", fontSize: 12 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "#000000B8",
    alignItems: "center",
    justifyContent: "center",
    padding: 25,
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#1A1C26",
    padding: 25,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#3B3E4C",
  },
  modalTitle: {
    color: "white",
    fontSize: 22,
    fontWeight: "800",
    marginTop: 15,
    marginBottom: 13,
  },
});
