"use client";

// Click a stamp to zoom the envelope in on its stamps. Any click, Esc or
// the dock zooms back out. Works at the start and in the collage.

import { useEffect, useRef, useState, type RefObject } from "react";
import { gsap } from "gsap";
import { content } from "../content";
import { holdScroll } from "./scroll";
import { useDockItem } from "./dock";
import dock from "../components/Dock.module.css";

type Refs = {
  root: RefObject<HTMLDivElement | null>;
  stage: RefObject<HTMLDivElement | null>;
  front: RefObject<HTMLButtonElement | null>;
  stamps: RefObject<HTMLDivElement | null>;
  ready: boolean;
  opened: RefObject<boolean>;
};

type Rest = { x: number; y: number; scale: number };

const IN = 0.9;
const OUT = 0.8;
const EASE = "power3.inOut";
const DOCK_SPACE = 80;

const num = (el: Element, p: string) => Number(gsap.getProperty(el, p));

export function useStampZoom({ root, stage, front, stamps, ready, opened }: Refs) {
  const [zoomed, setZoomed] = useState(false);
  const rest = useRef<Rest | null>(null);
  const inCollage = useRef(false);
  const busy = useRef(false);
  const readyRef = useRef(ready);
  readyRef.current = ready;

  const zoomIn = () => {
    const env = front.current;
    const st = stamps.current;
    if (!env || !st || busy.current) return;
    busy.current = true;
    inCollage.current = !!document.documentElement.dataset.collage;
    document.documentElement.dataset.stampZoom = "true";
    rest.current = { x: num(env, "x"), y: num(env, "y"), scale: num(env, "scale") };

    // the envelope tilts toward the cursor at the start; level it before measuring
    if (!inCollage.current && stage.current) {
      gsap.killTweensOf(stage.current);
      gsap.set(stage.current, { rotationX: 0, rotationY: 0, x: 0, y: 0 });
    }
    if (inCollage.current) {
      holdScroll(true);
      // above the collage and the postcard (same layer)
      if (root.current) root.current.style.zIndex = "15";
      env.style.zIndex = "10";
    }

    const e = env.getBoundingClientRect();
    const s = st.getBoundingClientRect();
    const ex = e.left + e.width / 2;
    const ey = e.top + e.height / 2;
    const sx = s.left + s.width / 2;
    const sy = s.top + s.height / 2;
    const k = Math.min((window.innerWidth * 0.72) / s.width, ((window.innerHeight - DOCK_SPACE) * 0.6) / s.height);
    const cx = window.innerWidth / 2;
    const cy = (window.innerHeight - DOCK_SPACE) / 2 + 12;
    const r = rest.current;
    gsap.to(env, {
      x: r.x + cx - (ex + k * (sx - ex)),
      y: r.y + cy - (ey + k * (sy - ey)),
      scale: r.scale * k,
      duration: IN,
      ease: EASE,
      onComplete: () => {
        busy.current = false;
      },
    });
    setZoomed(true);
  };

  const zoomOut = () => {
    const env = front.current;
    const r = rest.current;
    if (!env || !r || busy.current) return;
    busy.current = true;
    setZoomed(false);
    gsap.to(env, {
      ...r,
      duration: OUT,
      ease: EASE,
      onComplete: () => {
        if (inCollage.current) {
          if (root.current) root.current.style.zIndex = "";
          env.style.zIndex = "";
          holdScroll(false);
        }
        delete document.documentElement.dataset.stampZoom;
        rest.current = null;
        busy.current = false;
      },
    });
  };

  const actions = useRef({ zoomIn, zoomOut });
  actions.current = { zoomIn, zoomOut };

  useEffect(() => {
    const allowed = () => {
      const html = document.documentElement.dataset;
      if (html.capture) return false;
      return html.collage ? true : readyRef.current && !opened.current;
    };
    const inDock = (t: EventTarget | null) => !!(t as Element | null)?.closest?.("[data-dock]");
    let down: { x: number; y: number } | null = null;

    // capture phase, so the envelope doesn't also open, replay or drag
    const onDown = (e: PointerEvent) => {
      down = { x: e.clientX, y: e.clientY };
      if (rest.current && !inDock(e.target)) e.stopPropagation();
    };
    const onClick = (e: MouseEvent) => {
      if (rest.current) {
        if (inDock(e.target)) return;
        e.preventDefault();
        e.stopPropagation();
        actions.current.zoomOut();
        return;
      }
      const onStamp = stamps.current?.contains(e.target as Node);
      // started on a stamp but moved: still a drag
      const dragged = down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 5;
      if (!onStamp || dragged || !allowed()) return;
      e.preventDefault();
      e.stopPropagation();
      actions.current.zoomIn();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && rest.current) actions.current.zoomOut();
    };

    window.addEventListener("pointerdown", onDown, true);
    window.addEventListener("click", onClick, true);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown, true);
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("keydown", onKey);
    };
  }, [stamps, opened]);

  const closeHint = content.gallery.closeHint;
  useDockItem(
    "stamp-close",
    20,
    zoomed ? (
      <button type="button" className={dock.button} aria-label={closeHint} title={closeHint} onClick={() => actions.current.zoomOut()}>
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
          <path d="M1 1 L13 13 M13 1 L1 13" stroke="currentColor" strokeWidth="1" fill="none" vectorEffect="non-scaling-stroke" />
        </svg>
      </button>
    ) : null,
  );
}
