import fs from "node:fs";
import path from "node:path";
import { backendRoot } from "./env.js";
export async function connectDatabase(config) {
  if (config.driver === "supabase") {
    const url = process.env.SUPABASE_URL,
      key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key)
      throw Error(
        "Isi SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY di backend/.env.",
      );
    const { createClient } = await import("@supabase/supabase-js");
    return {
      driver: "supabase",
      client: createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
      }),
    };
  }
  const { DatabaseSync } = await import("node:sqlite");
  if (config.sqlitePath !== ":memory:")
    fs.mkdirSync(path.dirname(config.sqlitePath), { recursive: true });
  const db = new DatabaseSync(config.sqlitePath);
  db.exec("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;");
  db.exec(
    fs.readFileSync(
      path.join(backendRoot, "database/schema.sqlite.sql"),
      "utf8",
    ),
  );
  // Seed sekali pada database baru, bukan saat tabel sengaja dikosongkan.
  if (!db.prepare("SELECT id FROM migrations WHERE id = ?").get("seed-v1")) {
    const seed = JSON.parse(
      fs.readFileSync(path.join(backendRoot, "database/seed.json"), "utf8"),
    );
    const putGenre = db.prepare(
      "INSERT OR IGNORE INTO genres (name) VALUES (?)",
    );
    const putTitle = db.prepare(
      "INSERT INTO titles (id,type,title,genre,payload) VALUES (?,?,?,?,?)",
    );
    db.exec("BEGIN");
    try {
      for (const item of seed) {
        putGenre.run(item.genre);
        putTitle.run(
          item.id,
          item.type,
          item.title,
          item.genre,
          JSON.stringify(item),
        );
      }
      db.prepare("INSERT INTO migrations (id) VALUES (?)").run("seed-v1");
      db.exec("COMMIT");
    } catch (e) {
      db.exec("ROLLBACK");
      throw e;
    }
  }
  return { driver: "sqlite", client: db, close: () => db.close() };
}
