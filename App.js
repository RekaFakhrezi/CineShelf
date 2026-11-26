import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  View,
  StyleSheet,
  StatusBar,
  Text,
  ActivityIndicator,
  Modal,
  BackHandler,
  useWindowDimensions,
  Animated,
} from "react-native";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Constants & Theme
import { MotionProvider, useReducedMotion } from "./src/hooks/useReducedMotion";
import { THEME, STORAGE_KEYS } from "./src/constants/theme";

// Demo Data & Utils
import {
  catalog as demoCatalog,
  genres as demoGenres,
  filterCatalog,
} from "./catalog";

// Services & Hooks
import { createApi, normalizeApiUrl } from "./src/services/api";
import { defaultApiUrl } from "./src/services/config";
import { useRequest, useDebounced } from "./src/hooks/useRequest";
import { useAuth } from "./src/hooks/useAuth";
import { useLibrary } from "./src/hooks/useLibrary";
import { AuthScreen } from "./src/screens/AuthScreen";
import { Button } from "./src/components/common/Button";

import { AddTitleModal } from "./src/components/catalog/AddTitleModal";
import { ScalePressable } from "./src/components/common/ScalePressable";
import { Icon } from "./src/components/common/Icon";

// Navigation Components
import { TopCapsuleHeader } from "./src/components/navigation/TopCapsuleHeader";
import { FloatingBottomCapsule } from "./src/components/navigation/FloatingBottomCapsule";

// Feedback Components
import { ToastNotification } from "./src/components/feedback/ToastNotification";
import { SettingsModal } from "./src/components/feedback/SettingsModal";
import { InfoDialog } from "./src/components/feedback/InfoDialog";
import { MessageState } from "./src/components/feedback/MessageState";
import { HomeSkeleton } from "./src/components/feedback/HomeSkeleton";
import { DetailSkeleton } from "./src/components/feedback/DetailSkeleton";
import { SearchModal } from "./src/components/search/SearchModal";
import { CineRouletteModal } from "./src/components/home/CineRouletteModal";
import { CreateShelfModal } from "./src/components/shelves/CreateShelfModal";
import { AddToShelfModal } from "./src/components/shelves/AddToShelfModal";

// Screen Components
import { HomeScreen } from "./src/screens/HomeScreen";
import { ListScreen } from "./src/screens/ListScreen";
import { DetailScreen } from "./src/screens/DetailScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";

