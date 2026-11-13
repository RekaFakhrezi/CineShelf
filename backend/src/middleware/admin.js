import { timingSafeEqual } from "node:crypto";
export function requireAdmin(key) {
  return (req, res, next) => {
    if (!key)
      return res
        .status(503)
        .json({
          error: {
            message:
              "Operasi tulis belum diaktifkan. Jalankan npm run setup pada backend.",
          },
        });
    const raw = req.get("authorization") || "";
    const supplied = raw.startsWith("Bearer ") ? raw.slice(7) : "";
    const a = Buffer.from(supplied),
      b = Buffer.from(key);
    if (a.length !== b.length || !timingSafeEqual(a, b))
      return res
        .status(401)
        .json({ error: { message: "Admin API key tidak valid." } });
    next();
  };
}
