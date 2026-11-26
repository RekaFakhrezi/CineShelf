import { useCallback, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiRequest, normalizeApiUrl } from "../services/api";

// Serialize credential reads/writes, including a quick switch back to the same API.
let storageQueue = Promise.resolve();
function withStorage(action) {
  const pending = storageQueue.then(action);
  storageQueue = pending.catch(() => {});
  return pending;
}

const emptyState = { session: null, ready: false, busy: false, error: "", message: "" };
const validSession = (session) => Boolean(
  session?.access_token && session?.refresh_token && session?.user?.id,
);
const current = (scope, version) => scope.active && scope.version === version;

export function useAuth(base, enabled = true) {
  const scope = useMemo(() => {
    let url = "", configurationError = "";
    if (enabled) {
      try { url = normalizeApiUrl(base); }
      catch (error) { configurationError = error.message; }
    }
    return {
      url, configurationError, enabled,
      key: `cineshelf.auth.v1:${url}`,
      active: false, version: 0, session: null, refresh: null, operation: false,
      controller: null,
    };
  }, [base, enabled]);
  const [state, setState] = useState({ scope: null, ...emptyState });
  const publish = useCallback((patch) => {
    if (!scope.active) return;
    setState((previous) => ({
      ...(previous.scope === scope ? previous : { ...emptyState, scope }),
      ...patch,
    }));
  }, [scope]);

  const persist = useCallback(async (session, version) => {
    await withStorage(() => {
      if (!current(scope, version)) return;
      return session
        ? AsyncStorage.setItem(scope.key, JSON.stringify(session))
        : AsyncStorage.removeItem(scope.key);
    });
  }, [scope]);

  const refresh = useCallback(() => {
    if (scope.refresh) return scope.refresh;
    const version = scope.version;
    const stored = scope.session;
    if (!stored || !current(scope, version)) return Promise.resolve(null);
    const pending = (async () => {
      try {
        const response = await apiRequest(scope.url, "/auth/refresh", {
          method: "POST", body: { refresh_token: stored.refresh_token },
          signal: scope.controller.signal,
        });
        if (!current(scope, version)) return null;
        if (!validSession(response.data)) throw Error("Sesi dari server tidak valid. Coba masuk kembali.");
        const session = scope.session.user === stored.user
          ? response.data
          : { ...response.data, user: scope.session.user };
        scope.session = session;
        await persist(session, version);
        if (!current(scope, version)) return null;
        publish({ session: scope.session, error: "", message: "" });
        return session.access_token;
      } catch (error) {
        if (!current(scope, version)) return null;
        if (error.status === 401) {
          scope.session = null;
          publish({ session: null });
          await persist(null, version);
        }
        if (current(scope, version)) {
          publish({ error: error.status === 401
            ? "Sesi berakhir. Silakan masuk kembali."
            : error.message || "Sesi belum dapat diperbarui. Periksa koneksi lalu coba lagi." });
        }
        throw error;
      } finally {
        if (scope.refresh === pending) scope.refresh = null;
      }
    })();
    scope.refresh = pending;
    return pending;
  }, [scope, persist, publish]);

  useEffect(() => {
    scope.active = true;
    scope.controller = new AbortController();
    scope.session = null;
    scope.refresh = null;
    scope.operation = false;
    const version = ++scope.version;
    publish({ ...emptyState, busy: enabled && !scope.configurationError });
    if (!enabled || scope.configurationError) {
      publish({ ready: true, busy: false, error: scope.configurationError });
    } else {
      (async () => {
        try {
          const stored = await withStorage(() => AsyncStorage.getItem(scope.key));
          if (!current(scope, version)) return;
          let session = null;
          try { session = stored ? JSON.parse(stored) : null; } catch {}
          if (validSession(session)) {
            scope.session = session;
            await refresh();
          } else if (stored) {
            await persist(null, version);
          }
        } catch (error) {
          if (current(scope, version)) publish({ error: error.message || "Sesi tersimpan tidak dapat dibaca." });
        } finally {
          if (current(scope, version)) publish({ ready: true, busy: false });
        }
      })();
    }
    return () => {
      scope.active = false;
      scope.version += 1;
      scope.controller.abort();
      scope.session = null;
    };
  }, [scope, enabled, persist, publish, refresh]);

  const authenticate = useCallback(async (path, email, password, name) => {
    if (!scope.active || scope.operation || !scope.enabled || scope.configurationError) return false;
    scope.operation = true;
    const version = ++scope.version;
    publish({ busy: true, error: "", message: "" });
    try {
      const response = await apiRequest(scope.url, path, {
        method: "POST", body: { email: email.trim(), password, ...(name !== undefined ? { name: name.trim() } : {}) },
        signal: scope.controller.signal,
      });
      if (!current(scope, version)) return false;
      if (response.data && !validSession(response.data)) throw Error("Sesi dari server tidak valid.");
      if (path === "/auth/login" && !response.data) throw Error(response.message || "Masuk gagal. Periksa email dan kata sandi.");
      scope.session = response.data || null;
      await persist(scope.session, version);
      if (!current(scope, version)) return false;
      publish({ session: scope.session, message: response.message || (!response.data ? "Akun dibuat. Periksa email untuk konfirmasi sebelum masuk." : "") });
      return true;
    } catch (error) {
      if (current(scope, version)) publish({ error: error.message || "Tidak dapat masuk. Coba lagi." });
      return false;
    } finally {
      if (current(scope, version)) {
        scope.operation = false;
        publish({ busy: false });
      }
    }
  }, [scope, persist, publish]);

  const getToken = useCallback(async () => {
    if (!scope.active || !scope.session) throw Error("Silakan masuk terlebih dahulu.");
    const expiresAt = Number(scope.session.expires_at);
    if (!expiresAt || expiresAt * 1000 <= Date.now() + 60000) {
      const token = await refresh();
      if (!token) throw Error("Sesi tidak lagi aktif. Silakan masuk kembali.");
      return token;
    }
    return scope.session.access_token;
  }, [scope, refresh]);

  const getProfile = useCallback(async () => {
    const version = scope.version;
    const token = await getToken();
    if (!current(scope, version)) throw Error("Sesi tidak lagi aktif.");
    const { data } = await apiRequest(scope.url, "/profile", {
      token, signal: scope.controller.signal,
    });
    if (!current(scope, version) || !scope.session || data?.user?.id !== scope.session.user.id)
      throw Error("Sesi tidak lagi aktif.");
    return data;
  }, [scope, getToken]);

  const updateProfile = useCallback(async (patch) => {
    if (!scope.active || !scope.session) throw Error("Silakan masuk terlebih dahulu.");
    if (scope.operation) throw Error("Tunggu proses akun selesai, lalu coba lagi.");
    scope.operation = true;
    const version = scope.version;
    try {
      const token = await getToken();
      if (!current(scope, version)) throw Error("Sesi tidak lagi aktif.");
      const response = await apiRequest(scope.url, "/profile", {
        method: "PATCH", body: patch, token, signal: scope.controller.signal,
        timeout: patch.avatar ? 60000 : 12000,
      });
      if (!current(scope, version) || !scope.session || response.data?.user?.id !== scope.session.user.id)
        throw Error("Sesi tidak lagi aktif.");
      const session = { ...scope.session, user: response.data.user };
      scope.session = session;
      await persist(session, version);
      if (!current(scope, version)) throw Error("Sesi tidak lagi aktif.");
      publish({ session: scope.session });
      return response;
    } finally {
      if (current(scope, version)) scope.operation = false;
    }
  }, [scope, getToken, persist, publish]);

  const logout = useCallback(async () => {
    if (!scope.active || scope.operation) return false;
    scope.operation = true;
    publish({ busy: true, error: "", message: "" });
    let version = scope.version;
    try {
      const token = await getToken();
      if (!current(scope, version)) return false;
      version = ++scope.version;
      try {
        await apiRequest(scope.url, "/auth/logout", {
          method: "POST", token, signal: scope.controller.signal,
        });
      } catch (error) {
        if (error.status !== 401) throw error;
      }
      if (!current(scope, version)) return false;
      await persist(null, version);
      if (!current(scope, version)) return false;
      scope.session = null;
      publish({ session: null });
      return true;
    } catch (error) {
      if (current(scope, version)) publish({ error: error.message || "Keluar gagal. Periksa koneksi dan coba lagi." });
      return false;
    } finally {
      if (current(scope, version)) {
        scope.operation = false;
        publish({ busy: false });
      }
    }
  }, [scope, getToken, persist, publish]);

  const retry = useCallback(async () => {
    if (!scope.active || scope.operation || !scope.session) return false;
    scope.operation = true;
    publish({ busy: true, error: "" });
    try { await refresh(); return true; }
    catch { return false; }
    finally {
      if (scope.active) {
        scope.operation = false;
        publish({ busy: false, ready: true });
      }
    }
  }, [scope, refresh, publish]);

  const visible = state.scope === scope ? state : emptyState;
  return {
    session: visible.session,
    ready: visible.ready,
    busy: visible.busy,
    error: visible.error,
    message: visible.message,
    login: (email, password) => authenticate("/auth/login", email, password),
    signup: (email, password, name) => authenticate("/auth/signup", email, password, name),
    logout, getToken, getProfile, updateProfile,
    retry: scope.session ? retry : undefined,
  };
}
