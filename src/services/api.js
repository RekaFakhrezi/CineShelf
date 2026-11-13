export function normalizeApiUrl(value) {
  let url;
  try {
    url = new URL(value.trim());
  } catch {
    throw Error("Masukkan URL lengkap, contoh http://192.168.1.10:5002/api");
  }
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  )
    throw Error(
      "Gunakan URL HTTP/HTTPS tanpa kredensial, query, atau fragment.",
    );
  const pathname = url.pathname.replace(/\/+$/, "");
  url.pathname = pathname.endsWith("/api") ? pathname : `${pathname}/api`;
  return url.toString().replace(/\/$/, "");
}
export async function apiRequest(
  base,
  path,
  { signal, method = "GET", body } = {},
) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener("abort", abort, { once: true });
  if (signal?.aborted) controller.abort();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(`${normalizeApiUrl(base)}${path}`, {
      method,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    let json;
    try {
      json = await response.json();
    } catch {
      throw Error("Server tidak mengirim JSON. Periksa alamat API.");
    }
    if (!response.ok)
      throw Error(
        json?.error?.message || `Permintaan gagal (${response.status}).`,
      );
    return json;
  } catch (error) {
    if (signal?.aborted) throw error;
    if (error.name === "AbortError")
      throw Error(
        "Server belum merespons dalam 12 detik. Periksa koneksi dan coba lagi.",
      );
    if (error instanceof TypeError)
      throw Error(
        "Tidak dapat menghubungi API. Pastikan server aktif dan alamat IP benar.",
      );
    throw error;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abort);
  }
}
export const endpointFor = (type) => (type === "serial" ? "series" : "movies");
export function createApi(base) {
  return {
    health: (signal) => apiRequest(base, "/health", { signal }),
    home: (signal) => apiRequest(base, "/home", { signal }),
    genres: (signal) => apiRequest(base, "/genres", { signal }),
    list: (
      type,
      { q = "", genre = "Semua", page = 1, limit = 12 } = {},
      signal,
    ) =>
      apiRequest(
        base,
        `/${endpointFor(type)}?q=${encodeURIComponent(q)}&genre=${encodeURIComponent(genre === "Semua" ? "" : genre)}&page=${page}&limit=${limit}`,
        { signal },
      ),
    detail: (item, signal) =>
      apiRequest(
        base,
        `/${endpointFor(item.type)}/${encodeURIComponent(item.id)}`,
        { signal },
      ),
    resolve: async (ids, signal) => {
      const data = [];
      for (let start = 0; start < ids.length; start += 100) {
        const result = await apiRequest(base, "/catalog/resolve", {
          signal,
          method: "POST",
          body: { ids: ids.slice(start, start + 100) },
        });
        data.push(...result.data);
      }
      return { data };
    },
  };
}
