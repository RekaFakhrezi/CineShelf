import { readConfig } from "../src/config/env.js";
import { connectDatabase } from "../src/config/database.js";
import { createApp } from "../src/app.js";
let appPromise;
export default async function handler(req, res) {
  try {
    if (!appPromise)
      appPromise = (async () => {
        const c = readConfig();
        if (c.driver !== "supabase")
          throw Error("Vercel harus memakai Supabase.");
        return createApp(await connectDatabase(c), c);
      })().catch((e) => {
        appPromise = undefined;
        throw e;
      });
    return (await appPromise)(req, res);
  } catch {
    res
      .status(503)
      .json({ error: { message: "Konfigurasi backend belum lengkap." } });
  }
}
