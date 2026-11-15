// Stickers per photo, in localStorage. Positions are % of the polaroid,
// so they line up in the album, the lightbox and the collage.

import { useSyncExternalStore } from "react";

export type Sticker = { e: string; x: number; y: number; r: number };

const KEY = "love-letter:stickers";
type All = Record<string, Sticker[]>;

let cache: All | null = null;
const listeners = new Set<() => void>();
const EMPTY: Sticker[] = [];

function read(): All {
  if (cache) return cache;
  try {
    cache = JSON.parse(localStorage.getItem(KEY) ?? "{}") as All;
  } catch {
    cache = {};
  }
  return cache;
}

function write(next: All) {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // private mode or full storage: keep them in memory
  }
  listeners.forEach((l) => l());
}

export function addSticker(photo: string, sticker: Sticker) {
  const all = read();
  write({ ...all, [photo]: [...(all[photo] ?? []), sticker] });
}

export function clearStickers(photo: string) {
  const rest = { ...read() };
  delete rest[photo];
  write(rest);
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY) return;
    cache = null;
    l();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
  };
};

export function useStickers(photo: string) {
  return useSyncExternalStore(
    subscribe,
    () => read()[photo] ?? EMPTY,
    () => EMPTY,
  );
}
