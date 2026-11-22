import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { THEME } from "../constants/theme";
import { Icon } from "../components/common/Icon";
import { Button } from "../components/common/Button";
import { ScalePressable } from "../components/common/ScalePressable";
import { Poster } from "../components/home/Poster";
import { MovieListItem } from "../components/home/MovieListItem";
import { MessageState } from "../components/feedback/MessageState";
import { ListSkeleton } from "../components/feedback/ListSkeleton";
import { ShelfSelector } from "../components/shelves/ShelfSelector";
import { TechKicker } from "../components/common/DitherAccent";

// Extracted Header Component preserving input focus and decluttering layout
function ListHeader({
  tab,
  query,
  setQuery,
  setPage,
  genres,
  genre,
  setGenre,
  itemCount,
  listLoading,
  shelves,
  activeShelfId,
  onSelectShelf,
  onOpenCreateShelf,
  shelfCounts,
  onDeleteShelf,
  viewMode,
  onChangeViewMode,
}) {
  const currentShelf = (shelves || []).find((s) => s.id === activeShelfId);

  return (
    <View style={s.listHeaderBox}>
      {/* 1. Cohesive Header Title & Action Row */}
      <View style={s.headerTitleRow}>
        <View style={{ flex: 1, gap: 2 }}>
          
          <Text style={s.pageMainTitle}>
            {tab === "film"
              ? "Film"
              : tab === "serial"
                ? "Serial"
                : "Watchlist saya"}
          </Text>
          <Text style={s.pageSubText}>
            {tab === "watchlist"
              ? "Kelola tontonanmu ke dalam rak tematik."
              : "Cari judul atau pilih genre yang kamu suka."}
          </Text>
        </View>

        {/* Create Shelf CTA Button (Top Right) */}
        {tab === "watchlist" && onOpenCreateShelf && (
          <ScalePressable
            onPress={onOpenCreateShelf}
            style={s.headerCreateShelfBtn}
            accessibilityLabel="Buat rak tematik baru"
          >
            <Icon name="add" size={15} color="white" />
            <Text style={s.headerCreateShelfText}>Rak Baru</Text>
          </ScalePressable>
        )}
      </View>

      {/* 2. Thematic Shelves Selector (Only on Watchlist tab) */}
      {tab === "watchlist" && shelves && (
        <ShelfSelector
          shelves={shelves}
          activeShelfId={activeShelfId}
          onSelectShelf={onSelectShelf}
          onOpenCreateShelf={onOpenCreateShelf}
          shelfCounts={shelfCounts}
          onDeleteShelf={onDeleteShelf}
        />
      )}

      {/* 3. Search Bar + Dual View Toggle Toolbar */}
      <View style={s.toolbarRow}>
        <View style={s.searchBarContainer}>
          <Icon name="search-outline" size={18} color={THEME.textMuted} />
          <TextInput
            accessibilityLabel="Cari judul, genre, atau pemeran"
            placeholder="Cari judul, genre, atau pemeran..."
            placeholderTextColor={THEME.textMuted}
            style={s.searchInput}
            value={query}
            onChangeText={(val) => {
              setQuery(val);
              setPage(1);
            }}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {listLoading && query !== "" ? (
            <ActivityIndicator size="small" color={THEME.accent} style={{ marginRight: 4 }} />
          ) : query !== "" ? (
            <ScalePressable
              onPress={() => {
                setQuery("");
                setPage(1);
              }}
              accessibilityLabel="Hapus pencarian"
            >
              <Icon name="close-circle" size={18} color={THEME.textMuted} />
            </ScalePressable>
          ) : null}
        </View>

        {/* View Mode Segmented Pill Toggle: [ ⊞ Grid ] [ ☰ List ] */}
        <View style={s.viewToggleSegment}>
          <ScalePressable
            onPress={() => onChangeViewMode("grid")}
            style={[s.viewToggleBtn, viewMode === "grid" && s.viewToggleBtnActive]}
            accessibilityLabel="Tampilan grid kartu poster"
            accessibilityState={{ selected: viewMode === "grid" }}
          >
            <Icon
              name="grid"
              size={15}
              color={viewMode === "grid" ? "white" : THEME.textMuted}
            />
          </ScalePressable>
          <ScalePressable
            onPress={() => onChangeViewMode("list")}
            style={[s.viewToggleBtn, viewMode === "list" && s.viewToggleBtnActive]}
            accessibilityLabel="Tampilan baris list"
            accessibilityState={{ selected: viewMode === "list" }}
          >
            <Icon
              name="list"
              size={16}
              color={viewMode === "list" ? "white" : THEME.textMuted}
            />
          </ScalePressable>
        </View>
      </View>

      {/* 4. Genre Filter Pills: only shown on Film and Serial tabs to avoid double-chip clutter on Watchlist */}
      {tab !== "watchlist" && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.genreChipsScroll}
        >
          {genres.map((g) => {
            const active = genre === g;
            return (
              <ScalePressable
                key={g}
                accessibilityRole="button"
                accessibilityLabel={`Genre ${g}`}
                accessibilityState={{ selected: active }}
                onPress={() => {
                  setGenre(g);
                  setPage(1);
                }}
                style={[s.chipPill, active && s.chipPillActive]}
              >
                <Text style={[s.chipPillText, active && s.chipPillTextActive]}>
                  {g}
                </Text>
              </ScalePressable>
            );
          })}
        </ScrollView>
      )}

      {/* 5. Results Count */}
      <View style={s.resultMetaRow}>
        <Text style={s.resultCountText}>
          Menampilkan {itemCount} {tab === "serial" ? "serial" : "judul"}
          {query ? ` untuk "${query}"` : ""}
        </Text>
      </View>
    </View>
  );
}

