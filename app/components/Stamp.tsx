"use client";

import { useEffect, useId, useRef } from "react";
import { gsap } from "gsap";
import { drawEngraving, loadLuminance, type Luminance } from "../lib/engrave";
import { STAMP_SHAPES } from "../lib/shapes";
import styles from "./Stamp.module.css";

const TEXTURE = 0.25;

type Props = {
  src: string;
  /** 0 = top/left, 1 = bottom/right */
  focus?: number;
  ink: string;
  month: string;
  day: string;
  country: string;
  year: string;
  shape?: "classic" | "square";
  start: boolean;
  delay?: number;
  instant?: boolean;
  onDrawn?: () => void;
};

export default function Stamp({ src, focus = 0.4, ink, month, day, country, year, shape = "classic", start, delay = 0, instant, onDrawn }: Props) {
  const sheet = STAMP_SHAPES[shape];
  const root = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lumRef = useRef<Luminance | null>(null);
  const progress = useRef({ p: 0 });
  const clipId = `stamp-${useId().replace(/:/g, "")}`;

  const redraw = () => {
    const canvas = canvasRef.current;
    const lum = lumRef.current;
    if (!canvas || !lum) return;
    // 4x resolution so it stays sharp when zoomed in
    const dpr = Math.min((window.devicePixelRatio || 1) * 4, 8);
    const W = Math.round(canvas.clientWidth * dpr);
    const H = Math.round(canvas.clientHeight * dpr);
    if (canvas.width !== W || canvas.height !== H) {
      canvas.width = W;
      canvas.height = H;
    }
    // ~one line per 2.6 CSS px, so small stamps stay readable
    const lines = Math.min(48, Math.max(14, Math.round(canvas.clientHeight / 2.6)));
    drawEngraving(canvas.getContext("2d")!, lum, W, H, ink, progress.current.p, lines);
  };

  useEffect(() => {
    let alive = true;
    const canvas = canvasRef.current!;
    loadLuminance(src, canvas.clientWidth / canvas.clientHeight || 1, focus).then((lum) => {
      if (!alive) return;
      lumRef.current = lum;
      redraw();
    });
    const ro = new ResizeObserver(redraw);
    ro.observe(canvas);
    return () => {
      alive = false;
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  // hidden by CSS from the first paint, so there is no flash before the intro
  useEffect(() => {
    const el = root.current!;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(el.querySelector(`.${styles.outline}`), { strokeDashoffset: 0 });
      gsap.set(el.querySelector(`.${styles.paper}`), { fillOpacity: 1 });
      gsap.set(el.querySelector(`.${styles.texture}`), { opacity: TEXTURE });
      gsap.set(el.querySelectorAll("[data-text]"), { opacity: 1 });
      return;
    }
    gsap.set(el.querySelectorAll("[data-text]"), { opacity: 0, yPercent: 60 });
  }, []);

  useEffect(() => {
    if (!start) return;
    let tl: gsap.core.Timeline | null = null;
    let cancelled = false;
    const run = () => {
      if (cancelled) return;
      if (!lumRef.current) {
        requestAnimationFrame(run);
        return;
      }
      if (instant) {
        progress.current.p = 1;
        gsap.set(root.current!.querySelectorAll("[data-text]"), { opacity: 1, yPercent: 0 });
        redraw();
        onDrawn?.();
        return;
      }
      const el = root.current!;
      tl = gsap
        .timeline({ delay, onComplete: () => onDrawn?.() })
        .to(el.querySelector(`.${styles.outline}`), { strokeDashoffset: 0, autoRound: false, duration: 0.9, ease: "power2.inOut" }, 0)
        .to(el.querySelector(`.${styles.paper}`), { fillOpacity: 1, duration: 0.6, ease: "power1.out" }, 0.7)
        .to(el.querySelector(`.${styles.texture}`), { opacity: TEXTURE, duration: 0.6, ease: "power1.out" }, 0.7)
        .to(el.querySelectorAll("[data-text]"), { opacity: 1, yPercent: 0, duration: 0.6, stagger: 0.08, ease: "power3.out" }, 0.9)
        .to(progress.current, { p: 1, duration: 1.6, ease: "power1.inOut", onUpdate: redraw }, 0.9);
    };
    run();
    return () => {
      cancelled = true;
      tl?.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start]);

  return (
    <div className={styles.root} ref={root} data-shape={shape} style={{ color: ink }}>
      <svg className={styles.sheet} viewBox={`0 0 ${sheet.w} ${sheet.h}`} preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <clipPath id={clipId}>
            <path d={sheet.d} />
          </clipPath>
        </defs>
        <path className={styles.paper} d={sheet.d} />
        {/* texture: Unsplash "White wall paint with black line" */}
        <image
          className={styles.texture}
          href="/photos/texture-stamp.jpg"
          width={sheet.w}
          height={sheet.h}
          preserveAspectRatio="xMidYMid slice"
          clipPath={`url(#${clipId})`}
        />
        <path className={styles.outline} d={sheet.d} pathLength={1} />
      </svg>
      <div className={styles.inner}>
        <div className={styles.row}>
          <span data-text>{month}</span>
          <span className={styles.day} data-text>
            {day}
          </span>
        </div>
        <canvas className={styles.picture} ref={canvasRef} />
        <div className={styles.row}>
          <span data-text>{country}</span>
          <span data-text>{year}</span>
        </div>
      </div>
    </div>
  );
}
