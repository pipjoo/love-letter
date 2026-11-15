"use client";

import { useEffect, useState } from "react";
import { useDockItems, type DockItem } from "../lib/dock";
import styles from "./Dock.module.css";

type Shown = { item: DockItem; leaving: boolean };

const LEAVE_MS = 400;

export default function Dock() {
  const items = useDockItems();
  const [shown, setShown] = useState<Shown[]>([]);

  useEffect(() => {
    setShown((prev) => {
      const ids = new Set(items.map((i) => i.id));
      const next: Shown[] = items.map((item) => ({ item, leaving: false }));
      prev.forEach((p, i) => {
        if (!ids.has(p.item.id)) next.splice(Math.min(i, next.length), 0, { item: p.item, leaving: true });
      });
      return next;
    });
  }, [items]);

  useEffect(() => {
    if (!shown.some((s) => s.leaving)) return;
    const t = setTimeout(() => setShown((s) => s.filter((x) => !x.leaving)), LEAVE_MS);
    return () => clearTimeout(t);
  }, [shown]);

  return (
    <div className={styles.root} data-open={items.length > 0} data-cursor-plain data-dock>
      <div className={styles.bar}>
        {shown.map(({ item, leaving }) => (
          <div key={item.id} className={styles.slot} data-leaving={leaving || undefined}>
            <div className={styles.slotInner}>{item.node}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
