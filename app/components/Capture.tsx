"use client";

// 9:16 story capture of the collage. Pieces can be dragged into the frame,
// then the table is screenshotted and cropped to 1080x1920.

import { useEffect, useRef, useState } from "react";
import { content } from "../content";
import { useDockItem } from "../lib/dock";
import { holdScroll } from "../lib/scroll";
import { canShareFiles } from "../lib/share";
import { SaveButton, ShareButton } from "./FileButtons";
import dock from "./Dock.module.css";
import styles from "./Capture.module.css";

const OUT_W = 1080;
const OUT_H = 1920;
// the pin wraps the table in a spacer, so not `main > section`
const scene = () => document.querySelector<HTMLElement>("main section");
const TOP_SPACE = 64;
const BOTTOM_SPACE = 96;

// modern-screenshot ignores backface-visibility and draws both sides of a
// card (the back mirrored). Skip whichever side is face down.
function facingUp(node: Node) {
  if (!(node instanceof HTMLElement)) return true;
  const side = node.closest<HTMLElement>("[data-side]")?.dataset.side;
  const cls = node.className;
  if (typeof cls !== "string") return true;
  if (cls.includes("cardBack")) return side === "back";
  if (cls.includes("cardFront")) return side !== "back";
  if (cls.includes("lastFront")) return side === "photo";
  if (cls.includes("lastAsk")) return side !== "photo";
  return true;
}

// The SVG noise grain renders as a black box in the screenshot. Drop it;
// the JPG grain on top is enough.
const NOISE = /url\("data:image\/svg\+xml[^"]*feTurbulence[^"]*"\)/g;
function withoutNoise(node: Node) {
  if (!(node instanceof HTMLElement)) return;
  const bg = node.style.backgroundImage;
  if (bg && bg.includes("feTurbulence")) node.style.backgroundImage = bg.replace(NOISE, "none");
}

function frameSize() {
  const h = Math.min(window.innerHeight - TOP_SPACE - BOTTOM_SPACE, ((window.innerWidth - 32) * OUT_H) / OUT_W);
  return { w: (h * OUT_W) / OUT_H, h };
}

export default function Capture() {
  const { captureHint, captureGuide, captureSaveHint, captureShareHint, captureCloseHint, captureFile } = content.collage;
  const [collage, setCollage] = useState(false);
  const [on, setOn] = useState(false);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const frame = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const html = document.documentElement;
    const update = () => setCollage(!!html.dataset.collage);
    update();
    const mo = new MutationObserver(update);
    mo.observe(html, { attributes: true, attributeFilter: ["data-collage"] });
    return () => mo.disconnect();
  }, []);

  useEffect(() => {
    if (!on) return;
    // the screenshot library only loads once someone opens the frame
    void import("modern-screenshot");
    const html = document.documentElement;
    html.dataset.capture = "true";
    holdScroll(true);
    const fit = () => setSize(frameSize());
    fit();
    window.addEventListener("resize", fit);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOn(false);
    window.addEventListener("keydown", onKey);
    return () => {
      delete html.dataset.capture;
      holdScroll(false);
      window.removeEventListener("resize", fit);
      window.removeEventListener("keydown", onKey);
    };
  }, [on]);

  const shoot = async () => {
    const table = scene();
    const box = frame.current;
    if (!table || !box) return null;
    const f = box.getBoundingClientRect();
    const t = table.getBoundingClientRect();
    const scale = OUT_H / f.height;
    const { domToCanvas } = await import("modern-screenshot");
    const shot = await domToCanvas(table, { scale, backgroundColor: content.theme.table, filter: facingUp, onCloneEachNode: withoutNoise });
    const out = document.createElement("canvas");
    out.width = OUT_W;
    out.height = OUT_H;
    out.getContext("2d")!.drawImage(shot, (f.left - t.left) * scale, (f.top - t.top) * scale, f.width * scale, f.height * scale, 0, 0, OUT_W, OUT_H);
    const blob = await new Promise<Blob | null>((resolve) => out.toBlob(resolve, "image/png"));
    return blob ? new File([blob], captureFile, { type: "image/png" }) : null;
  };

  useDockItem(
    "capture",
    40,
    collage && !on ? (
      <button type="button" className={dock.button} aria-label={captureHint} title={captureHint} onClick={() => setOn(true)}>
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <path
            d="M1.5 5 V1.5 H5 M11 1.5 H14.5 V5 M14.5 11 V14.5 H11 M5 14.5 H1.5 V11"
            stroke="currentColor"
            strokeWidth="1"
            fill="none"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </button>
    ) : null,
  );
  useDockItem("capture-share", 41, on && canShareFiles() ? <ShareButton make={shoot} label={captureShareHint} /> : null);
  useDockItem("capture-save", 42, on ? <SaveButton make={shoot} label={captureSaveHint} /> : null);
  useDockItem(
    "capture-close",
    45,
    on ? (
      <button type="button" className={dock.button} aria-label={captureCloseHint} title={captureCloseHint} onClick={() => setOn(false)}>
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
          <path d="M1 1 L13 13 M13 1 L1 13" stroke="currentColor" strokeWidth="1" fill="none" vectorEffect="non-scaling-stroke" />
        </svg>
      </button>
    ) : null,
  );

  if (!on) return null;
  return (
    <div className={styles.layer} style={{ paddingTop: TOP_SPACE, paddingBottom: BOTTOM_SPACE }} aria-hidden="true">
      <div ref={frame} className={styles.frame} style={{ width: size.w, height: size.h }}>
        <p className={styles.guide}>{captureGuide}</p>
      </div>
    </div>
  );
}
