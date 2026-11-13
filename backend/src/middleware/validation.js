import { HttpError } from "./errors.js";
const fail = (m) => {
  throw new HttpError(400, m);
};
export function text(value, name, max = 300, required = true) {
  if (
    typeof value !== "string" ||
    (required && !value.trim()) ||
    value.length > max
  )
    fail(
      `${name} harus berupa teks ${required ? "yang terisi " : ""}(maksimal ${max} karakter).`,
    );
  return value.trim();
}
export function validateTitle(body, type) {
  if (!body || typeof body !== "object" || Array.isArray(body))
    fail("Body harus object JSON.");
  const allowed = [
    "title",
    "tagline",
    "genre",
    "year",
    "rating",
    "age",
    "duration",
    "image",
    "color",
    "cast",
    "director",
    "synopsis",
    "episodes",
  ];
  for (const k of Object.keys(body))
    if (!allowed.includes(k)) fail(`Field tidak dikenal: ${k}`);
  const result = { type };
  for (const k of ["title", "genre", "duration", "cast", "director"])
    result[k] = text(body[k], k);
  result.tagline = text(body.tagline ?? "", "tagline", 300, false);
  result.synopsis = text(body.synopsis, "synopsis", 5000);
  if (!Number.isInteger(body.year) || body.year < 1888 || body.year > 2100)
    fail("year harus bilangan bulat 1888–2100.");
  result.year = body.year;
  if (
    (typeof body.rating !== "number" && typeof body.rating !== "string") ||
    String(body.rating).trim() === "" ||
    !Number.isFinite(Number(body.rating)) ||
    Number(body.rating) < 0 ||
    Number(body.rating) > 10
  )
    fail("rating harus angka 0–10.");
  result.rating = Number(body.rating).toFixed(1);
  if (!["SU", "13+", "16+", "18+"].includes(body.age))
    fail("age harus SU, 13+, 16+, atau 18+.");
  result.age = body.age;
  try {
    const u = new URL(body.image);
    if (u.protocol !== "https:") throw Error();
    result.image = u.href;
  } catch {
    fail("image harus URL HTTPS.");
  }
  if (typeof body.color !== "string" || !/^#[0-9a-fA-F]{6}$/.test(body.color))
    fail("color harus warna hex, contoh #213855.");
  result.color = body.color;
  if (type === "serial") {
    if (
      !Number.isInteger(body.episodes) ||
      body.episodes < 1 ||
      body.episodes > 100
    )
      fail("episodes harus bilangan bulat 1–100.");
    result.episodes = body.episodes;
  } else if (body.episodes !== undefined)
    fail("Film tidak memiliki field episodes.");
  return result;
}
export function positiveInt(value, fallback, max) {
  if (value === undefined) return fallback;
  if (
    typeof value !== "string" ||
    !/^\d+$/.test(value) ||
    Number(value) < 1 ||
    Number(value) > max
  )
    fail(`Parameter angka harus 1–${max}.`);
  return Number(value);
}
