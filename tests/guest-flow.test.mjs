import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import React from "react";
import { create, act } from "react-test-renderer";
import * as api from "../src/services/api.js";
import * as catalog from "../catalog.js";
import { useLibrary } from "../src/hooks/useLibrary.js";

const require = createRequire(import.meta.url);
const { transformSync } = require("@babel/core");
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function appWithAuth(auth, mode = "demo") {
  class Value {
    setValue() {}
    stopAnimation() {}
    interpolate() { return 0; }
  }
  const native = {
    View: "View", Text: "Text", StatusBar: "StatusBar", ActivityIndicator: "ActivityIndicator", Modal: "Modal",
    StyleSheet: { create: value => value }, useWindowDimensions: () => ({ width: 390 }),
    BackHandler: { addEventListener: () => ({ remove() {} }) },
    Animated: { Value, View: "AnimatedView", timing: () => ({ start: done => done?.() }), spring: () => ({ start() {} }) },
  };
  const code = transformSync(fs.readFileSync(new URL("../App.js", import.meta.url), "utf8"), {
    configFile: false, babelrc: false, plugins: ["@babel/plugin-transform-react-jsx", "@babel/plugin-transform-modules-commonjs"],
  }).code;
  const module = { exports: {} };
  new Function("require", "module", "exports", code)(name => {
    if (name === "react") return React;
    if (name === "react-native") return native;
    if (name === "react-native-safe-area-context") return { SafeAreaProvider: "SafeAreaProvider", useSafeAreaInsets: () => ({ top: 0, bottom: 0 }) };
    if (name === "@react-native-async-storage/async-storage") return {
      getItem: async () => JSON.stringify({ mode, url: "https://example.com/api" }), setItem: async () => {},
    };
    if (name.endsWith("/useReducedMotion")) return { MotionProvider: "MotionProvider", useReducedMotion: () => true };
    if (name.endsWith("/theme")) return { THEME: {}, STORAGE_KEYS: { CONNECTION: "connection" } };
    if (name === "./catalog") return catalog;
    if (name.endsWith("/services/api")) return api;
    if (name.endsWith("/services/config")) return { defaultApiUrl: () => "https://example.com/api" };
    if (name.endsWith("/useAuth")) return { useAuth: () => auth };
    if (name.endsWith("/useLibrary")) return { useLibrary };
    if (name.endsWith("/useRequest")) return { useDebounced: value => value, useRequest: () => ({ data: null, error: "", loading: false, retry() {} }) };
    const symbol = name.split("/").at(-1);
    return { [symbol]: symbol };
  }, module, module.exports);
  return module.exports.default;
}

test("guest dapat menjelajah, tetapi aksi pribadi meminta login tanpa mengubah koleksi", async t => {
  const originalFetch = globalThis.fetch;
  let requests = 0;
  globalThis.fetch = async () => { requests++; throw Error("Guest must not request a private library"); };
  t.after(() => { globalThis.fetch = originalFetch; });
  const auth = { ready: true, session: null, getToken: async () => { throw Error("Guest has no token"); } };
  const App = appWithAuth(auth);
  let tree;
  await act(async () => { tree = create(React.createElement(App)); });
  t.after(async () => { await act(async () => tree.unmount()); });
  const loginModal = () => tree.root.findByType("Modal");
  const closeLogin = async () => act(async () => tree.root.findByType("AuthScreen").props.onClose());
  const navigate = async tab => act(async () => tree.root.findByType("FloatingBottomCapsule").props.navigate(tab));
  assert.equal(loginModal().props.visible, false);
  const movie = tree.root.findByType("HomeScreen").props.movies[0];
  await act(async () => tree.root.findByType("HomeScreen").props.onToggleSave(movie));
  assert.equal(loginModal().props.visible, true);
  assert.equal(tree.root.findByType("AddToShelfModal").props.visible, false);
  await closeLogin();
  await act(async () => tree.root.findByType("HomeScreen").props.onOpenDetail(movie));
  for (const [action, args] of [["onOpenAddToShelf", [movie]], ["onToggleWatched", [movie.id]], ["onRate", [movie.id, 5]], ["onReact", [movie.id, "🔥"]]]) {
    await act(async () => tree.root.findByType("DetailScreen").props[action](...args));
    assert.equal(loginModal().props.visible, true);
    await closeLogin();
  }
  await navigate("watchlist");
  assert.equal(tree.root.findAllByType("ListScreen").length, 0);
  await act(async () => tree.root.findByProps({ label: "Masuk / Daftar" }).props.onPress());
  assert.equal(loginModal().props.visible, true);
  await closeLogin();
  await navigate("profile");
  const profile = tree.root.findByType("ProfileScreen").props;
  assert.equal(profile.user, undefined);
  assert.equal(profile.savedCount, 0);
  assert.equal(profile.watchedCount, 0);
  assert.equal(profile.shelvesCount, 0);
  await act(async () => profile.onLogin());
  assert.equal(loginModal().props.visible, true);
  assert.equal(requests, 0);
  // Signing in mounts only that account's library; returning to guest drops it.
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => ({ data: {
      saved: ["f1"],
      shelves: [{ id: "all", name: "Semua", icon: "albums-outline", isDefault: true, items: [] }],
      watchedList: ["f1"], userRatings: {}, userReactions: {},
    } }),
  });
  auth.session = { user: { id: "account-A", email: "a@example.com" } };
  auth.getToken = async () => "account-A";
  await act(async () => tree.update(React.createElement(App)));
  assert.equal(loginModal().props.visible, false);
  await navigate("profile");
  assert.equal(tree.root.findByType("ProfileScreen").props.savedCount, 1);
  auth.session = null;
  await act(async () => tree.update(React.createElement(App)));
  await navigate("profile");
  assert.equal(tree.root.findByType("ProfileScreen").props.savedCount, 0);
  assert.equal(tree.root.findByType("ProfileScreen").props.watchedCount, 0);
});

test("tambah judul meminta login untuk guest dan membuka form setelah masuk", async t => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ data: null }) });
  t.after(() => { globalThis.fetch = originalFetch; });
  const auth = { ready: true, session: null, getToken: async () => "account-A" };
  const App = appWithAuth(auth, "api");
  let tree;
  await act(async () => { tree = create(React.createElement(App)); });
  t.after(async () => { await act(async () => tree.unmount()); });
  const add = () => tree.root.findByProps({ accessibilityLabel: "Tambah film atau serial" }).props.onPress();
  await act(async () => add());
  assert.equal(tree.root.findByType("Modal").props.visible, true);
  assert.equal(tree.root.findByType("AddTitleModal").props.visible, false);
  await act(async () => tree.root.findByType("AuthScreen").props.onClose());
  assert.equal(tree.root.findByType("AddTitleModal").props.visible, false);
  auth.session = { user: { id: "account-A", email: "a@example.com" } };
  await act(async () => tree.update(React.createElement(App)));
  await act(async () => add());
  assert.equal(tree.root.findByType("Modal").props.visible, false);
  assert.equal(tree.root.findByType("AddTitleModal").props.visible, true);
});
