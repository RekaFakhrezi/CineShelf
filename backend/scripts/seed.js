import fs from "node:fs";
import path from "node:path";
import { backendRoot, readConfig } from "../src/config/env.js";
import { connectDatabase } from "../src/config/database.js";
const config = readConfig(),
  db = await connectDatabase(config);
if (config.driver === "sqlite") {
  console.log(
    "Database lokal telah diinisialisasi; data yang ada tidak direset.",
  );
  db.close();
} else {
  const seed = JSON.parse(
    fs.readFileSync(path.join(backendRoot, "database/seed.json"), "utf8"),
  );
  for (const name of [...new Set(seed.map((x) => x.genre))]) {
    const { error } = await db.client
      .from("genres")
      .upsert({ name }, { onConflict: "name", ignoreDuplicates: true });
    if (error) throw error;
  }
  const rows = seed.map((item) => ({
    id: item.id,
    type: item.type,
    title: item.title,
    genre: item.genre,
    payload: item,
  }));
  const { error } = await db.client
    .from("titles")
    .upsert(rows, { onConflict: "id", ignoreDuplicates: true });
  if (error) throw error;
  console.log("Seed selesai. Data dengan ID yang sudah ada tidak ditimpa.");
}
