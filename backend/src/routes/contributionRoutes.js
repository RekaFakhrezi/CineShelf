import express from "express";
import { randomUUID } from "node:crypto";
import { HttpError } from "../middleware/errors.js";
import { validateTitle } from "../middleware/validation.js";

export const COVER_BUCKET = "cineshelf-covers";
export const MAX_COVER_BYTES = 2 * 1024 * 1024;

export function decodeCover(image) {
  if (!image || typeof image.base64 !== "string" || image.base64.length > Math.ceil(MAX_COVER_BYTES / 3) * 4)
    throw new HttpError(400, "Pilih foto JPG, PNG, atau WebP maksimal 2 MB.");
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(image.base64) || image.base64.length % 4 !== 0)
    throw new HttpError(400, "Data foto tidak valid. Pilih ulang foto.");
  const bytes = Buffer.from(image.base64, "base64");
  let mime, extension;
  if (bytes.subarray(0, 3).equals(Buffer.from([255, 216, 255]))) { mime = "image/jpeg"; extension = "jpg"; }
  else if (bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) { mime = "image/png"; extension = "png"; }
  else if (bytes.subarray(0,4).toString() === "RIFF" && bytes.subarray(8,12).toString() === "WEBP") { mime = "image/webp"; extension = "webp"; }
  if (!mime || bytes.length < 32 || bytes.length > MAX_COVER_BYTES)
    throw new HttpError(400, "Format foto tidak didukung. Gunakan JPG, PNG, atau WebP maksimal 2 MB.");
  return { bytes, mime, extension };
}

export function contributionRoutes(model, storage) {
  const router = express.Router();
  // ponytail: per-process throttle for the coursework prototype; use a shared limiter before scaling serverless traffic.
  const attempts = new Map();
  router.post("/", (req, res, next) => {
    const now = Date.now();
    for (const [key, value] of attempts) if (value.until <= now) attempts.delete(key);
    const ip = req.ip || "unknown";
    const previous = attempts.get(ip) || { count: 0, until: now + 600000 };
    if (previous.count >= 5 || attempts.size >= 2048) return next(new HttpError(429, "Terlalu banyak percobaan. Tunggu 10 menit lalu coba lagi."));
    previous.count += 1;
    attempts.set(ip, previous);
    next();
  }, express.json({ limit: "3mb" }), async (req, res) => {
    if (!storage) throw new HttpError(503, "Upload foto memerlukan backend Supabase. Sambungkan API Supabase terlebih dahulu.");
    const body = req.body;
    if (!body || !["film", "serial"].includes(body.type)) throw new HttpError(400, "Pilih jenis Film atau Serial.");
    if (body.website) throw new HttpError(400, "Permintaan tidak valid.");
    const cover = decodeCover(body.cover);
    // Ignore caller-supplied image URLs and validate the catalogue payload before uploading anything.
    const item = validateTitle({ ...body.title, image: "https://placeholder.invalid/cover", color: "#213855" }, body.type);
    if (!(await model.genres()).includes(item.genre)) throw new HttpError(400, "Pilih genre yang tersedia.");
    const bucket = storage.from(COVER_BUCKET);
    const objectPath = "covers/" + randomUUID() + "." + cover.extension;
    const { error: uploadError } = await bucket.upload(objectPath, cover.bytes, { contentType: cover.mime, cacheControl: "3600", upsert: false });
    if (uploadError) throw new HttpError(503, "Foto belum dapat diunggah. Pastikan bucket cineshelf-covers sudah disiapkan, lalu coba lagi.");
    try {
      const signed = await bucket.createSignedUrl(objectPath, 3600);
      if (signed.error) throw signed.error;
      item.image = signed.data.signedUrl;
      item._coverPath = objectPath;
      const created = await model.create(item);
      res.status(201).json({ data: created });
    } catch (error) {
      try { const cleanup = await bucket.remove([objectPath]); if (cleanup.error) console.error("[Storage] Cleanup cover gagal"); }
      catch { console.error("[Storage] Cleanup cover gagal"); }
      throw error;
    }
  });
  return router;
}
