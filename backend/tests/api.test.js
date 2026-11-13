import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { connectDatabase } from "../src/config/database.js";
import { createApp } from "../src/app.js";
const key = "test-admin-key-do-not-use-in-production";
async function fixture(file = ":memory:") {
  const config = {
    driver: "sqlite",
    sqlitePath: file,
    adminKey: key,
    origins: [],
  };
  const db = await connectDatabase(config);
  const server = createApp(db, config).listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  return {
    db,
    base,
    request: (route, options = {}) => fetch(base + route, options),
    close: async () => {
      await new Promise((r) => server.close(r));
      db.close();
    },
  };
}
const adminBody = (body) => ({
  headers: {
    "content-type": "application/json",
    authorization: `Bearer ${key}`,
  },
  body: JSON.stringify(body),
});
const movie = {
  title: "Film Pengujian",
  tagline: "Satu cerita",
  genre: "Drama",
  year: 2026,
  rating: 8.2,
  age: "13+",
  duration: "1j 30m",
  image: "https://example.com/poster.jpg",
  color: "#123456",
  cast: "Pemeran Uji",
  director: "Sutradara Uji",
  synopsis: "Sinopsis untuk pengujian API.",
};
test("API katalog: baca, filter, paginasi, detail, CRUD, validasi dan authorization", async (t) => {
  const f = await fixture();
  t.after(f.close);
  await t.test(
    "health memastikan database benar-benar dapat dibaca",
    async () => {
      const r = await f.request("/api/health");
      assert.equal(r.status, 200);
      assert.equal((await r.json()).database, "sqlite");
    },
  );
  await t.test("dua list dan home berasal dari database", async () => {
    for (const [route, count] of [
      ["movies", 6],
      ["series", 4],
    ]) {
      const r = await f.request("/api/" + route);
      const j = await r.json();
      assert.equal(j.pagination.total, count);
      assert.equal(j.data.length, count);
    }
    const j = await (await f.request("/api/home")).json();
    assert.equal(j.data.total, 10);
    assert.equal(j.data.featured.id, "f1");
  });
  await t.test("pencarian, genre, paginasi, kosong", async () => {
    let j = await (await f.request("/api/movies?q=ORBIT&genre=Sci-Fi")).json();
    assert.equal(j.data[0].id, "f1");
    j = await (await f.request("/api/movies?limit=2&page=2")).json();
    assert.equal(j.data.length, 2);
    assert.equal(j.pagination.totalPages, 3);
    j = await (await f.request("/api/movies?q=notfound")).json();
    assert.equal(j.data.length, 0);
  });
  await t.test("detail tidak tertukar film dan serial", async () => {
    assert.equal((await f.request("/api/movies/f1")).status, 200);
    assert.equal((await f.request("/api/series/f1")).status, 404);
    assert.equal((await f.request("/api/movies/missing")).status, 404);
  });
  await t.test("resolve watchlist mengabaikan ID terhapus", async () => {
    const r = await f.request("/api/catalog/resolve", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ids: ["f1", "f1", "s1", "missing"] }),
    });
    assert.equal((await r.json()).data.length, 2);
  });
  await t.test("mutasi tanpa token ditolak", async () => {
    assert.equal(
      (
        await f.request("/api/movies", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(movie),
        })
      ).status,
      401,
    );
    assert.equal(
      (
        await f.request("/api/movies/f1", {
          method: "DELETE",
          headers: { authorization: "Bearer wrong" },
        })
      ).status,
      401,
    );
  });
  await t.test("validasi body dan query", async () => {
    for (const patch of [
      { year: 12 },
      { rating: "" },
      { rating: true },
      { genre: "Unknown" },
      { image: "javascript:alert(1)" },
      { episodes: 4 },
      { admin: true },
    ])
      assert.equal(
        (
          await f.request("/api/movies", {
            method: "POST",
            ...adminBody({ ...movie, ...patch }),
          })
        ).status,
        400,
      );
    assert.equal((await f.request("/api/movies?page=0")).status, 400);
    assert.equal((await f.request("/api/movies?q[a]=1")).status, 200);
    assert.equal(
      (
        await f.request("/api/movies", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: "{bad",
        })
      ).status,
      400,
    );
  });
  await t.test("POST PUT DELETE dan database menyimpan perubahan", async () => {
    let r = await f.request("/api/movies", {
      method: "POST",
      ...adminBody(movie),
    });
    assert.equal(r.status, 201);
    const { data } = await r.json();
    r = await f.request("/api/movies/" + data.id, {
      method: "PUT",
      ...adminBody({ ...movie, title: "Judul Diubah" }),
    });
    assert.equal(r.status, 200);
    assert.equal(
      (await (await f.request("/api/movies/" + data.id)).json()).data.title,
      "Judul Diubah",
    );
    assert.equal(
      (
        await f.request("/api/movies/" + data.id, {
          method: "DELETE",
          headers: { authorization: `Bearer ${key}` },
        })
      ).status,
      204,
    );
    assert.equal((await f.request("/api/movies/" + data.id)).status, 404);
  });
  await t.test("CRUD serial dan genre baru", async () => {
    assert.equal(
      (
        await f.request("/api/genres", {
          method: "POST",
          ...adminBody({ name: "Komedi" }),
        })
      ).status,
      201,
    );
    let r = await f.request("/api/series", {
      method: "POST",
      ...adminBody({ ...movie, genre: "Komedi", episodes: 5 }),
    });
    assert.equal(r.status, 201);
    const { data } = await r.json();
    assert.equal(
      (await (await f.request("/api/series/" + data.id)).json()).data.episodes,
      5,
    );
    assert.equal(
      (
        await f.request("/api/series/" + data.id, {
          method: "DELETE",
          headers: { authorization: `Bearer ${key}` },
        })
      ).status,
      204,
    );
  });
  await t.test("404 terstruktur dan CORS", async () => {
    const r = await f.request("/api/unknown", {
      headers: { origin: "http://localhost:8081" },
    });
    assert.equal(r.status, 404);
    assert.ok((await r.json()).error.message);
    assert.equal(
      r.headers.get("access-control-allow-origin"),
      "http://localhost:8081",
    );
  });
});
test("database persisten setelah server restart; seed tidak memulihkan data yang dihapus", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cineshelf-test-")),
    file = path.join(dir, "test.db");
  let f;
  try {
    f = await fixture(file);
    const j = await (
      await f.request("/api/movies", { method: "POST", ...adminBody(movie) })
    ).json();
    await f.request("/api/movies/f1", {
      method: "DELETE",
      headers: { authorization: `Bearer ${key}` },
    });
    await f.close();
    f = await fixture(file);
    assert.equal((await f.request("/api/movies/" + j.data.id)).status, 200);
    assert.equal((await f.request("/api/movies/f1")).status, 404);
  } finally {
    if (f) await f.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
