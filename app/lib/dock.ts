// Shared bottom dock. Components add buttons with useDockItem.

import { useEffect, useSyncExternalStore, type ReactNode } from "react";

export type DockItem = { id: string; order: number; node: ReactNode };

let items: DockItem[] = [];
const listeners = new Set<() => void>();

function set(id: string, order: number, node: ReactNode | null) {
  items = items.filter((i) => i.id !== id);
  if (node) items = [...items, { id, order, node }].sort((a, b) => a.order - b.order);
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const EMPTY: DockItem[] = [];

export function useDockItems() {
  return useSyncExternalStore(subscribe, () => items, () => EMPTY);
}

export function useDockItem(id: string, order: number, node: ReactNode | null) {
  useEffect(() => set(id, order, node));
  useEffect(() => () => set(id, order, null), [id, order]);
}