export function ListScreen({
  listScrollRef,
  tab,
  columns,
  gridWidth,
  items,
  genres,
  genre,
  setGenre,
  query,
  setQuery,
  page,
  setPage,
  listLoading,
  listError,
  reloadList,
  totalPages,
  isApi,
  ready,
  saved,
  onOpenDetail,
  onToggleSave,
  handleScroll,
  contentTopPadding,
  contentBottomPadding,
  navigate,
  openSettings,
  shelves,
  activeShelfId,
  onSelectShelf,
  onOpenCreateShelf,
  shelfCounts,
  onDeleteShelf,
}) {
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "list"

  // Load saved view mode preference
  useEffect(() => {
    AsyncStorage.getItem("cineshelf.view_mode")
      .then((savedMode) => {
        if (savedMode === "grid" || savedMode === "list") {
          setViewMode(savedMode);
        }
      })
      .catch(() => { });
  }, []);

  const handleChangeViewMode = (mode) => {
    setViewMode(mode);
    AsyncStorage.setItem("cineshelf.view_mode", mode).catch(() => { });
  };

  // Full skeleton on initial load before input
  if (listLoading && items.length === 0 && !query && genre === "Semua") {
    return (
      <ListSkeleton
        columns={columns}
        gridWidth={gridWidth}
        contentTopPadding={contentTopPadding}
        contentBottomPadding={contentBottomPadding}
      />
    );
  }

  const currentShelf = (shelves || []).find((s) => s.id === activeShelfId);

  return (
    <FlatList
      ref={listScrollRef}
      key={`${tab}-${viewMode}-${columns}`}
      onScroll={handleScroll}
      scrollEventThrottle={16}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      data={listError ? [] : items}
      numColumns={viewMode === "list" ? 1 : columns}
      keyExtractor={(x) => x.id}
      contentContainerStyle={[
        s.gridContainer,
        {
          paddingTop: contentTopPadding,
          paddingBottom: contentBottomPadding,
        },
      ]}
      columnWrapperStyle={viewMode === "list" ? undefined : { gap: 14 }}
      ListHeaderComponent={
        <ListHeader
          tab={tab}
          query={query}
          setQuery={setQuery}
          setPage={setPage}
          genres={genres}
          genre={genre}
          setGenre={setGenre}
          itemCount={items.length}
          listLoading={listLoading}
          shelves={shelves}
          activeShelfId={activeShelfId}
          onSelectShelf={onSelectShelf}
          onOpenCreateShelf={onOpenCreateShelf}
          shelfCounts={shelfCounts}
          onDeleteShelf={onDeleteShelf}
          viewMode={viewMode}
          onChangeViewMode={handleChangeViewMode}
        />
      }
      renderItem={({ item, index }) => (
        viewMode === "list" ? (
          <MovieListItem
            item={item}
            onOpen={onOpenDetail}
            saved={tab === "watchlist" || (saved || []).includes(item.id)}
            onToggleSave={onToggleSave}
          />
        ) : (
          <View style={{ marginBottom: 20 }}>
            <Poster
              item={item}
              width={gridWidth}
              onOpen={onOpenDetail}
              saved={tab === "watchlist" || (saved || []).includes(item.id)}
              onToggleSave={onToggleSave}
            />
          </View>
        )
      )}
      ListEmptyComponent={
        listError ? (
          <MessageState
            type="error"
            title="Gagal Memuat Katalog"
            message={listError}
            actionLabel="Coba Lagi"
            onAction={reloadList}
            secondaryLabel={isApi ? "Periksa Pengaturan" : null}
            onSecondary={isApi ? openSettings : null}
          />
        ) : (
          <View style={s.emptyContainer}>
            <View style={s.emptyIconCircle}>
              <Icon
                name={tab === "watchlist" ? "albums-outline" : "film-outline"}
                size={34}
                color={THEME.accentSoft}
              />
            </View>
            <Text style={s.emptyTitle}>
              {tab === "watchlist"
                ? activeShelfId === "all"
                  ? "Watchlist Masih Kosong"
                  : `Rak "${currentShelf?.name || ""}" Masih Kosong`
                : query || genre !== "Semua"
                  ? "Tidak Ada Judul yang Cocok"
                  : "Katalog Masih Kosong"}
            </Text>
            <Text style={s.emptySubText}>
              {tab === "watchlist"
                ? activeShelfId === "all"
                  ? "Tandai film atau serial favoritmu untuk menyimpannya di sini."
                  : `Tambahkan film ke rak ini lewat tombol "Atur Rak" di halaman detail film.`
                : query || genre !== "Semua"
                  ? "Coba ubah kata kunci pencarian atau pilih genre lain."
                  : "Koleksi judul belum tersedia."}
            </Text>
            {tab === "watchlist" && activeShelfId === "all" && (
              <Button
                title="Jelajahi Film"
                variant="primary"
                size="md"
                onPress={() => navigate("film")}
              />
            )}
          </View>
        )
      }
      ListFooterComponent={
        isApi && totalPages > 1 ? (
          <View style={s.paginationRow}>
            <Button
              title="Sebelumnya"
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onPress={() => setPage((p) => Math.max(1, p - 1))}
            />
            <Text style={s.pageIndicatorText}>
              Halaman {page} dari {totalPages}
            </Text>
            <Button
              title="Berikutnya"
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
            />
          </View>
        ) : null
      }
    />
  );
}

