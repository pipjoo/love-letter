"use client";

// Custom cursor, mouse only. Touch keeps the native behavior.

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { content } from "../content";
import Arrow from "./Arrow";
import styles from "./Cursor.module.css";

type Mode = "default" | "invert" | "open" | "prev" | "next";

function hasOwnText(el: Element) {
  for (const node of Array.from(el.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) return true;
  }
  return false;
}

function modeFor(target: Element | null): { mode: Mode; label: string } {
  if (!target) return { mode: "default", label: "" };
  if (document.documentElement.dataset.stampZoom && !target.closest("[data-dock]")) {
    return { mode: "open", label: content.envelope.backHint };
  }
  if (document.documentElement.dataset.capture && target.closest("main [data-cursor]")) {
    return { mode: "open", label: content.collage.dragHint };
  }
  const action = target.closest<HTMLElement>("[data-cursor]");
  if (action) {
    const turn = action.dataset.cursor;
    if (turn === "prev" || turn === "next") return { mode: turn, label: "" };
    return { mode: "open", label: action.dataset.cursorLabel ?? "" };
  }
  // the letter: keep the small dot over long text
  if (target.closest("[data-cursor-plain]")) return { mode: "default", label: "" };
  const tag = target.tagName.toLowerCase();
  if (tag === "text" || tag === "textpath" || hasOwnText(target)) {
    return { mode: "invert", label: "" };
  }
  return { mode: "default", label: "" };
}

export default function Cursor() {
  const root = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [state, setState] = useState<{ mode: Mode; label: string }>({ mode: "default", label: "" });
  const [visible, setVisible] = useState(false);
  const [roll, setRoll] = useState<{ prev: string; next: string; key: number }>({ prev: "", next: "", key: 0 });
  const shown = useRef("");

  useEffect(() => {
    const next = state.mode === "open" ? state.label : "";
    if (!next || next === shown.current) {
      // keep the last label so it fades out with the ring
      if (!next) shown.current = "";
      return;
    }
    const prev = shown.current;
    shown.current = next;
    setRoll((r) => ({ prev, next, key: r.key + 1 }));
  }, [state]);

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setEnabled(fine.matches);
    update();
    fine.addEventListener("change", update);
    return () => fine.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!enabled || !root.current) return;
    document.documentElement.classList.add(styles.hideNative);
    const xTo = gsap.quickTo(root.current, "x", { duration: 0.25, ease: "power3.out" });
    const yTo = gsap.quickTo(root.current, "y", { duration: 0.25, ease: "power3.out" });
    let first = true;
    let at: { x: number; y: number } | null = null;

    const update = () => {
      if (!at) return;
      const next = modeFor(document.elementFromPoint(at.x, at.y));
      setState((prev) => (prev.mode === next.mode && prev.label === next.label ? prev : next));
    };
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      if (first) {
        gsap.set(root.current, { x: e.clientX, y: e.clientY });
        first = false;
      }
      xTo(e.clientX);
      yTo(e.clientY);
      setVisible(true);
      at = { x: e.clientX, y: e.clientY };
      update();
    };
    const leave = () => setVisible(false);
    // zooming changes what a click does without the mouse moving, so recheck
    const zoom = new MutationObserver(update);
    zoom.observe(document.documentElement, { attributes: true, attributeFilter: ["data-stamp-zoom", "data-capture"] });

    window.addEventListener("pointermove", move);
    document.documentElement.addEventListener("pointerleave", leave);
    return () => {
      document.documentElement.classList.remove(styles.hideNative);
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", leave);
      zoom.disconnect();
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div className={styles.root} ref={root} data-mode={state.mode} data-visible={visible} aria-hidden="true">
      <div className={styles.ring}>
        <Arrow size={20} className={styles.arrow} />
        <span className={styles.label} data-emoji={/\p{Extended_Pictographic}/u.test(roll.next) || undefined}>
          {roll.prev && (
            <span key={`out-${roll.key}`} className={styles.rollOut}>
              {roll.prev}
            </span>
          )}
          <span key={`in-${roll.key}`} className={styles.rollIn}>
            {roll.next}
          </span>
        </span>
      </div>
    </div>
  );
}
