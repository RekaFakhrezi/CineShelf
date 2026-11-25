import { useCallback, useEffect, useRef, useState } from "react";
import { apiRequest } from "../services/api.js";

export function emptyLibrary() {
  return {
    saved: [],
    shelves: [{ id: "all", name: "Semua", icon: "albums-outline", isDefault: true, items: [] }],
    watchedList: [],
    userRatings: {},
    userReactions: {},
  };
}

// Mounted once per API + account. No shared-device library is imported into an account.
export function useLibrary(base, getToken, enabled = true) {
  const [library, setLibrary] = useState(emptyLibrary);
  const [ready, setReady] = useState(!enabled);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [revision, setRevision] = useState(0);
  const current = useRef(library);
  const persisted = useRef(null);
  const pending = useRef(null);
  const controller = useRef(null);
  current.current = library;

  useEffect(() => {
    if (!enabled) return;
    const request = new AbortController();
    controller.current = request;
    let active = true;
    setError("");
    (async () => {
      try {
        const token = await getToken();
        const result = await apiRequest(base, "/library", { token, signal: request.signal });
        if (!active) return;
        const initial = result.data || emptyLibrary();
        persisted.current = initial;
        current.current = initial;
        setLibrary(initial);
        setReady(true);
      } catch (e) {
        if (active) setError(e.message);
      }
    })();
    return () => { active = false; request.abort(); };
  }, [base, getToken, revision, enabled]);

  const flush = useCallback(() => {
    if (!enabled) return Promise.resolve();
    if (pending.current) return pending.current;
    if (!persisted.current) return Promise.reject(Error("Rak akun belum selesai dimuat."));
    const signal = controller.current.signal;
    setSaving(true);
    setError("");
    const save = async () => {
      // Serialize snapshots: a slow old request must never overwrite a newer edit.
      while (current.current !== persisted.current) {
        const snapshot = current.current;
        const token = await getToken();
        await apiRequest(base, "/library", { token, method: "PUT", body: snapshot, signal });
        persisted.current = snapshot;
      }
    };
    pending.current = save().catch(e => {
      if (!signal.aborted) setError(e.message);
      throw e;
    }).finally(() => {
      pending.current = null;
      if (!signal.aborted) setSaving(false);
    });
    return pending.current;
  }, [base, getToken, enabled]);

  useEffect(() => {
    if (enabled && ready && library !== persisted.current) flush().catch(() => {});
  }, [library, ready, flush, enabled]);

  const retry = () => ready ? flush().catch(() => {}) : setRevision(value => value + 1);
  return { library, setLibrary, ready, error, saving, retry, flush };
}
