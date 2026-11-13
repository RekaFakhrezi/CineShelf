import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import path from "node:path";
export const backendRoot = fileURLToPath(new URL("../../", import.meta.url));
dotenv.config({ path: path.join(backendRoot, ".env"), quiet: true });
export function readConfig() {
  const driver = process.env.DB_DRIVER || "sqlite";
  if (!["sqlite", "supabase"].includes(driver))
    throw Error("DB_DRIVER harus sqlite atau supabase.");
  if (process.env.VERCEL && driver !== "supabase")
    throw Error(
      "Deployment Vercel wajib DB_DRIVER=supabase; SQLite lokal tidak persisten di serverless.",
    );
  const port = Number(process.env.PORT || 5002);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw Error("PORT tidak valid.");
  return {
    driver,
    port,
    host: process.env.HOST || "0.0.0.0",
    sqlitePath: path.resolve(
      backendRoot,
      process.env.SQLITE_PATH || "data/cineshelf.db",
    ),
    adminKey: process.env.ADMIN_API_KEY || "",
    origins: (process.env.CORS_ORIGINS || "")
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean),
  };
}
