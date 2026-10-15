import { useCallback, useEffect, useRef, useState } from 'react';
import { storage } from '../state/storage';

/** Return cached JSON-able data if younger than ttl, otherwise run the fetcher and cache its result. */
export async function cached(key, ttlMs, fetcher, { force = false } = {}) {
  const k = `cache:${key}`;
  if (!force) {
    const hit = (await storage.get('local', [k]))[k];
    if (hit && Date.now() - hit.at < ttlMs) return hit.data;
  }
  const data = await fetcher();
  await storage.set('local', { [k]: { at: Date.now(), data } });
  return data;
}

/** React wrapper around `cached`; pass key=null to skip loading. */
export function useCached(key, ttlMs, fetcher) {
  const [state, setState] = useState({ status: key ? 'loading' : 'idle' });
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const requestId = useRef(0);

  const load = useCallback(
    (force) => {
      if (!key) return setState({ status: 'idle' });
      const id = ++requestId.current;
      setState((s) => ({ ...s, status: s.data ? 'refreshing' : 'loading' }));
      cached(key, ttlMs, () => fetcherRef.current(), { force })
        .then((data) => id === requestId.current && setState({ status: 'ok', data }))
        .catch((err) => id === requestId.current && setState({ status: 'error', error: err.message }));
    },
    [key, ttlMs]
  );

  useEffect(() => load(false), [load]);
  return { ...state, refresh: () => load(true) };
}
