import { randomUUID } from "node:crypto";
export function createCatalogModel(database) {
  const db = database.client,
    sql = database.driver === "sqlite";
  async function check(promise) {
    const { data, error } = await promise;
    if (error) throw error;
    return data;
  }
  return {
    async genres() {
      return sql
        ? db
            .prepare("SELECT name FROM genres ORDER BY name")
            .all()
            .map((x) => x.name)
        : (await check(db.from("genres").select("name").order("name"))).map(
            (x) => x.name,
          );
    },
    async addGenre(name) {
      if (sql)
        db.prepare("INSERT OR IGNORE INTO genres(name) VALUES (?)").run(name);
      else
        await check(db.from("genres").upsert({ name }, { onConflict: "name" }));
      return { name };
    },
    async all(type) {
      if (sql) {
        const rows = type
          ? db
              .prepare(
                "SELECT payload FROM titles WHERE type=? ORDER BY title,id",
              )
              .all(type)
          : db.prepare("SELECT payload FROM titles ORDER BY title,id").all();
        return rows.map((x) => JSON.parse(x.payload));
      }
      let query = db
        .from("titles")
        .select("payload")
        .order("title")
        .order("id");
      if (type) query = query.eq("type", type);
      // Membaca bertahap agar batas 1000 baris Supabase tidak memotong katalog.
      const result = [];
      for (let offset = 0; ; offset += 500) {
        const rows = await check(query.range(offset, offset + 499));
        result.push(...rows.map((x) => x.payload));
        if (rows.length < 500) break;
      }
      return result;
    },
    async get(id) {
      if (sql) {
        const row = db.prepare("SELECT payload FROM titles WHERE id=?").get(id);
        return row ? JSON.parse(row.payload) : null;
      }
      const row = await check(
        db.from("titles").select("payload").eq("id", id).maybeSingle(),
      );
      return row?.payload || null;
    },
    async create(data) {
      const item = { ...data, id: randomUUID() };
      const row = {
        id: item.id,
        type: item.type,
        title: item.title,
        genre: item.genre,
        payload: item,
      };
      if (sql)
        db.prepare(
          "INSERT INTO titles(id,type,title,genre,payload) VALUES (?,?,?,?,?)",
        ).run(item.id, item.type, item.title, item.genre, JSON.stringify(item));
      else await check(db.from("titles").insert(row));
      return item;
    },
    async update(id, data) {
      const item = { ...data, id };
      if (sql)
        db.prepare(
          "UPDATE titles SET type=?,title=?,genre=?,payload=? WHERE id=?",
        ).run(item.type, item.title, item.genre, JSON.stringify(item), id);
      else
        await check(
          db
            .from("titles")
            .update({
              type: item.type,
              title: item.title,
              genre: item.genre,
              payload: item,
            })
            .eq("id", id),
        );
      return item;
    },
    async remove(id) {
      if (sql) db.prepare("DELETE FROM titles WHERE id=?").run(id);
      else await check(db.from("titles").delete().eq("id", id));
    },
  };
}
