import { Router } from "express";
import { authenticated as verifySession, authError, createAuthClient } from "../middleware/auth.js";
import { HttpError } from "../middleware/errors.js";

const object = value => value !== null && typeof value === "object" && !Array.isArray(value);
const id = value => typeof value === "string" && /^[A-Za-z0-9_-]{1,100}$/.test(value);
const string = (value, max) => typeof value === "string" && value.trim().length > 0 && value.length <= max;
function fields(value, allowed) {
  return object(value) && Object.keys(value).every(key => allowed.includes(key));
}
function validateLibrary(value) {
  const keys = ["saved", "shelves", "watchedList", "userRatings", "userReactions"];
  const ids = list => Array.isArray(list) && list.length <= 500 && list.every(id) && new Set(list).size === list.length;
  if (!fields(value, keys) || keys.some(key => !Object.hasOwn(value, key)) ||
      !ids(value.saved) || !ids(value.watchedList) ||
      !Array.isArray(value.shelves) || value.shelves.length < 1 || value.shelves.length > 50 ||
      new Set(value.shelves.map(shelf => shelf?.id)).size !== value.shelves.length ||
      !value.shelves.every(shelf => fields(shelf, ["id", "name", "icon", "isDefault", "items"]) &&
        id(shelf.id) && string(shelf.name, 80) && typeof shelf.icon === "string" && /^[a-z0-9-]{1,60}$/.test(shelf.icon) &&
        typeof shelf.isDefault === "boolean" && shelf.isDefault === (shelf.id === "all") && ids(shelf.items)) ||
      !value.shelves.some(shelf => shelf.id === "all") ||
      !object(value.userRatings) || Object.keys(value.userRatings).length > 500 ||
      !Object.entries(value.userRatings).every(([key, rating]) => id(key) && typeof rating === "number" && Number.isFinite(rating) && rating >= 0 && rating <= 5) ||
      !object(value.userReactions) || Object.keys(value.userReactions).length > 500 ||
      !Object.entries(value.userReactions).every(([key, reaction]) => id(key) && string(reaction, 80))) {
    throw new HttpError(400, "Data perpustakaan tidak valid atau melampaui batas.");
  }
  return value;
}
export function accountRoutes(database, { authClientFactory } = {}) {
  const router = Router();
  const freshClient = authClientFactory || createAuthClient;
  const authenticated = req => verifySession(req, freshClient);
  router.use((req, res, next) => {
    if (req.path !== "/library" && !req.path.startsWith("/auth/")) return next("router");
    res.set("Cache-Control", "no-store");
    if (database.driver !== "supabase") return next(new HttpError(503, "Akun memerlukan Supabase. Atur DB_DRIVER=supabase dan jalankan database/accounts.supabase.sql."));
    next();
  });
  // Never sign in on database.client: its service-role authorization must remain unchanged.
  router.post("/auth/:action", async (req, res, next) => {
    const action = req.params.action;
    if (!["login", "signup", "refresh", "logout"].includes(action)) return next();
    if (action === "logout") {
      const { client, token } = await authenticated(req);
      const { error } = await client.auth.admin.signOut(token, "local");
      authError(error, true);
      return res.json({ data: null });
    }
    const body = req.body;
    const allowed = action === "refresh" ? ["refresh_token"] : action === "signup" ? ["email", "password", "name"] : ["email", "password"];
    if (!fields(body, allowed)) throw new HttpError(400, "Data akun tidak valid.");
    let credentials;
    if (action === "refresh") {
      if (!string(body.refresh_token, 8192)) throw new HttpError(400, "Token pembaruan tidak valid.");
      credentials = { refresh_token: body.refresh_token };
    } else {
      if (!string(body.email, 254) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim()) ||
          typeof body.password !== "string" || body.password.length < (action === "signup" ? 6 : 1) || body.password.length > 1024 ||
          (action === "signup" && !string(body.name, 80))) throw new HttpError(400, "Isi email, kata sandi, dan nama yang valid (kata sandi baru minimal 6 karakter).");
      credentials = { email: body.email.trim(), password: body.password };
      if (action === "signup") credentials.options = { data: { name: body.name.trim() } };
    }
    const client = freshClient();
    const method = action === "login" ? "signInWithPassword" : action === "signup" ? "signUp" : "refreshSession";
    let result;
    try { result = await client.auth[method](credentials); }
    catch { throw new HttpError(503, "Layanan akun tidak tersedia. Coba lagi nanti."); }
    authError(result.error, action !== "signup");
    const session = result.data?.session || null;
    res.status(action === "signup" ? 201 : 200).json({ data: session, ...(action === "signup" && !session ? { message: "Periksa email untuk mengonfirmasi akun sebelum masuk." } : {}) });
  });
  router.get("/library", async (req, res) => {
    const { user } = await authenticated(req);
    const { data, error } = await database.client.from("user_libraries").select("data").eq("user_id", user.id).maybeSingle();
    if (error) throw new HttpError(503, "Perpustakaan belum tersedia. Pastikan database/accounts.supabase.sql sudah dijalankan.");
    res.json({ data: data?.data || null });
  });
  router.put("/library", async (req, res) => {
    const { user } = await authenticated(req);
    const library = validateLibrary(req.body);
    const { error } = await database.client.from("user_libraries").upsert({ user_id: user.id, data: library }, { onConflict: "user_id" });
    if (error) throw new HttpError(503, "Perpustakaan tidak dapat disimpan. Pastikan database/accounts.supabase.sql sudah dijalankan.");
    res.json({ data: library });
  });
  return router;
}