const s = StyleSheet.create({
  gridContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  listHeaderBox: {
    paddingBottom: 12,
    gap: 8,
  },
  headerTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  pageMainTitle: {
    color: "white",
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  pageSubText: {
    color: THEME.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  headerCreateShelfBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: THEME.accent,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: THEME.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0,
    shadowRadius: 6,
  },
  headerCreateShelfText: {
    color: "white",
    fontSize: 12,
    fontWeight: "700",
  },
  toolbarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 2,
    marginBottom: 4,
  },
  searchBarContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: "white",
    fontSize: 13,
  },
  viewToggleSegment: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 14,
    padding: 3,
    height: 44,
    gap: 2,
  },
  viewToggleBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  viewToggleBtnActive: {
    backgroundColor: THEME.accentDark,
    borderWidth: 1,
    borderColor: THEME.accent,
  },
  genreChipsScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  chipPill: {
    paddingVertical: 12,
    paddingHorizontal: 13,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  chipPillActive: {
    backgroundColor: THEME.accentDark,
    borderColor: THEME.accent,
  },
  chipPillText: {
    color: THEME.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  chipPillTextActive: {
    color: "white",
    fontWeight: "700",
  },
  resultMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
    marginBottom: 4,
  },
  resultCountText: {
    
    color: THEME.textMuted,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  activeShelfTag: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: "rgba(184, 61, 74, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(184, 61, 74, 0.25)",
  },
  activeShelfTagText: {
    color: THEME.accentSoft,
    fontSize: 10,
    fontWeight: "700",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
    gap: 12,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(184, 61, 74, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(184, 61, 74, 0.25)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  emptySubText: {
    color: THEME.textSecondary,
    fontSize: 13,
    textAlign: "center",
    maxWidth: 320,
    lineHeight: 19,
    marginBottom: 8,
  },
  paginationRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    paddingVertical: 20,
  },
  pageIndicatorText: {
    
    color: THEME.textMuted,
    fontSize: 12,
  },
});