function CineShelf({ connection, openSettings: showSettings, auth, onRequestLogin }) {
  const reducedMotion = useReducedMotion();
  const inset = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  // Navigation & filter state
  const [tab, setTab] = useState("home");
  const [addingTitle, setAddingTitle] = useState(false);
  const [catalogRevision, setCatalogRevision] = useState(0);
  const [detail, setDetail] = useState(null);
  const [searchModal, setSearchModal] = useState(false);
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("Semua");
  const [page, setPage] = useState(1);
  const [isScrolled, setIsScrolled] = useState(false);

  const signedIn = !!auth.session;
  const account = useLibrary(connection.url, auth.getToken, signedIn);
  const { saved, shelves, watchedList, userRatings, userReactions } = account.library;
  const ready = account.ready;
  const updateField = (field, value) => {
    if (!signedIn || !ready) return;
    account.setLibrary(previous => ({
      ...previous,
      [field]: typeof value === "function" ? value(previous[field]) : value,
    }));
  };
  const setSaved = value => updateField("saved", value);
  const setShelves = value => updateField("shelves", value);
  const setWatchedList = value => updateField("watchedList", value);
  const setUserRatings = value => updateField("userRatings", value);
  const setUserReactions = value => updateField("userReactions", value);
  const [activeShelfId, setActiveShelfId] = useState("all");
  const [createShelfModal, setCreateShelfModal] = useState(false);
  const [addToShelfItem, setAddToShelfItem] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);

  function canEditLibrary() {
    if (!signedIn) {
      onRequestLogin();
      return false;
    }
    return ready;
  }

  function openCreateShelf() {
    if (canEditLibrary()) setCreateShelfModal(true);
  }

  // CineRoulette / Mood State
  const [rouletteModal, setRouletteModal] = useState(false);
  const [rouletteMood, setRouletteMood] = useState("all");

  const [notice, setNotice] = useState(null);
  const [dialog, setDialog] = useState(null);

  // Scroll references for instant clean reset on navigation
  const homeScrollRef = useRef(null);
  const listScrollRef = useRef(null);
  const profileScrollRef = useRef(null);
  const detailScrollRef = useRef(null);

  // Transition animations
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const toastAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reducedMotion) { fadeAnim.stopAnimation(); fadeAnim.setValue(1); }
    return () => fadeAnim.stopAnimation();
  }, [reducedMotion, fadeAnim]);

  const triggerScreenTransition = () => {
    fadeAnim.stopAnimation();
    if (reducedMotion) { fadeAnim.setValue(1); return; }
    fadeAnim.setValue(0.7);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 160,
      useNativeDriver: true,
    }).start();
  };


  const api = createApi(connection.url);
  const isApi = connection.mode === "api";

  const homeRequest = useRequest(
    async (signal) => {
      const [homeData, genresData] = await Promise.all([
        api.home(signal),
        api.genres(signal),
      ]);
      return { home: homeData.data, genres: genresData.data };
    },
    [connection.url, catalogRevision],
    isApi,
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


  // Toast notice timeout & animation
  useEffect(() => {
    if (!notice?.text) return;
    toastAnim.setValue(0);
    Animated.spring(toastAnim, {
      toValue: 1,
      friction: 7,
      tension: 90,
      useNativeDriver: true,
    }).start();

    const t = setTimeout(() => {
      Animated.timing(toastAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start(() => setNotice(null));
    }, 2800);
    return () => clearTimeout(t);
  }, [notice]);

  // Hardware back press on Android
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (rouletteModal) {
        setRouletteModal(false);
        return true;
      }
      if (createShelfModal) {
        setCreateShelfModal(false);
        return true;
      }
      if (addToShelfItem) {
        setAddToShelfItem(null);
        return true;
      }
      if (searchModal) {
        setSearchModal(false);
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
        navigate("home");
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [
    detail,
    tab,
    dialog,
    searchModal,
    rouletteModal,
    createShelfModal,
    addToShelfItem,
  ]);

  // Shelves helper functions
  const handleCreateShelf = (name, icon) => {
    if (!canEditLibrary()) return;
    const newShelf = {
      id: `shelf_${Date.now()}`,
      name,
      icon,
      isDefault: false,
      items: [],
    };
    setShelves((prev) => [...prev, newShelf]);
    setActiveShelfId(newShelf.id);
    setNotice({
      text: `Rak "${name}" berhasil dibuat!`,
      type: "save",
    });
  };

  const handleDeleteShelf = (shelfId) => {
    if (!canEditLibrary()) return;
    setShelves((prev) => prev.filter((s) => s.id !== shelfId));
    if (activeShelfId === shelfId) {
      setActiveShelfId("all");
    }
    setNotice({
      text: "Rak berhasil dihapus",
      type: "info",
    });
  };


  // Watched & Rating helpers
  const handleToggleWatched = (itemId) => {
    if (!canEditLibrary()) return;
    setWatchedList((prev) => {
      const exists = prev.includes(itemId);
      const updated = exists
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId];
      setNotice({
        text: exists
          ? "Status tontonan diubah: Belum Nonton"
          : "Ditandai sebagai Sudah Ditonton! 🎉",
        type: exists ? "info" : "save",
      });
      return updated;
    });
  };

  const handleRate = (itemId, stars) => {
    if (!canEditLibrary()) return;
    setUserRatings((prev) => ({
      ...prev,
      [itemId]: prev[itemId] === stars ? 0 : stars,
    }));
  };

  const handleReact = (itemId, emoji) => {
    if (!canEditLibrary()) return;
    setUserReactions((prev) => {
      const next = { ...prev };
      if (emoji) next[itemId] = emoji;
      else delete next[itemId];
      return next;
    });
  };

  const handleSelectMood = (mood) => {
    setRouletteMood(mood);
    setRouletteModal(true);
  };

  const handleOpenRoulette = () => {
    setRouletteMood("all");
    setRouletteModal(true);
  };

  function navigate(id) {
    if (tab !== id || detail) {
      setTab(id);
      setPage(1);
      setDetail(null);
      setQuery("");
      setGenre("Semua");
      setIsScrolled(false);
      triggerScreenTransition();
      // Reset scroll position cleanly to prevent jitter
      setTimeout(() => {
        homeScrollRef.current?.scrollTo?.({ y: 0, animated: false });
        listScrollRef.current?.scrollToOffset?.({ offset: 0, animated: false });
        profileScrollRef.current?.scrollTo?.({ y: 0, animated: false });
      }, 0);
    }
  }

  function handleOpenDetail(item) {
    setDetail(item);
    setIsScrolled(false);
    triggerScreenTransition();
    setTimeout(() => {
      detailScrollRef.current?.scrollTo?.({ y: 0, animated: false });
    }, 0);
  }

  function handleOpenSearch() {
    setSearchModal(true);
  }

  function toggle(item) {
    if (!canEditLibrary()) return;
    setAddToShelfItem(item);
  }

  const handleApplyShelves = (item, selectedShelfIds, inWatchlist) => {
    if (!canEditLibrary()) return;
    const shouldSave = inWatchlist || selectedShelfIds.length > 0;

    setSaved((prev) => {
      const exists = prev.includes(item.id);
      if (shouldSave && !exists) {
        return [...prev, item.id];
      } else if (!shouldSave && exists) {
        return prev.filter((id) => id !== item.id);
      }
      return prev;
    });

    setShelves((prev) =>
      prev.map((shelf) => {
        if (shelf.isDefault) return shelf;
        const currentItems = shelf.items || [];
        const isChecked = selectedShelfIds.includes(shelf.id);
        const alreadyInShelf = currentItems.includes(item.id);

        if (isChecked && !alreadyInShelf) {
          return { ...shelf, items: [...currentItems, item.id] };
        } else if (!isChecked && alreadyInShelf) {
          return { ...shelf, items: currentItems.filter((id) => id !== item.id) };
        }
        return shelf;
      }),
    );

    const shelfNames = shelves
      .filter((s) => selectedShelfIds.includes(s.id))
      .map((s) => s.name);

    const targetText =
      shelfNames.length > 0
        ? `rak ${shelfNames.join(", ")}`
        : "Watchlist";

    setNotice({
      text: shouldSave
        ? `"${item.title}" disimpan ke ${targetText}!`
        : `"${item.title}" dihapus dari Watchlist.`,
      type: shouldSave ? "save" : "unsave",
    });
  };

  const handleRemoveFromWatchlist = (item) => {
    if (!canEditLibrary()) return;
    setSaved((prev) => prev.filter((id) => id !== item.id));
    setShelves((prev) =>
      prev.map((shelf) => {
        if (shelf.isDefault) return shelf;
        return {
          ...shelf,
          items: (shelf.items || []).filter((id) => id !== item.id),
        };
      }),
    );
    setNotice({
      text: `"${item.title}" dihapus dari Watchlist`,
      type: "unsave",
    });
  };

  const debouncedQuery = useDebounced(query);
  const listRequest = useRequest(
    (signal) => api.list(tab, { q: debouncedQuery, genre, page }, signal),
    [connection.url, tab, debouncedQuery, genre, page, catalogRevision],
    isApi && ["film", "serial"].includes(tab),
  );

  const allSavedIds = useMemo(() => {
    const shelfIds = (shelves || []).flatMap((s) => s.items || []);
    return Array.from(new Set([...(saved || []), ...shelfIds]));
  }, [saved, shelves]);

  const savedRequest = useRequest(
    (signal) => api.resolve(allSavedIds, signal),
    [connection.url, JSON.stringify(allSavedIds)],
    signedIn && ready && isApi && tab === "watchlist",
  );

  const detailRequest = useRequest(
    (signal) => api.detail(detail, signal),
    [connection.url, detail?.id, detail?.type],
    isApi && !!detail,
  );

  const detailItem = isApi ? detailRequest.data?.data : detail;
  const featured = home?.featured || catalog[0];

  const columns = width > 768 ? 4 : width > 480 ? 3 : 2;
  const contentMaxWidth = 1040;
  const gridWidth =
    (Math.min(width, contentMaxWidth) - 48 - (columns - 1) * 14) / columns;

  // Merge all known items across active catalog and demoCatalog
  const allKnownCatalog = [
    ...(catalog || []),
    ...demoCatalog.filter((d) => !(catalog || []).some((c) => c.id === d.id)),
  ];

  const apiResolved = savedRequest.data?.data || [];
  const watchlistBaseItems = isApi
    ? [
        ...apiResolved,
        ...allKnownCatalog
          .filter((x) => allSavedIds.includes(x.id))
          .filter((x) => !apiResolved.some((r) => r.id === x.id)),
      ]
    : demoCatalog.filter((x) => allSavedIds.includes(x.id));

  const shelfFilteredItems =
    tab !== "watchlist" || activeShelfId === "all"
      ? watchlistBaseItems
      : watchlistBaseItems.filter((x) => {
          const s = shelves.find((shelf) => shelf.id === activeShelfId);
          return (s?.items || []).includes(x.id);
        });

  const items =
    tab === "watchlist"
      ? filterCatalog(shelfFilteredItems, query, genre)
      : isApi
      ? listRequest.data?.data || []
      : filterCatalog(
          demoCatalog.filter((x) => x.type === tab),
          query,
          genre,
        );

  const shelfCounts = {
    all: allSavedIds.length,
    ...shelves.reduce((acc, s) => {
      if (!s.isDefault) {
        acc[s.id] = (s.items || []).length;
      }
      return acc;
    }, {}),
  };

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


  const handleScroll = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    if (offsetY > 15 && !isScrolled) setIsScrolled(true);
    else if (offsetY <= 15 && isScrolled) setIsScrolled(false);
  };

  const contentTopPadding = Math.max(inset.top, 8) + 68;
  const contentBottomPadding = Math.max(inset.bottom, 14) + 80;

  const heroItems = (
    catalog && catalog.length >= 5
      ? catalog.slice(0, 5)
      : home?.movies && home.movies.length
      ? [...home.movies, ...(home.series || [])].slice(0, 5)
      : [featured]
  ).filter(Boolean);
  async function openSettings() {
    try {
      if (ready) await account.flush();
      showSettings();
    } catch (e) {
      setNotice({ text: e.message, type: "info" });
    }
  }

  async function logout() {
    setLoggingOut(true);
    try {
      await account.flush();
      return await auth.logout();
    } catch (e) {
      setNotice({ text: e.message, type: "info" });
    } finally {
      setLoggingOut(false);
    }
  }

  if (!ready) {
    return <View style={[s.rootContainer, s.accountLoading]}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.bg} />
      {account.error ? <>
        <Text style={s.accountMessage}>{account.error}</Text>
        <Button label="Coba lagi" onPress={account.retry} />
        <Button label="Pengaturan koneksi" secondary onPress={openSettings} />
        <Button label="Keluar akun" ghost onPress={auth.logout} />
      </> : <>
        <ActivityIndicator color={THEME.accentSoft} />
        <Text style={s.accountMessage}>Memuat rak akunmu…</Text>
      </>}
    </View>;
  }

  return (
    <View style={s.rootContainer}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.bg} />

      {/* TOP FLOATING CAPSULE HEADER */}
      <TopCapsuleHeader
        tab={tab}
        navigate={navigate}
        savedCount={saved.length}
        openSettings={openSettings}
        isApi={isApi}
        isScrolled={isScrolled}
        width={width}
        topInset={inset.top}
        onOpenSearch={handleOpenSearch}
      />

      {/* Main Content Area with Animated Transition */}
      <View style={s.mainFrame}>
        <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0.7, 1], outputRange: [4, 0], extrapolate: "clamp" }) }] }}>
          {detail ? (
            isApi && detailRequest.loading ? (
              <DetailSkeleton
                contentTopPadding={contentTopPadding}
                contentBottomPadding={contentBottomPadding}
              />
            ) : isApi && detailRequest.error ? (
              <MessageState
                message={detailRequest.error}
                retry={detailRequest.retry}
                openSettings={openSettings}
              />
            ) : detailItem ? (
              <DetailScreen
                detailScrollRef={detailScrollRef}
                detailItem={detailItem}
                onClose={() => { setDetail(null); triggerScreenTransition(); }}
                saved={allSavedIds}
                ready={ready}
                onToggleSave={toggle}
                catalog={catalog}
                onOpenDetail={handleOpenDetail}
                handleScroll={handleScroll}
                contentTopPadding={contentTopPadding}
                contentBottomPadding={contentBottomPadding}
                onOpenAddToShelf={toggle}
                watchedList={watchedList}
                onToggleWatched={handleToggleWatched}
                userRatings={userRatings}
                onRate={handleRate}
                userReactions={userReactions}
                onReact={handleReact}
              />
            ) : (
              <MessageState
                message="Judul tidak ditemukan."
                retry={detailRequest.retry}
                openSettings={openSettings}
              />
            )
          ) : tab === "home" ? (
            isApi && homeRequest.loading ? (
              <HomeSkeleton
                contentTopPadding={contentTopPadding}
                contentBottomPadding={contentBottomPadding}
              />
            ) : isApi && homeRequest.error ? (
              <MessageState
                message={homeRequest.error}
                retry={homeRequest.retry}
                openSettings={openSettings}
              />
            ) : (
              <HomeScreen
                homeScrollRef={homeScrollRef}
                handleScroll={handleScroll}
                contentTopPadding={contentTopPadding}
                contentBottomPadding={contentBottomPadding}
                heroItems={heroItems}
                saved={allSavedIds}
                ready={ready}
                onOpenDetail={handleOpenDetail}
                onToggleSave={toggle}
                movies={home?.movies || []}
                series={home?.series || []}
                navigate={navigate}
                onSelectMood={handleSelectMood}
                onOpenRoulette={handleOpenRoulette}
              />
            )
          ) : tab === "profile" ? (
            <ProfileScreen
              profileScrollRef={profileScrollRef}
              user={auth.session?.user}
              getProfile={auth.getProfile}
              updateProfile={auth.updateProfile}
              onLogin={onRequestLogin}
              onLogout={logout}
              loggingOut={loggingOut}
              syncStatus={!signedIn ? "" : account.saving ? "Menyimpan perubahan…" : account.error ? "Perubahan belum tersimpan" : "Tersimpan di akun"}
              savedCount={saved.length}
              totalTitles={home?.total ?? catalog.length}
              watchedCount={watchedList.length}
              shelvesCount={shelves.filter((s) => !s.isDefault).length}
              isApi={isApi}
              connectionUrl={connection.url}
              openSettings={openSettings}
              handleScroll={handleScroll}
              contentTopPadding={contentTopPadding}
              contentBottomPadding={contentBottomPadding}
            />
          ) : tab === "watchlist" && !signedIn ? (
            <View style={[s.accountLoading, { flex: 1, paddingTop: contentTopPadding, paddingBottom: contentBottomPadding }]}>
              <Icon name="bookmark-outline" size={40} color={THEME.accentSoft} />
              <Text style={s.guestTitle}>Watchlist khusus akunmu</Text>
              <Text style={s.accountMessage}>Masuk atau buat akun untuk menyimpan film dan menyusun rak pribadi.</Text>
              <Button label="Masuk / Daftar" icon="log-in-outline" onPress={onRequestLogin} />
            </View>
          ) : (
            <ListScreen
              listScrollRef={listScrollRef}
              tab={tab}
              columns={columns}
              gridWidth={gridWidth}
              items={items}
              genres={genres}
              genre={genre}
              setGenre={setGenre}
              query={query}
              setQuery={setQuery}
              page={page}
              setPage={setPage}
              listLoading={listLoading}
              listError={listError}
              reloadList={reloadList}
              totalPages={listRequest.data?.pagination?.totalPages || 0}
              isApi={isApi}
              ready={ready}
              saved={allSavedIds}
              onOpenDetail={handleOpenDetail}
              onToggleSave={toggle}
              handleScroll={handleScroll}
              contentTopPadding={contentTopPadding}
              contentBottomPadding={contentBottomPadding}
              navigate={navigate}
              openSettings={openSettings}
              shelves={shelves}
              activeShelfId={activeShelfId}
              onSelectShelf={setActiveShelfId}
              onOpenCreateShelf={openCreateShelf}
              shelfCounts={shelfCounts}
              onDeleteShelf={handleDeleteShelf}
            />
          )}
        </Animated.View>
      </View>
      {!!account.error && <View style={[s.syncBanner, { top: Math.max(inset.top, 8) + 68 }]}>
        <Text style={s.accountMessage}>{account.error}</Text>
        <Button label="Simpan ulang" size="sm" onPress={account.retry} />
      </View>}

      {isApi && !detail && tab !== "profile" && <View pointerEvents="box-none" style={[s.addButtonFrame, { bottom: Math.max(inset.bottom, 14) + 82 }]}>
        <ScalePressable onPress={() => { if (signedIn) setAddingTitle(true); else onRequestLogin(); }} accessibilityLabel="Tambah film atau serial"
          containerStyle={{ alignSelf: "flex-end", marginRight: 20 }} style={s.addButton}>
          <Icon name="add" size={27} color="white" />
        </ScalePressable>
      </View>}
      <AddTitleModal visible={signedIn && addingTitle} initialType={tab === "serial" ? "serial" : "film"}
        genres={genres.filter(value => value !== "Semua")} api={api} getToken={auth.getToken} onClose={() => setAddingTitle(false)}
        onCreated={item => {
          setAddingTitle(false); setCatalogRevision(value => value + 1); handleOpenDetail(item);
          setNotice({ text: "Judul berhasil ditambahkan ke katalog", type: "save" });
        }} />

      {/* BOTTOM FLOATING CAPSULE NAVBAR */}
      <FloatingBottomCapsule
        tab={tab}
        navigate={navigate}
        savedCount={allSavedIds.length}
        bottomInset={inset.bottom}
      />

      {/* Toast Notification (Top Floating Island) */}
      <ToastNotification
        notice={notice}
        toastAnim={toastAnim}
        topInset={inset.top}
      />


      {/* Generic Info Dialog */}
      <InfoDialog dialog={dialog} onClose={() => setDialog(null)} />

      {/* Global Search Bottom Sheet Modal */}
      <SearchModal
        visible={searchModal}
        onClose={() => setSearchModal(false)}
        catalog={catalog}
        onOpenDetail={handleOpenDetail}
      />

      {/* CineRoulette & Mood Matcher Modal */}
      <CineRouletteModal
        visible={rouletteModal}
        initialMood={rouletteMood}
        onClose={() => setRouletteModal(false)}
        catalog={catalog}
        onOpenDetail={handleOpenDetail}
      />

      {/* Create Custom Shelf Modal */}
      <CreateShelfModal
        visible={createShelfModal}
        onClose={() => setCreateShelfModal(false)}
        onCreateShelf={handleCreateShelf}
      />

      {/* Save & Thematic Shelf Modal */}
      <AddToShelfModal
        visible={!!addToShelfItem}
        item={addToShelfItem}
        saved={allSavedIds}
        shelves={shelves}
        onClose={() => setAddToShelfItem(null)}
        onApplyShelves={handleApplyShelves}
        onRemoveFromWatchlist={handleRemoveFromWatchlist}
        onOpenCreateShelf={openCreateShelf}
      />
    </View>
  );
}
function AccountGate() {
  const [connection, setConnection] = useState({ mode: "api", url: defaultApiUrl() });
  const [connectionReady, setConnectionReady] = useState(false);
  const [settings, setSettings] = useState(false);
  const [urlDraft, setUrlDraft] = useState("");
  const [connectionError, setConnectionError] = useState("");
  const [checking, setChecking] = useState(false);
  const [loginVisible, setLoginVisible] = useState(false);
  const auth = useAuth(connection.url, connectionReady);

  useEffect(() => {
    if (auth.session) setLoginVisible(false);
  }, [auth.session]);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEYS.CONNECTION).then(raw => {
      if (!raw || !active) return;
      const stored = JSON.parse(raw);
      if (["api", "demo"].includes(stored.mode)) {
        setConnection({ mode: stored.mode, url: normalizeApiUrl(stored.url) });
      }
    }).catch(() => {}).finally(() => {
      if (active) setConnectionReady(true);
    });
    return () => { active = false; };
  }, []);

  function openSettings() {
    setUrlDraft(connection.url);
    setConnectionError("");
    setSettings(true);
  }

  async function saveConnection(mode) {
    setChecking(true);
    setConnectionError("");
    try {
      const url = normalizeApiUrl(urlDraft || connection.url);
      if (mode === "api") {
        const result = await createApi(url).health();
        if (result.status !== "ok" || result.service !== "cineshelf-api") throw Error("URL ini bukan CineShelf API.");
      }
      const next = { mode, url };
      await AsyncStorage.setItem(STORAGE_KEYS.CONNECTION, JSON.stringify(next));
      setConnection(next);
      setSettings(false);
    } catch (e) {
      setConnectionError(e.message);
    } finally {
      setChecking(false);
    }
  }

  return <View style={s.rootContainer}>
    <StatusBar barStyle="light-content" backgroundColor={THEME.bg} />
    {!connectionReady || !auth.ready ? <View style={[s.rootContainer, s.accountLoading]}>
      <ActivityIndicator color={THEME.accentSoft} />
      <Text style={s.accountMessage}>Membuka CineShelf…</Text>
    </View> : <CineShelf
      key={`${connection.url}:${auth.session?.user.id || "guest"}`}
      connection={connection} openSettings={openSettings} auth={auth}
      onRequestLogin={() => setLoginVisible(true)}
    />}
    <Modal visible={loginVisible && !auth.session} animationType="slide"
      onRequestClose={() => { if (!auth.busy) setLoginVisible(false); }}>
      <AuthScreen auth={auth} openSettings={openSettings} onClose={() => setLoginVisible(false)} />
    </Modal>
    <SettingsModal visible={settings} onClose={() => setSettings(false)}
      checking={checking} urlDraft={urlDraft} setUrlDraft={setUrlDraft}
      connectionError={connectionError} onSaveConnection={saveConnection} />
  </View>;
}


