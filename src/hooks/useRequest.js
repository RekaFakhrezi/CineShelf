import { useEffect, useState } from "react";
export function useRequest(load, deps, enabled = true) {
  const [attempt, setAttempt] = useState(0),
    [state, setState] = useState({
      key: "",
      data: null,
      loading: enabled,
      error: "",
    });
  const key = JSON.stringify([...deps, enabled, attempt]);
  useEffect(() => {
    if (!enabled) {
      setState({ key, data: null, loading: false, error: "" });
      return;
    }
    let active = true;
    const controller = new AbortController();
    setState({ key, data: null, loading: true, error: "" });
    Promise.resolve()
      .then(() => load(controller.signal))
      .then((data) => {
        if (active) setState({ key, data, loading: false, error: "" });
      })
      .catch((error) => {
        if (active)
          setState({
            key,
            data: null,
            loading: false,
            error: error.message || "Terjadi kesalahan.",
          });
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [key]);
  // Jangan tampilkan data request sebelumnya walaupun effect baru belum berjalan.
  return {
    ...(state.key === key
      ? state
      : { data: null, loading: enabled, error: "" }),
    retry: () => setAttempt((n) => n + 1),
  };
}
export function useDebounced(value, delay = 300) {
  const [result, setResult] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setResult(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return result;
}
