import test from "node:test";
import assert from "node:assert/strict";
import { createApi, apiRequest, normalizeApiUrl } from "../src/services/api.js";
import { connectDatabase } from "../backend/src/config/database.js";
import { createApp } from "../backend/src/app.js";

test("client mobile mengonsumsi backend nyata, termasuk detail dan pencarian", async (t) => {
  const config = {
    driver: "sqlite",
    sqlitePath: ":memory:",
    adminKey: "test-only",
    origins: [],
  };
  const db = await connectDatabase(config),
    server = createApp(db, config).listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  t.after(async () => {
    await new Promise((r) => server.close(r));
    db.close();
  });
  const base = `http://127.0.0.1:${server.address().port}`,
    api = createApi(base);
  assert.equal((await api.health()).service, "cineshelf-api");
  assert.equal((await api.home()).data.total, 10);
  assert.ok((await api.genres()).data.includes("Sci-Fi"));
  const list = await api.list("film", { q: "orbit", genre: "Sci-Fi" });
  assert.equal(list.data.length, 1);
  assert.equal((await api.detail(list.data[0])).data.id, "f1");
  assert.equal((await api.list("serial")).pagination.total, 4);
  assert.equal((await api.resolve(["f1", "s1", "deleted"])).data.length, 2);
  await assert.rejects(
    () => api.detail({ type: "film", id: "missing" }),
    /Judul tidak ditemukan/,
  );
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(() => api.home(controller.signal));
});
test("URL API dinormalisasi dan kredensial tidak diterima di URL", () => {
  assert.equal(
    normalizeApiUrl(" http://192.168.1.5:5002/ "),
    "http://192.168.1.5:5002/api",
  );
  assert.equal(
    normalizeApiUrl("https://example.com/api/"),
    "https://example.com/api",
  );
  for (const u of [
    "localhost:5002",
    "ftp://example.com",
    "https://name:pass@example.com",
    "https://example.com?key=secret",
  ])
    assert.throws(() => normalizeApiUrl(u));
});
test("error jaringan tidak diganti dengan data demo", async (t) => {
  const oldFetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = oldFetch;
  });
  globalThis.fetch = async () => {
    throw new TypeError("network failed");
  };
  await assert.rejects(
    () => apiRequest("https://example.com/api", "/movies"),
    /Tidak dapat menghubungi API/,
  );
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => {
      throw Error("invalid json");
    },
  });
  await assert.rejects(
    () => apiRequest("https://example.com/api", "/movies"),
    /Server tidak mengirim JSON/,
  );
});
