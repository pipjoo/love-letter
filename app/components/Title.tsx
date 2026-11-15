"use client";

// The postcard title and the header are two copies of this. Keep the
// layout identical, Table.tsx swaps them on scroll.

import { forwardRef, useLayoutEffect, useRef } from "react";
import { content } from "../content";
import styles from "./Title.module.css";

type Props = { variant: "card" | "header"; onClick?: () => void };

// the rule between the words never gets shorter than this
const MIN_RULE = 24;

/** Shrink the type only when the words don't fit on one line (a long name on a phone). */
function fitToWidth(el: HTMLElement) {
  el.style.fontSize = "";
  const words = Array.from(el.querySelectorAll<HTMLElement>(`.${styles.word}`));
  const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
  const text = words.reduce((sum, w) => sum + w.scrollWidth, 0);
  const room = el.clientWidth - gap * 2 - MIN_RULE;
  if (text > room) el.style.fontSize = `${(parseFloat(getComputedStyle(el).fontSize) * room) / text}px`;
}

const Title = forwardRef<HTMLDivElement, Props>(function Title({ variant, onClick }, ref) {
  const [left, right] = content.postcard.title;
  const isHeader = variant === "header";
  // the card title is the page's h1; the header is a copy, so it stays a div
  const Tag = isHeader ? "div" : "h1";

  const self = useRef<HTMLElement | null>(null);
  useLayoutEffect(() => {
    const el = self.current;
    // only the card title fits itself. Table.tsx animates the header's size from
    // the card title's, and a fit here fought that tween every frame (stutter).
    if (!el || isHeader) return;
    let width = -1;
    const fit = () => {
      // only on a new width: the fit itself changes the height and would retrigger
      if (el.clientWidth === width) return;
      width = el.clientWidth;
      fitToWidth(el);
    };
    fit();
    document.fonts?.ready.then(() => {
      width = -1;
      fit();
    });
    // next frame, not inside the observer: changing the font there loops the observer
    let frame = 0;
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(fit);
    });
    ro.observe(el);
    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
    };
  }, [isHeader]);

  return (
    <Tag
      ref={(el: HTMLElement | null) => {
        self.current = el;
        if (typeof ref === "function") ref(el as HTMLDivElement);
        else if (ref) ref.current = el as HTMLDivElement;
      }}
      className={isHeader ? `${styles.root} ${styles.header}` : styles.root}
      role={isHeader ? "button" : undefined}
      tabIndex={isHeader ? 0 : undefined}
      aria-label={isHeader ? content.header.replayLabel : undefined}
      data-cursor={isHeader ? "open" : undefined}
      data-cursor-label={isHeader ? content.collage.replayHint : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <span className={styles.word} data-rise>
        {left}
      </span>
      {/* a space for screen readers; flex ignores it */}{" "}
      <span className={styles.rule} />
      <span className={styles.word} data-rise>
        {right}
      </span>
    </Tag>
  );
});

export default Title;
