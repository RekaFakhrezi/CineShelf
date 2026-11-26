import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import React from "react";
import { act, create } from "react-test-renderer";

const require = createRequire(import.meta.url);
const { transformSync } = require("@babel/core");
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function screenWithPicker(pickPhoto) {
  const native = Object.fromEntries(
    ["View", "Text", "TextInput", "Modal", "ScrollView", "Image", "KeyboardAvoidingView"].map(name => [name, name]),
  );
  Object.assign(native, { Keyboard: { dismiss() {} }, Platform: { OS: "web" }, StyleSheet: { create: styles => styles } });
  function load(path) {
    const source = readFileSync(new URL(path, import.meta.url), "utf8");
    const { code } = transformSync(source, {
      configFile: false, babelrc: false, plugins: ["@babel/plugin-transform-react-jsx", "@babel/plugin-transform-modules-commonjs"],
    });
    const module = { exports: {} };
    new Function("require", "module", "exports", code)(name => {
      if (name === "react") return React;
      if (name === "react-native") return native;
      if (name === "react-native-safe-area-context") return { useSafeAreaInsets: () => ({ top: 0, bottom: 0 }) };
      if (name === "expo-image-picker") return { launchImageLibraryAsync: pickPhoto };
      if (name.endsWith("/ProfileEditorModal")) return load("../src/components/profile/ProfileEditorModal.js");
      if (name.endsWith("/theme")) return { THEME: {} };
      if (name.endsWith("/useReducedMotion")) return { useReducedMotion: () => true };
      if (/\/(Icon|Button|ScalePressable)$/.test(name)) return { [name.split("/").at(-1)]: name.split("/").at(-1) };
      if (name.endsWith("/app.json")) return { expo: { version: "0.0.0" } };
      throw Error(name);
    }, module, module.exports);
    return module.exports;
  }
  return load("../src/screens/ProfileScreen.js").ProfileScreen;
}

const user = { id: "one", email: "old@example.com", user_metadata: { name: "Original" } };
const hasText = (tree, text) => tree.root.findAllByType("Text").some(node => node.props.children === text);
const button = (tree, label) => tree.root.findAllByType("Button").find(node => node.props.label === label);
const press = async (tree, label) => act(async () => { await button(tree, label).props.onPress(); });
const input = (tree, label) => tree.root.findByProps({ accessibilityLabel: label });

async function mount(t, Screen, props) {
  let tree;
  await act(async () => { tree = create(React.createElement(Screen, props)); });
  t.after(async () => act(async () => tree.unmount()));
  return tree;
}

test("guest cannot edit; saved profile wins over a stale load and shows the new avatar and email notice", async t => {
  const Screen = screenWithPicker(async () => ({
    canceled: false, assets: [{ uri: "https://example.com/local-preview.png", base64: "aW1hZ2U=", mimeType: "image/png", width: 12, height: 12 }],
  }));
  let resolveLoad, resolveSave;
  const patches = [];
  const props = {
    getProfile: () => new Promise(resolve => { resolveLoad = resolve; }),
    updateProfile: patch => { patches.push(patch); return new Promise(resolve => { resolveSave = resolve; }); },
  };
  const tree = await mount(t, Screen, props);
  assert.equal(button(tree, "Edit profil"), undefined);
  assert.equal(resolveLoad, undefined);
  await act(async () => tree.update(React.createElement(Screen, { ...props, user })));
  await press(tree, "Edit profil");
  assert.equal(input(tree, "Nama tampilan").props.value, "Original");
  assert.equal(input(tree, "Email").props.value, user.email);
  assert.equal(input(tree, "Kata sandi baru").props.value, "");
  await act(async () => {
    input(tree, "Nama tampilan").props.onChangeText("New name");
    input(tree, "Email").props.onChangeText("new@example.com");
  });
  await press(tree, "Pilih foto");
  assert.equal(tree.root.findByType("Image").props.source.uri, "https://example.com/local-preview.png");
  let saving;
  await act(async () => {
    const save = button(tree, "Simpan perubahan").props.onPress;
    saving = save();
    save();
  });
  assert.deepEqual(patches, [{ name: "New name", email: "new@example.com", avatar: { base64: "aW1hZ2U=" } }]);
  await act(async () => {
    resolveSave({ data: { user: { ...user, user_metadata: { name: "New name" } }, avatarUrl: "https://example.com/signed.png" }, message: "Konfirmasi perubahan email." });
    await saving;
    resolveLoad({ user, avatarUrl: null });
  });
  assert.ok(hasText(tree, "New name"));
  assert.ok(hasText(tree, user.email));
  assert.ok(hasText(tree, "Konfirmasi perubahan email."));
  assert.equal(tree.root.findByType("Image").props.source.uri, "https://example.com/signed.png");
  await act(async () => tree.root.findByType("Image").props.onError());
  assert.ok(hasText(tree, "N"));
  assert.equal(tree.root.findAllByType("Image").length, 0);
});

test("unavailable profile still supports removal and validates an optional new password", async t => {
  const Screen = screenWithPicker(async () => ({ canceled: true }));
  const savedUser = { ...user, user_metadata: { name: "Original", cineshelf_avatar: "avatar-path" } };
  const patches = [];
  const tree = await mount(t, Screen, {
    user: savedUser,
    getProfile: async () => { throw Error("Offline"); },
    updateProfile: async patch => {
      patches.push(patch);
      if (patches.length === 1) throw Error("Server tidak merespons.");
      return { data: { user, avatarUrl: null } };
    },
  });
  assert.ok(hasText(tree, "Profil terbaru belum dapat dimuat. Kamu masih dapat mengedit profil."));
  await press(tree, "Edit profil");
  await press(tree, "Hapus foto");
  await act(async () => input(tree, "Kata sandi baru").props.onChangeText("short"));
  await press(tree, "Simpan perubahan");
  assert.ok(hasText(tree, "Gunakan kata sandi minimal 6 karakter."));
  await act(async () => input(tree, "Kata sandi baru").props.onChangeText("New-password"));
  await press(tree, "Simpan perubahan");
  assert.ok(hasText(tree, "Konfirmasi kata sandi belum cocok."));
  assert.deepEqual(patches, []);
  await act(async () => input(tree, "Konfirmasi kata sandi baru").props.onChangeText("New-password"));
  await press(tree, "Simpan perubahan");
  assert.ok(hasText(tree, "Server tidak merespons."));
  await press(tree, "Simpan perubahan");
  assert.deepEqual(patches, Array(2).fill({ password: "New-password", avatar: null }));
  assert.equal(tree.root.findAllByType("Modal").length, 0);
});
