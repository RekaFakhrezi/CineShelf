import { HttpError } from "./errors.js";

export const IMAGE_BUCKET = "cineshelf-covers";
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

export function decodeImage(image) {
  if (!image || typeof image.base64 !== "string" || image.base64.length > Math.ceil(MAX_IMAGE_BYTES / 3) * 4)
    throw new HttpError(400, "Pilih foto JPG, PNG, atau WebP maksimal 2 MB.");
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(image.base64) || image.base64.length % 4 !== 0)
    throw new HttpError(400, "Data foto tidak valid. Pilih ulang foto.");
  const bytes = Buffer.from(image.base64, "base64");
  let mime, extension;
  if (bytes.subarray(0, 3).equals(Buffer.from([255, 216, 255]))) { mime = "image/jpeg"; extension = "jpg"; }
  else if (bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) { mime = "image/png"; extension = "png"; }
  else if (bytes.subarray(0,4).toString() === "RIFF" && bytes.subarray(8,12).toString() === "WEBP") { mime = "image/webp"; extension = "webp"; }
  if (!mime || bytes.length < 32 || bytes.length > MAX_IMAGE_BYTES)
    throw new HttpError(400, "Format foto tidak didukung. Gunakan JPG, PNG, atau WebP maksimal 2 MB.");
  return { bytes, mime, extension };
}
