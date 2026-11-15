"use client";

// Opened polaroid. Flies out of the album, the album pulls back behind a dim
// overlay. Sides turn, top/bottom/Esc/dock close. Phone: swipe to turn, tap to close.

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { content } from "../content";
import { holdScroll } from "../lib/scroll";
import { useDockItem } from "../lib/dock";
import type { OpenPhoto } from "../lib/lightbox";
import { addSticker, clearStickers, useStickers } from "../lib/stickers";
import { Polaroid } from "./Objects";
import Arrow from "./Arrow";
import dock from "./Dock.module.css";
import styles from "./Lightbox.module.css";

const { items, prevHint, nextHint, closeHint, stickerHint, clearHint } = content.gallery;
const COUNT = items.length;

const FLY = 0.8;
const EASE = "power3.inOut";
const PULL_BACK = 0.94;
const DOCK_SPACE = 80;

function measure(el: HTMLElement) {
  const r = el.getBoundingClientRect();
  const w = el.offsetWidth;
  const h = el.offsetHeight;
  const rotation = parseFloat(getComputedStyle(el).rotate) || 0;
  const rad = (Math.abs(rotation) * Math.PI) / 180;
  const scale = r.width / (w * Math.cos(rad) + h * Math.sin(rad));
  return { x: r.left + r.width / 2 - w / 2, y: r.top + r.height / 2 - h / 2, w, h, scale, rotation };
}

function centre(w: number, h: number) {
  const scale = Math.min((window.innerWidth * 0.84) / w, ((window.innerHeight - DOCK_SPACE) * 0.84) / h);
  const cy = (window.innerHeight - DOCK_SPACE) / 2 + 12;
  return { x: window.innerWidth / 2 - w / 2, y: cy - h / 2, scale, rotation: 0, pw: w * scale, cy };
}

type Card = { index: number; key: number };

