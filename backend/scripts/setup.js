import fs from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../", import.meta.url)),
  target = path.join(root, ".env");
if (fs.existsSync(target)) {
  console.log(".env sudah ada, tidak diubah.");
} else {
  const content = fs
    .readFileSync(path.join(root, ".env.example"), "utf8")
    .replace(
      "ADMIN_API_KEY=",
      "ADMIN_API_KEY=" + randomBytes(32).toString("hex"),
    );
  fs.writeFileSync(target, content, { mode: 0o600 });
  console.log(
    ".env dibuat. Admin key hanya ada di file lokal itu. Jalankan npm start.",
  );
}
