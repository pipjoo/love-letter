"use client";

// Replaces the native scrollbar (hidden in globals.css). Shows after the envelope opens.

import { useEffect, useRef, useState } from "react";
import styles from "./ScrollBar.module.css";

export default function ScrollBar() {
  const thumb = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const html = document.documentElement;
    const update = () => {
      setShown(!html.dataset.locked);
      const max = html.scrollHeight - window.innerHeight;
      const p = max > 0 ? window.scrollY / max : 0;
      if (thumb.current) thumb.current.style.setProperty("--p", String(Math.min(1, Math.max(0, p))));
    };
    update();
    const mo = new MutationObserver(update);
    mo.observe(html, { attributes: true, attributeFilter: ["data-locked"] });
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      mo.disconnect();
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div className={styles.track} data-shown={shown} aria-hidden="true">
      <div className={styles.thumb} ref={thumb} />
    </div>
  );
}
