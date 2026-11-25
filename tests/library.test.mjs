import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { create, act } from "react-test-renderer";
import { emptyLibrary, useLibrary } from "../src/hooks/useLibrary.js";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const response = (data, status = 200) => ({ ok: status < 400, status, json: async () => data });
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };

test("rak akun baru kosong; pergantian akun tidak membawa data akun sebelumnya", async t => {
  const original = globalThis.fetch;
  t.after(() => { globalThis.fetch = original; });
  const stored = new Map();
  const getA = async () => "account-A";
  const getB = async () => "account-B";
  globalThis.fetch = async (_, options) => {
    const owner = options.headers.Authorization;
    if (options.method === "PUT") stored.set(owner, JSON.parse(options.body));
    return response({ data: stored.get(owner) || null });
  };
  let state;
  function Probe({ getToken }) { state = useLibrary("https://example.com/api", getToken); return null; }
  let renderer;
  await act(async () => { renderer = create(React.createElement(Probe, { key: "A", getToken: getA })); });
  assert.deepEqual(state.library, emptyLibrary());
  await act(async () => state.setLibrary(previous => ({ ...previous, saved: ["f1"], shelves: [...previous.shelves, { id: "weekend", name: "Akhir pekan", icon: "film-outline", isDefault: false, items: ["f1"] }] })));
  await act(async () => state.flush());
  await act(async () => renderer.update(React.createElement(Probe, { key: "B", getToken: getB })));
  assert.deepEqual(state.library.saved, []);
  assert.deepEqual(state.library.shelves, emptyLibrary().shelves);
  await act(async () => state.setLibrary(previous => ({ ...previous, saved: ["s1"] })));
  await act(async () => state.flush());
  await act(async () => renderer.update(React.createElement(Probe, { key: "A", getToken: getA })));
  assert.deepEqual(state.library.saved, ["f1"]);
  assert.deepEqual(state.library.shelves[1].items, ["f1"]);
  await act(async () => renderer.unmount());
});

test("save lambat diserialkan; kegagalan simpan mempertahankan perubahan untuk retry", async t => {
  const original = globalThis.fetch;
  t.after(() => { globalThis.fetch = original; });
  const firstWrite = deferred();
  const writes = [];
  let fail = false;
  globalThis.fetch = async (_, options) => {
    if (options.method === "GET") return response({ data: null });
    const snapshot = JSON.parse(options.body);
    writes.push(snapshot.saved);
    if (writes.length === 1) await firstWrite.promise;
    return fail ? response({ error: { message: "Koneksi putus" } }, 503) : response({ data: snapshot });
  };
  const getToken = async () => "account-A";
  let state, renderer;
  function Probe() { state = useLibrary("https://example.com/api", getToken); return null; }
  await act(async () => { renderer = create(React.createElement(Probe)); });
  await act(async () => state.setLibrary(previous => ({ ...previous, saved: ["f1"] })));
  await act(async () => state.setLibrary(previous => ({ ...previous, saved: ["f1", "s1"] })));
  assert.deepEqual(writes, [["f1"]]);
  await act(async () => { firstWrite.resolve(); await state.flush(); });
  assert.deepEqual(writes, [["f1"], ["f1", "s1"]]);
  fail = true;
  await act(async () => state.setLibrary(previous => ({ ...previous, saved: ["s1"] })));
  assert.equal(state.error, "Koneksi putus");
  assert.deepEqual(state.library.saved, ["s1"]);
  await act(async () => { await assert.rejects(state.flush(), /Koneksi putus/); });
  fail = false;
  await act(async () => state.flush());
  assert.equal(state.error, "");
  assert.deepEqual(writes.at(-1), ["s1"]);
  await act(async () => renderer.unmount());
});

test("gagal membaca library tidak menimpa data server dengan rak kosong", async t => {
  const original = globalThis.fetch;
  t.after(() => { globalThis.fetch = original; });
  let offline = true;
  let puts = 0;
  globalThis.fetch = async (_, options) => {
    if (options.method === "PUT") puts++;
    return offline ? response({ error: { message: "Server tidak tersedia" } }, 503) : response({ data: { ...emptyLibrary(), saved: ["f4"] } });
  };
  const getToken = async () => "account-A";
  let state, renderer;
  function Probe() { state = useLibrary("https://example.com/api", getToken); return null; }
  await act(async () => { renderer = create(React.createElement(Probe)); });
  assert.equal(state.ready, false);
  await assert.rejects(state.flush(), /belum selesai dimuat/);
  assert.equal(puts, 0);
  offline = false;
  await act(async () => state.retry());
  assert.deepEqual(state.library.saved, ["f4"]);
  assert.equal(puts, 0);
  await act(async () => renderer.unmount());
});
