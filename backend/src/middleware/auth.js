import { createClient } from "@supabase/supabase-js";
import { HttpError } from "./errors.js";

export function createAuthClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new HttpError(503, "Konfigurasi Supabase untuk akun belum tersedia.");
  // Never mutate the database service-role client's authorization.
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
}

export function authError(error, unauthorized = false) {
  if (!error) return;
  const status = Number(error.status);
  if (status === 429) throw new HttpError(429, "Terlalu banyak percobaan. Coba lagi nanti.");
  if (status >= 500 || !status) throw new HttpError(503, "Layanan akun tidak tersedia. Coba lagi nanti.");
  throw new HttpError(unauthorized ? 401 : 400, unauthorized ? "Email, kata sandi, atau sesi tidak valid. Silakan masuk kembali." : "Pendaftaran tidak dapat diproses. Periksa email dan kata sandi.");
}

export async function authenticated(req, freshClient = createAuthClient) {
  const match = /^Bearer ([^\s]+)$/i.exec(req.headers.authorization || "");
  if (!match || match[1].length > 8192) throw new HttpError(401, "Silakan masuk untuk melanjutkan.");
  let client, result;
  try {
    client = freshClient();
    result = await client.auth.getUser(match[1]);
  } catch { throw new HttpError(503, "Layanan akun tidak tersedia. Coba lagi nanti."); }
  if (result.error) {
    const status = Number(result.error.status);
    if (!status || status === 429 || status >= 500) throw new HttpError(503, "Layanan akun tidak tersedia. Coba lagi nanti.");
    authError(result.error, true);
  }
  if (!result.data?.user?.id) throw new HttpError(401, "Sesi tidak valid. Silakan masuk kembali.");
  return { user: result.data.user, client, token: match[1] };
}