export default function Lightbox() {
  const [active, setActive] = useState<Card | null>(null);
  const [leaving, setLeaving] = useState<Card | null>(null);
  const [count, setCount] = useState({ from: 0, to: 0, key: 0 });
  const [tray, setTray] = useState(false);
  const [armed, setArmed] = useState<string | null>(null);
  const keyRef = useRef(0);
  const indexRef = useRef(0);
  const opening = useRef(false);
  const grid = useRef<HTMLElement | null>(null);
  const layer = useRef<HTMLDivElement>(null);
  const overlay = useRef<HTMLDivElement>(null);
  const activeEl = useRef<HTMLDivElement>(null);
  const leavingEl = useRef<HTMLDivElement>(null);
  const busy = useRef(false);
  const touch = useRef(false);

  const source = (i: number) => grid.current?.children[i] as HTMLElement | undefined;
  const sheet = () => grid.current?.parentElement ?? null;

  const pullBack = (on: boolean) => {
    const el = sheet();
    if (!el) return;
    if (on) {
      const r = el.getBoundingClientRect();
      el.style.transformOrigin = `${window.innerWidth / 2 - r.left}px ${window.innerHeight / 2 - r.top}px`;
    }
    el.style.transition = `scale ${FLY}s cubic-bezier(0.65, 0, 0.35, 1)`;
    el.style.scale = on ? String(PULL_BACK) : "";
  };

  // the card's own shade matches the overlay while it flies in or out of the dimmed album
  const shade = (card: HTMLElement, from: number, to: number) =>
    gsap.fromTo(card.querySelector(`.${styles.shade}`), { opacity: from }, { opacity: to, duration: FLY, ease: EASE });

  const flyIn = (card: HTMLElement, i: number, dimmed: boolean, onDone?: () => void) => {
    const src = source(i);
    if (!src) return;
    const from = measure(src);
    const to = centre(from.w, from.h);
    layer.current?.style.setProperty("--pw", `${to.pw}px`);
    gsap.set(card, { width: from.w, height: from.h, x: from.x, y: from.y, scale: from.scale, rotation: from.rotation });
    src.style.visibility = "hidden";
    if (dimmed) shade(card, 1, 0);
    gsap.to(card, { x: to.x, y: to.y, scale: to.scale, rotation: 0, duration: FLY, ease: EASE, onComplete: onDone });
  };

  // measured where the album will be when it lands, not where it is now
  const flyOut = (card: HTMLElement, i: number, albumAt: number, onDone: () => void) => {
    if (albumAt !== 1) shade(card, 0, 1);
    const src = source(i);
    if (!src) return;
    const el = sheet();
    const now = el?.style.scale ?? "";
    if (el) {
      el.style.transition = "none";
      el.style.scale = albumAt === 1 ? "" : String(albumAt);
    }
    const to = measure(src);
    if (el) {
      el.style.scale = now;
      void el.offsetWidth;
    }
    gsap.to(card, {
      x: to.x,
      y: to.y,
      scale: to.scale,
      rotation: to.rotation,
      duration: FLY,
      ease: EASE,
      onComplete: () => {
        src.style.visibility = "";
        onDone();
      },
    });
  };

  useEffect(() => {
    const onOpen = (e: Event) => {
      if (busy.current || active) return;
      const { index: i, grid: g } = (e as CustomEvent<OpenPhoto>).detail;
      grid.current = g;
      indexRef.current = i;
      busy.current = true;
      opening.current = true;
      setCount({ from: i, to: i, key: 0 });
      setActive({ index: i, key: ++keyRef.current });
    };
    window.addEventListener("lightbox:open", onOpen);
    return () => window.removeEventListener("lightbox:open", onOpen);
  }, [active]);

  useLayoutEffect(() => {
    if (!active || !activeEl.current) return;
    const first = opening.current;
    opening.current = false;
    if (first) {
      holdScroll(true);
      gsap.fromTo(overlay.current, { opacity: 0 }, { opacity: 1, duration: FLY, ease: EASE });
    }
    flyIn(activeEl.current, active.index, !first, () => {
      busy.current = false;
    });
    if (first) pullBack(true);
  }, [active?.key]);

  useLayoutEffect(() => {
    if (!leaving || !leavingEl.current) return;
    const src = source(leaving.index);
    if (!src) return;
    const at = centre(src.offsetWidth, src.offsetHeight);
    gsap.set(leavingEl.current, { width: src.offsetWidth, height: src.offsetHeight, x: at.x, y: at.y, scale: at.scale, rotation: 0 });
    flyOut(leavingEl.current, leaving.index, PULL_BACK, () => setLeaving(null));
  }, [leaving?.key]);

  const close = useCallback(() => {
    if (busy.current || !activeEl.current) return;
    busy.current = true;
    const card = activeEl.current;
    gsap.to(overlay.current, { opacity: 0, duration: FLY, ease: EASE });
    flyOut(card, indexRef.current, 1, () => {
      holdScroll(false);
      busy.current = false;
      setActive(null);
      setTray(false);
      setArmed(null);
    });
    pullBack(false);
  }, []);

  const go = useCallback((dir: number) => {
    if (busy.current || !activeEl.current) return;
    busy.current = true;
    const prev = indexRef.current;
    const next = (prev + dir + COUNT) % COUNT;
    indexRef.current = next;
    setCount((c) => ({ from: prev, to: next, key: c.key + 1 }));
    setLeaving({ index: prev, key: ++keyRef.current });
    setActive({ index: next, key: ++keyRef.current });
  }, []);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [!!active, close, go]);

  // a swipe never counts as a tap
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);
  const onPointerDown = (e: React.PointerEvent) => {
    touch.current = e.pointerType !== "mouse";
    swiped.current = false;
    swipe.current = touch.current ? { x: e.clientX, y: e.clientY } : null;
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const start = swipe.current;
    swipe.current = null;
    if (!start) return;
    const dx = e.clientX - start.x;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(e.clientY - start.y)) {
      swiped.current = true;
      go(dx < 0 ? 1 : -1);
    }
  };
  const side = (dir: number) => () => {
    if (swiped.current) return;
    if (touch.current) close();
    else go(dir);
  };
  const outside = () => {
    if (!swiped.current) close();
  };

  const photo = active ? items[active.index].src : "";
  const stuck = useStickers(photo);
  const stick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!active || !armed || swiped.current) return;
    const figure = e.currentTarget.firstElementChild as HTMLElement | null;
    if (!figure) return;
    const r = figure.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    addSticker(photo, { e: armed, x: round(x), y: round(y), r: round(Math.random() * 30 - 15) });
  };

  const open = !!active;
  useDockItem(
    "photo-prev",
    10,
    open ? (
      <button type="button" className={dock.button} aria-label={prevHint} title={prevHint} onClick={() => go(-1)}>
        <Arrow size={16} className={styles.flip} />
      </button>
    ) : null,
  );
  useDockItem("photo-count", 11, open ? <Count from={count.from} to={count.to} n={count.key} /> : null);
  useDockItem(
    "photo-next",
    12,
    open ? (
      <button type="button" className={dock.button} aria-label={nextHint} title={nextHint} onClick={() => go(1)}>
        <Arrow size={16} />
      </button>
    ) : null,
  );
  useDockItem(
    "photo-stickers",
    15,
    open ? (
      <button
        type="button"
        className={dock.button}
        aria-label={stickerHint}
        aria-pressed={tray}
        title={stickerHint}
        data-on={tray || undefined}
        onClick={() => {
          setTray((t) => !t);
          setArmed(null);
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <path
            d="M8 14 C3 10.5 1 8 1 5.4 C1 3.3 2.6 2 4.4 2 C6 2 7.2 3 8 4.3 C8.8 3 10 2 11.6 2 C13.4 2 15 3.3 15 5.4 C15 8 13 10.5 8 14 Z"
            stroke="currentColor"
            strokeWidth="1"
            fill="none"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </button>
    ) : null,
  );
  useDockItem(
    "photo-unstick",
    16,
    open && tray && stuck.length ? (
      <button type="button" className={dock.button} aria-label={clearHint} title={clearHint} onClick={() => clearStickers(photo)}>
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <path
            d="M2.5 4 H13.5 M6 4 V2.5 H10 V4 M4 4 L4.8 14 H11.2 L12 4"
            stroke="currentColor"
            strokeWidth="1"
            fill="none"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </button>
    ) : null,
  );
  useDockItem(
    "photo-close",
    20,
    open ? (
      <button type="button" className={dock.button} aria-label={closeHint} title={closeHint} onClick={close}>
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
          <path d="M1 1 L13 13 M13 1 L1 13" stroke="currentColor" strokeWidth="1" fill="none" vectorEffect="non-scaling-stroke" />
        </svg>
      </button>
    ) : null,
  );

  if (!active) return null;

  return (
    <div
      ref={layer}
      className={styles.layer}
      role="dialog"
      aria-modal="true"
      aria-label={items[active.index].alt}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
    >
      <div ref={overlay} className={styles.overlay} data-cursor="open" data-cursor-label={closeHint} onClick={outside} />
      <div className={`${styles.zone} ${styles.prev}`} data-cursor="prev" onClick={side(-1)} />
      <div className={`${styles.zone} ${styles.next}`} data-cursor="next" onClick={side(1)} />
      {leaving ? (
        <div key={leaving.key} ref={leavingEl} className={styles.card} data-cursor-plain>
          <Polaroid photo={items[leaving.index]} index={leaving.index} still style={{ rotate: "0deg", width: "100%", height: "100%" }} />
          <span className={styles.shade} />
        </div>
      ) : null}
      <div
        key={active.key}
        ref={activeEl}
        className={styles.card}
        {...(armed ? { "data-cursor": "open", "data-cursor-label": armed } : { "data-cursor-plain": true })}
        onClick={stick}
      >
        <Polaroid photo={items[active.index]} index={active.index} still style={{ rotate: "0deg", width: "100%", height: "100%" }} />
        <span className={styles.shade} />
      </div>
      {tray ? (
        <div className={styles.tray} role="toolbar" aria-label={stickerHint} data-cursor-plain>
          {content.gallery.stickers.map((e) => (
            <button
              key={e}
              type="button"
              className={styles.pick}
              aria-pressed={armed === e}
              onClick={() => setArmed((a) => (a === e ? null : e))}
            >
              {e}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

const round = (n: number) => Math.round(n * 10) / 10;

function Count({ from, to, n }: { from: number; to: number; n: number }) {
  const up = to > from;
  const changed = from !== to;
  return (
    <span className={dock.count}>
      <span className={styles.sr} aria-live="polite">
        {to + 1} / {COUNT}
      </span>
      <span className={styles.roll} aria-hidden="true">
        {changed ? (
          <span key={`out-${n}`} className={up ? styles.outUp : styles.outDown}>
            {from + 1}
          </span>
        ) : null}
        <span key={`in-${n}`} className={changed ? (up ? styles.inUp : styles.inDown) : undefined}>
          {to + 1}
        </span>
      </span>
      <span aria-hidden="true">/{COUNT}</span>
    </span>
  );
}
