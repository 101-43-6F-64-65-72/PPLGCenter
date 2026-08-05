"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Universal list-fetching hook with race-condition guard, loading & error state.
 * Accepts any loader returning an array or an object with a `data` array.
 * @param {Function} loader - async function returning array or { data: [...] }
 * @param {Object} options - { enabled }
 */
const toArray = (res) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.items)) return res.data.items;
  if (Array.isArray(res?.items)) return res.items;
  return [];
};

export function useAsyncList(loader, { enabled = true } = {}) {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const reload = useCallback(async () => {
    if (!mountedRef.current) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await loader();
      if (mountedRef.current) setItems(toArray(res));
    } catch (err) {
      if (mountedRef.current) setError(err?.message || "Terjadi kesalahan saat memuat data.");
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [loader]);

  useEffect(() => {
    if (!enabled) return;
    const id = window.setTimeout(() => reload(), 0);
    return () => window.clearTimeout(id);
  }, [enabled, reload]);

  return { items, isLoading, error, reload };
}

export default useAsyncList;
