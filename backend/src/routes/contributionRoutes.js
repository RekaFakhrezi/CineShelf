import express from "express";
import { randomUUID } from "node:crypto";
import { HttpError } from "../middleware/errors.js";
import { validateTitle } from "../middleware/validation.js";
import { authenticated } from "../middleware/auth.js";
import { decodeImage, IMAGE_BUCKET } from "../middleware/image.js";

export function contributionRoutes(model, storage, { authClientFactory } = {}) {
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
  }, async (req, res, next) => {
    await authenticated(req, authClientFactory);
    next();
  }, express.json({ limit: "3mb" }), async (req, res) => {
    if (!storage) throw new HttpError(503, "Upload foto memerlukan backend Supabase. Sambungkan API Supabase terlebih dahulu.");
    const body = req.body;
    if (!body || !["film", "serial"].includes(body.type)) throw new HttpError(400, "Pilih jenis Film atau Serial.");
    if (body.website) throw new HttpError(400, "Permintaan tidak valid.");
    const cover = decodeImage(body.cover);
    // Ignore caller-supplied image URLs and validate the catalogue payload before uploading anything.
    const item = validateTitle({ ...body.title, image: "https://placeholder.invalid/cover", color: "#213855" }, body.type);
    if (!(await model.genres()).includes(item.genre)) throw new HttpError(400, "Pilih genre yang tersedia.");
    const bucket = storage.from(IMAGE_BUCKET);
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