export default function App() {
  return (
    <SafeAreaProvider>
      <MotionProvider><AccountGate /></MotionProvider>
    </SafeAreaProvider>
  );
}

const s = StyleSheet.create({
  accountLoading: { justifyContent: "center", alignItems: "center", gap: 16, padding: 24 },
  accountMessage: { color: THEME.textSecondary, fontSize: 14, lineHeight: 21, textAlign: "center" },
  guestTitle: { color: THEME.textPrimary, fontSize: 22, fontWeight: "800", textAlign: "center" },
  syncBanner: { position: "absolute", alignSelf: "center", maxWidth: 480, backgroundColor: THEME.bgElevated, borderColor: THEME.accentSoft, borderWidth: 1, borderRadius: 12, padding: 14, marginHorizontal: 16, zIndex: 200 },
  addButtonFrame: { position: "absolute", left: 0, right: 0, width: "100%", maxWidth: 1040, alignSelf: "center", zIndex: 80 },
  addButton: { width: 54, height: 54, borderRadius: 27, alignItems: "center", justifyContent: "center", backgroundColor: THEME.accent, borderWidth: 1, borderColor: "rgba(255,255,255,0.2)", ...THEME.raisedShadow },
  rootContainer: {
    flex: 1,
    backgroundColor: THEME.bg,
  },
  mainFrame: {
    flex: 1,
    width: "100%",
    maxWidth: 1040,
    alignSelf: "center",
  },
});
