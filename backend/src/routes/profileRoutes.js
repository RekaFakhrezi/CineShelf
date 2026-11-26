import express from "express";
import { randomUUID } from "node:crypto";
import { authenticated } from "../middleware/auth.js";
import { HttpError } from "../middleware/errors.js";
import { decodeImage, IMAGE_BUCKET } from "../middleware/image.js";

const avatarKey = "cineshelf_avatar";
const object = value => value !== null && typeof value === "object" && !Array.isArray(value);
const unavailable = () => new HttpError(503, "Profil belum dapat diproses. Coba lagi nanti.");
const invalidProfile = () => new HttpError(400, "Data profil tidak valid.");
const filenamePattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(?:jpg|png|webp)/;
const avatarPrefix = id => `avatars/${id}/`;

// Users can write their own Auth metadata independently of this API.
function ownedAvatar(user) {
  const path = user.user_metadata?.[avatarKey];
  const prefix = avatarPrefix(user.id);
  if (typeof path !== "string" || !path.startsWith(prefix)) return null;
  const filename = path.slice(prefix.length);
  return filenamePattern.exec(filename)?.[0] === filename ? path : null;
}

function validatePatch(body) {
  if (!object(body) || !Object.keys(body).length || Object.keys(body).some(key => !["name", "email", "password", "avatar"].includes(key)))
    throw invalidProfile();
  const attributes = {};
  if (Object.hasOwn(body, "name")) {
    const name = typeof body.name === "string" && body.name.trim();
    if (!name || name.length > 80) throw new HttpError(400, "Nama harus berisi 1–80 karakter.");
    attributes.data = { name };
  }
  if (Object.hasOwn(body, "email")) {
    const email = typeof body.email === "string" && body.email.trim();
    if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      throw new HttpError(400, "Masukkan alamat email yang valid.");
    attributes.email = email;
  }
  if (Object.hasOwn(body, "password")) {
    if (typeof body.password !== "string" || body.password.length < 6 || body.password.length > 1024)
      throw new HttpError(400, "Kata sandi baru harus berisi 6–1024 karakter.");
    attributes.password = body.password;
  }
  let image;
  if (Object.hasOwn(body, "avatar")) {
    if (body.avatar === null) image = null;
    else {
      if (!object(body.avatar) || Object.keys(body.avatar).length !== 1 || !Object.hasOwn(body.avatar, "base64"))
        throw invalidProfile();
      image = decodeImage(body.avatar);
    }
  }
  return { attributes, image };
}

async function updateUser(token, attributes) {
  const base = process.env.SUPABASE_URL;
  const apikey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !apikey) throw unavailable();
  let response;
  try {
    // Auth SDK updateUser requires a local session with a refresh token. Call the same
    // non-admin endpoint directly using only the request user's verified access token.
    response = await fetch(`${base.replace(/\/+$/, "")}/auth/v1/user`, {
      method: "PUT",
      redirect: "error",
      headers: { apikey, Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(attributes),
    });
  } catch { throw unavailable(); }
  if (response.status === 429) throw new HttpError(429, "Terlalu banyak percobaan. Coba lagi nanti.");
  if (response.status === 401) throw new HttpError(401, "Sesi tidak valid. Silakan masuk kembali.");
  if (!response.ok) {
    if (response.status >= 500) throw unavailable();
    throw new HttpError(400, "Perubahan profil ditolak. Periksa email atau kata sandi, lalu coba lagi.");
  }
  try { return await response.json(); }
  catch { throw unavailable(); }
}

async function signAvatar(bucket, path) {
  if (!path) return null;
  try {
    const { data, error } = await bucket.createSignedUrl(path, 3600);
    if (!error && data?.signedUrl) return data.signedUrl;
  } catch { /* Do not expose provider errors. */ }
  throw unavailable();
}

async function removeAvatar(bucket, path) {
  try {
    const { error } = await bucket.remove([path]);
    if (!error) return;
  } catch { /* Do not expose provider errors. */ }
  console.error("[Storage] Cleanup foto profil gagal");
}

function profile(user, avatarUrl) {
  const { id, email, user_metadata } = user;
  return { user: { id, email, user_metadata }, avatarUrl };
}

export function profileRoutes(database, { authClientFactory } = {}) {
  const router = express.Router();
  const parseJson = express.json({ limit: "3mb" });
  router.use(async (req, res, next) => {
    res.set("Cache-Control", "no-store");
    if (database.driver !== "supabase") throw new HttpError(503, "Profil memerlukan Supabase.");
    res.locals.session = await authenticated(req, authClientFactory);
    next();
  });
  const bucket = () => (database.storage || database.client.storage)?.from(IMAGE_BUCKET);

  router.get("/", async (req, res) => {
    const { user } = res.locals.session;
    const path = ownedAvatar(user);
    res.json({ data: profile(user, path ? await signAvatar(bucket(), path) : null) });
  });

  router.patch("/", (req, res, next) => {
    parseJson(req, res, error => {
      if (!error) return next();
      if (error.type === "entity.too.large") return next(new HttpError(413, "Data profil terlalu besar. Pilih foto maksimal 2 MB."));
      return next(invalidProfile());
    });
  }, async (req, res) => {
    const { user, token } = res.locals.session;
    const { attributes, image } = validatePatch(req.body);
    const previous = ownedAvatar(user);
    const storage = previous || image ? bucket() : null;
    let uploaded, avatarUrl = null, updated;
    try {
      if (image) {
        const path = avatarPrefix(user.id) + randomUUID() + "." + image.extension;
        try {
          const { error } = await storage.upload(path, image.bytes, { contentType: image.mime, cacheControl: "3600", upsert: false });
          if (error) throw error;
        } catch { throw unavailable(); }
        uploaded = path;
        avatarUrl = await signAvatar(storage, uploaded);
      } else if (image === undefined) {
        avatarUrl = await signAvatar(storage, previous);
      }
      if (image !== undefined) attributes.data = { ...attributes.data, [avatarKey]: uploaded ?? null };
      updated = await updateUser(token, attributes);
      if (updated?.id !== user.id) throw unavailable();
    } catch (error) {
      if (uploaded) await removeAvatar(storage, uploaded);
      throw error;
    }
    if (previous && image !== undefined) await removeAvatar(storage, previous);
    const pending = attributes.email && attributes.email.toLowerCase() !== updated.email?.toLowerCase();
    res.json({ data: profile(updated, avatarUrl), ...(pending ? { message: "Cek kotak masuk untuk konfirmasi perubahan email." } : {}) });
  });
  return router;
}
