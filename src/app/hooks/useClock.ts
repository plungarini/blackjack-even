import { useSyncExternalStore } from 'react';

const clockListeners = new Set<() => void>();
let clockMs = Date.now();

setInterval(() => {
  clockMs = Date.now();
  for (const l of clockListeners) {
    try { l(); } catch { /* ignore */ }
  }
}, 1000);

function subscribeClock(listener: () => void): () => void {
  clockListeners.add(listener);
  return () => clockListeners.delete(listener);
}

function getNowMs(): number { return clockMs; }

export function useClock(): Date {
  const ms = useSyncExternalStore(subscribeClock, getNowMs, getNowMs);
  return new Date(ms);
}
