import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import { normalizeApiUrl } from "../src/services/api.js";
import React from "react";
import { create, act } from "react-test-renderer";

const require = createRequire(import.meta.url);
const { transformSync } = require("@babel/core");
const stored = new Map();
const storage = {
  getItem: async key => stored.get(key) ?? null,
  setItem: async (key, value) => { stored.set(key, value); },
  removeItem: async key => { stored.delete(key); },
};
let request;
const apiRequest = async (base, path, options = {}) => {
  const result = await request(`${base}${path}`, {
    ...options,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const json = await result.json();
  if (!result.ok) {
    const error = Error(json.error.message);
    error.status = result.status;
    throw error;
  }
  return json;
};
const code = transformSync(fs.readFileSync(new URL("../src/hooks/useAuth.js", import.meta.url), "utf8"), {
  configFile: false, babelrc: false, plugins: ["@babel/plugin-transform-modules-commonjs"],
}).code;
const module = { exports: {} };
new Function("require", "module", "exports", code)(name => {
  if (name === "react") return React;
  if (name === "@react-native-async-storage/async-storage") return storage;
  if (name === "../services/api") return { apiRequest, normalizeApiUrl };
  throw Error(name);
}, module, module.exports);
const { useAuth } = module.exports;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const base = "https://example.com/api";
const key = `cineshelf.auth.v1:${base}`;
const session = (token = "access", expires_at = 4102444800) => ({
  access_token: token, refresh_token: `refresh-${token}`, expires_at,
  user: { id: "user-A", email: "akun@example.com", user_metadata: { name: "Akun" } },
});
const response = (data, status = 200) => ({ ok: status < 400, status, json: async () => data });
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };
function setup(t, handler) {
  stored.clear();
  const original = request;
  request = handler;
  t.after(() => { request = original; });
}
async function mount(t, initialBase = base) {
  let state, renderer;
  function Probe({ url }) { state = useAuth(url, true); return null; }
  await act(async () => { renderer = create(React.createElement(Probe, { url: initialBase })); });
  t.after(async () => { await act(async () => renderer.unmount()); });
  return {
    get state() { return state; },
    change: async url => { await act(async () => renderer.update(React.createElement(Probe, { url }))); },
    unmount: async () => { await act(async () => renderer.unmount()); },
  };
}

test("restore offline mempertahankan refresh token; retry menyimpan sesi baru", async t => {
  let offline = true;
  setup(t, async () => {
    if (offline) throw Error("Koneksi terputus");
    return response({ data: session("renewed") });
  });
  stored.set(key, JSON.stringify(session("stored")));
  const auth = await mount(t, "https://example.com/api/");
  assert.equal(auth.state.ready, true);
  assert.equal(auth.state.session, null);
  assert.match(auth.state.error, /Koneksi/);
  assert.equal(JSON.parse(stored.get(key)).refresh_token, "refresh-stored");
  assert.equal(typeof auth.state.retry, "function");
  offline = false;
  await act(async () => { assert.equal(await auth.state.retry(), true); });
  assert.equal(auth.state.session.access_token, "renewed");
  assert.equal(JSON.parse(stored.get(key)).refresh_token, "refresh-renewed");
  assert.equal(auth.state.error, "");
});

test("refresh 401 menghapus kredensial yang tidak valid", async t => {
  setup(t, async () => response({ error: { message: "Sesi tidak valid" } }, 401));
  stored.set(key, JSON.stringify(session("invalid")));
  const auth = await mount(t);
  assert.equal(auth.state.session, null);
  assert.equal(auth.state.ready, true);
  assert.equal(stored.has(key), false);
  assert.equal(auth.state.retry, undefined);
  assert.ok(auth.state.error);
});

test("getToken single-flight, menyimpan token baru, dan identitas callback stabil", async t => {
  const refresh = deferred();
  let calls = 0;
  setup(t, async () => {
    calls += 1;
    return calls === 1 ? response({ data: session("expired", 1) }) : refresh.promise;
  });
  stored.set(key, JSON.stringify(session("stored")));
  const auth = await mount(t);
  const getToken = auth.state.getToken;
  let first, second;
  await act(async () => {
    first = getToken();
    second = getToken();
  });
  assert.equal(calls, 2);
  await act(async () => {
    refresh.resolve(response({ data: session("fresh") }));
    assert.deepEqual(await Promise.all([first, second]), ["fresh", "fresh"]);
  });
  assert.equal(auth.state.getToken, getToken);
  assert.equal(JSON.parse(stored.get(key)).refresh_token, "refresh-fresh");
});

test("gagal logout mempertahankan sesi; logout berhasil menghapusnya tanpa menyimpan password", async t => {
  let failLogout = true;
  setup(t, async url => {
    if (url.endsWith("/login")) return response({ data: session("logged-in") });
    return failLogout
      ? response({ error: { message: "Server belum tersedia" } }, 503)
      : response({ data: null });
  });
  const auth = await mount(t);
  await act(async () => { assert.equal(await auth.state.login(" akun@example.com ", "secret-password"), true); });
  assert.equal(stored.get(key).includes("secret-password"), false);
  await act(async () => { assert.equal(await auth.state.logout(), false); });
  assert.equal(auth.state.session.access_token, "logged-in");
  assert.ok(stored.has(key));
  assert.match(auth.state.error, /Server/);
  failLogout = false;
  await act(async () => { assert.equal(await auth.state.logout(), true); });
  assert.equal(auth.state.session, null);
  assert.equal(stored.has(key), false);
});

test("signup konfirmasi email tidak membuat sesi palsu", async t => {
  let body;
  setup(t, async (_, options) => {
    body = JSON.parse(options.body);
    return response({ data: null, message: "Periksa email untuk konfirmasi." });
  });
  const auth = await mount(t);
  await act(async () => { assert.equal(await auth.state.signup(" akun@example.com ", "password", " Nama "), true); });
  assert.deepEqual(body, { email: "akun@example.com", password: "password", name: "Nama" });
  assert.equal(auth.state.session, null);
  assert.match(auth.state.message, /Periksa email/);
  assert.equal(stored.has(key), false);
});

test("pergantian API dan unmount menolak hasil refresh lama", async t => {
  const pending = deferred();
  setup(t, async () => pending.promise);
  const original = JSON.stringify(session("stored"));
  stored.set(key, original);
  const auth = await mount(t);
  await auth.change("https://another.example/api");
  assert.equal(auth.state.session, null);
  assert.equal(auth.state.ready, true);
  await act(async () => pending.resolve(response({ data: session("late") })));
  assert.equal(auth.state.session, null);
  assert.equal(stored.get(key), original);

  const unmounted = deferred();
  request = async () => unmounted.promise;
  await auth.change(base);
  await auth.unmount();
  await act(async () => unmounted.resolve(response({ data: session("after-unmount") })));
  assert.equal(stored.get(key), original);
});
