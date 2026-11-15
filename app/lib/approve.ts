// Approved stamp, saved in localStorage so it survives a replay.
// `r` is the tilt, so the saved image matches the screen.

import { useSyncExternalStore } from "react";

export type Approval = { date: string; r: number };

const KEY = "love-letter:approved";
const listeners = new Set<() => void>();
let cache: Approval | null | undefined;

function read(): Approval | null {
  if (cache !== undefined) return cache;
  try {
    cache = JSON.parse(localStorage.getItem(KEY) ?? "null") as Approval | null;
  } catch {
    cache = null;
  }
  return cache;
}

export function readApproval() {
  return read();
}

export function approve() {
  const next: Approval = { date: new Date().toISOString(), r: Math.round((Math.random() * 10 - 12) * 10) / 10 };
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // private mode: keep it for this page only
  }
  listeners.forEach((l) => l());
  return next;
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function useApproval() {
  return useSyncExternalStore(subscribe, read, () => null);
}
