"use client";

// Album, letter and last postcard. Plain markup, Table.tsx animates them.

import { forwardRef, useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { content } from "../content";
import { openPhoto } from "../lib/lightbox";
import { useStickers } from "../lib/stickers";
import { approve, readApproval, useApproval } from "../lib/approve";
import { useDockItem } from "../lib/dock";
import { holdScroll } from "../lib/scroll";
import { track } from "../lib/track";
import { canShareFiles } from "../lib/share";
import { SaveButton, ShareButton } from "./FileButtons";
import { drawStamp, renderPostcard } from "../lib/postcardImage";
import dock from "./Dock.module.css";
import styles from "./Objects.module.css";

const TILTS = [-1, 0.8, -0.6, 1, 0.7, -0.9, 1, -0.7, 0.6, -1, 0.9, -0.5];

// frame image + photo window in %. Without the frame the paper polaroid still works.
const FRAMES = [{ src: "/frames/polaroid.webp", hole: { left: 6.64, top: 6.19, width: 87.5, height: 73.23 } }];

// Album polaroids only. The loose collage copies also pass under the cursor
// while the view pulls back, before data-collage is set, and kept a 3D tilt.
const inAlbum = (el: HTMLElement) => !!el.closest("[class*='albumGrid']");

function tiltToward(e: React.PointerEvent<HTMLElement>) {
  const el = e.currentTarget;
  if (e.pointerType !== "mouse" || document.documentElement.dataset.collage || !inAlbum(el)) return;
  const r = el.getBoundingClientRect();
  const nx = (e.clientX - r.left) / r.width - 0.5;
  const ny = (e.clientY - r.top) / r.height - 0.5;
  gsap.to(el, { rotationY: nx * 14, rotationX: -ny * 14, transformPerspective: 700, duration: 0.5, ease: "power3.out", overwrite: "auto" });
}

// drop the 3D transform when flat so the photo is sharp again
function settle(e: React.PointerEvent<HTMLElement>) {
  const el = e.currentTarget;
  if (!inAlbum(el)) return;
  gsap.to(el, { rotationY: 0, rotationX: 0, duration: 0.6, ease: "power3.out", overwrite: "auto", clearProps: "transform" });
}

function tornEdge(seed: number, flip: boolean) {
  let y = 0;
  let d = "";
  let r = seed;
  const rand = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
  for (let x = 0; x <= 1000; x += 6 + rand() * 10) {
    y = Math.max(2, Math.min(22, y + (rand() - 0.5) * 9 || 12));
    d += `${d ? " L" : "M"}${x.toFixed(1)} ${(flip ? 24 - y : y).toFixed(1)}`;
  }
  d += flip ? " L1000 0 L0 0 Z" : " L1000 24 L0 24 Z";
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1000 24' preserveAspectRatio='none'><path d='${d}' fill='black'/></svg>`;
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
}

const TORN_TOP = tornEdge(7, false);
const TORN_BOTTOM = tornEdge(13, true);
const TORN_MASK = {
  WebkitMaskImage: `${TORN_TOP}, linear-gradient(#000, #000), ${TORN_BOTTOM}`,
  maskImage: `${TORN_TOP}, linear-gradient(#000, #000), ${TORN_BOTTOM}`,
} as const;

type Photo = (typeof content.gallery.items)[number];

type PolaroidProps = {
  photo: Photo;
  index: number;
  className?: string;
  style?: React.CSSProperties;
  /** for the lightbox copy */
  still?: boolean;
} & React.HTMLAttributes<HTMLElement>;

export function Polaroid({ photo, index, className, style, still, ...rest }: PolaroidProps) {
  const frame = FRAMES[index % FRAMES.length];
  const { left, top, width, height } = frame.hole;
  return (
    <figure
      {...rest}
      className={className ? `${styles.polaroid} ${className}` : styles.polaroid}
      data-i={index}
      style={{ rotate: `${TILTS[index % TILTS.length]}deg`, ...style }}
      onPointerMove={still ? undefined : tiltToward}
      onPointerLeave={still ? undefined : settle}
    >
      <div className={styles.window} style={{ left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={styles.photo} src={photo.src} alt={photo.alt} loading="lazy" />
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className={styles.frame}
        src={frame.src}
        alt=""
        aria-hidden="true"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = "none";
        }}
      />
      {photo.caption ? (
        <figcaption className={styles.caption} style={{ top: `${top + height}%` }}>
          {photo.caption}
        </figcaption>
      ) : null}
      <Stickers photo={photo.src} />
    </figure>
  );
}

function Stickers({ photo }: { photo: string }) {
  const stickers = useStickers(photo);
  if (!stickers.length) return null;
  return (
    <div className={styles.stickers} aria-hidden="true">
      {stickers.map((s, i) => (
        <span key={i} className={styles.sticker} data-sticker={i} style={{ left: `${s.x}%`, top: `${s.y}%`, rotate: `${s.r}deg` }}>
          {s.e}
        </span>
      ))}
    </div>
  );
}

/** loose copies for the collage */
export const scatterClass = styles.scattered;

export const Album = forwardRef<HTMLDivElement>(function Album(_, ref) {
  const photos = content.gallery.items;
  return (
    <div ref={ref} className={`${styles.object} ${styles.album}`}>
      {/* shadow sits outside the mask, so it follows the torn edge */}
      <div className={styles.albumSheet} style={TORN_MASK}>
        <div className={styles.albumGrid}>
          {photos.map((p, i) => (
            <Polaroid
              key={p.src + i}
              photo={p}
              index={i}
              data-cursor="open"
              data-cursor-label={content.gallery.viewHint}
              role="button"
              tabIndex={0}
              onClick={(e) => openPhoto(i, e.currentTarget)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openPhoto(i, e.currentTarget);
                }
              }}
            />
          ))}
        </div>
        <span className={styles.shade} />
      </div>
    </div>
  );
});

// slightly uneven sheet edge (clip-path). sides=false keeps left/right straight.
function deckle(seed: number, sides = true, wobble = 3) {
  let r = seed;
  const rand = () => (r = (r * 9301 + 49297) % 233280) / 233280;
  const off = () => (rand() * wobble).toFixed(1);
  const side = () => (sides ? off() : (rand(), "0"));
  const pts: string[] = [];
  for (let p = 0; p <= 100; p += 1.5) pts.push(`${p}% ${off()}px`);
  for (let p = 0; p <= 100; p += 1.5) pts.push(`calc(100% - ${side()}px) ${p}%`);
  for (let p = 100; p >= 0; p -= 1.5) pts.push(`${p}% calc(100% - ${off()}px)`);
  for (let p = 100; p >= 0; p -= 1.5) pts.push(`${side()}px ${p}%`);
  return `polygon(${pts.join(", ")})`;
}

// straight sides while it fills the screen; Table.tsx switches for the collage
const LETTER_EDGE = { "--deckle-flat": deckle(21, false), "--deckle": deckle(21) } as React.CSSProperties;

export const Letter = forwardRef<HTMLDivElement>(function Letter(_, ref) {
  const { salutation, paragraphs, signoff } = content.loveLetter;
  return (
    <div ref={ref} className={`${styles.object} ${styles.letter}`} style={LETTER_EDGE} data-cursor-plain>
      <div className={styles.letterBody}>
        <p className={styles.salutation}>{salutation}</p>
        {paragraphs.map((p, i) => (
          <p key={i} className={styles.paragraph}>
            {p}
          </p>
        ))}
        <p className={styles.signoff}>{signoff}</p>
      </div>
      <span className={styles.shade} />
    </div>
  );
});

/**
 * Last postcard. Click the address to stamp, anywhere else to flip (after stamping).
 * With no invitation in content it is just the photo: no stamp, no flip.
 */
export const LastPhoto = forwardRef<HTMLDivElement>(function LastPhoto(_, ref) {
  const { src, alt, caption, ask, stampHint, stampLabel, answerHint } = content.lastPhoto;
  const asking = ask.trim() !== "";
  const [turned, setTurned] = useState(false);
  const [collage, setCollage] = useState(false);
  const approval = useApproval();
  const stampEl = useRef<HTMLCanvasElement>(null);
  const slam = useRef(false);
  const flipper = useRef<HTMLDivElement>(null);
  const flipping = useRef(false);

  useEffect(() => {
    const html = document.documentElement;
    const update = () => setCollage(!!html.dataset.collage);
    update();
    const mo = new MutationObserver(update);
    mo.observe(html, { attributes: true, attributeFilter: ["data-collage"] });
    return () => mo.disconnect();
  }, []);

  const [here, setHere] = useState(false);
  const self = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    // per frame, not on scroll: the table keeps easing after scrolling stops
    const check = () => {
      const el = self.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setHere(!document.documentElement.dataset.pile && r.top <= 4 && r.bottom >= window.innerHeight - 4 && getComputedStyle(el).visibility === "visible");
    };
    gsap.ticker.add(check);
    return () => gsap.ticker.remove(check);
  }, []);

  useEffect(() => {
    const canvas = stampEl.current;
    if (!approval || !canvas) return;
    const draw = () => {
      const dpr = Math.min((window.devicePixelRatio || 1) * 2, 4);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (!w) return;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      const ctx = canvas.getContext("2d")!;
      const css = getComputedStyle(document.documentElement);
      ctx.scale(dpr, dpr);
      ctx.translate(w / 2, h / 2);
      // canvas is bigger than the box so a tilted stamp isn't clipped
      drawStamp(ctx, approval, w * STAMP_OF_CANVAS, content.theme.ink, css.getPropertyValue("--font-serif"), css.getPropertyValue("--font-sans"));
    };
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(canvas);
    if (slam.current) {
      slam.current = false;
      gsap.fromTo(canvas, { scale: 1.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.32, ease: "power4.in" });
      gsap.fromTo(canvas.closest(`.${styles.lastAsk}`), { scale: 0.985 }, { scale: 1, duration: 0.5, delay: 0.3, ease: "elastic.out(1, 0.4)" });
    }
    return () => ro.disconnect();
  }, [approval]);

  useEffect(() => {
    if (!turned) return;
    holdScroll(true);
    return () => holdScroll(false);
  }, [turned]);

  // flips like the first postcard. Scroll unlocks only once it lands back.
  const turn = () => {
    const card = flipper.current;
    if (!asking || collage || !approval || !card || flipping.current) return;
    flipping.current = true;
    const toPhoto = !turned;
    if (toPhoto) setTurned(true);
    gsap
      .timeline({
        onComplete: () => {
          flipping.current = false;
          if (!toPhoto) setTurned(false);
        },
      })
      .to(card, { scale: 0.82, duration: 0.4, ease: "power2.inOut" })
      .to(card, { rotationY: toPhoto ? 180 : 0, duration: 0.75, ease: "power3.inOut" })
      .to(card, { scale: 1, duration: 0.45, ease: "power2.inOut" });
  };
  const stamp = (e: React.MouseEvent) => {
    if (turned || collage || flipping.current) return;
    e.stopPropagation();
    if (approval) return;
    slam.current = true;
    approve();
    track("invitation_approved");
  };

  // in the collage the dock belongs to Capture
  const writingUp = asking && here && !turned && !collage;
  const { whatsapp, email } = content.lastPhoto.replyTo;
  useDockItem("postcard-whatsapp", 28, writingUp && approval && whatsapp ? <ReplyButton via="whatsapp" /> : null);
  useDockItem("postcard-email", 29, writingUp && approval && email ? <ReplyButton via="email" /> : null);
  const { shareHint, saveHint, shareText } = content.lastPhoto;
  useDockItem(
    "postcard-share",
    30,
    writingUp && approval && canShareFiles() ? <ShareButton make={postcardFile} label={shareHint} text={shareText} what="postcard" /> : null,
  );
  useDockItem("postcard-save", 31, writingUp ? <SaveButton make={postcardFile} label={saveHint} what="postcard" /> : null);

  return (
    <div
      ref={(el) => {
        self.current = el;
        if (typeof ref === "function") ref(el);
        else if (ref) ref.current = el;
      }}
      className={`${styles.object} ${styles.lastPhoto}`}
      data-side={turned || !asking ? "photo" : "writing"}
      data-only-photo={asking ? undefined : true}
      data-cursor={asking && approval ? "open" : undefined}
      data-cursor-label={content.postcard.flipHint}
      onClick={turn}
    >
      <div className={styles.flipper} ref={flipper}>
        {asking ? (
          <div className={`${styles.face} ${styles.lastAsk}`} aria-hidden={turned} data-postcard>
            <div className={styles.backGrid}>
              <div className={styles.backNote}>
                <p className={styles.backDate}>
                  {content.destination.city}, {content.destination.country}
                </p>
                <p className={styles.ask}>{ask}</p>
              </div>
              <div className={styles.backDivider} />
              <div className={styles.backAddress}>
                <div className={styles.backHead}>
                  <span>{content.postcard.cardLabel}</span>
                  <span className={styles.stampBox}>{content.postcard.boxLabel}</span>
                </div>
                <button
                  type="button"
                  className={styles.answer}
                  data-cursor={approval ? undefined : "open"}
                  data-cursor-label={stampHint}
                  aria-label={approval ? stampLabel : answerHint}
                  tabIndex={turned ? -1 : 0}
                  onClick={stamp}
                >
                  <span className={styles.backRules}>
                    {[content.envelope.from, "", "", ""].map((name, i) => (
                      <span key={i} className={styles.backRule}>
                        <i className={styles.backRuleLine} />
                        {name ? <span className={styles.backName}>{name}</span> : null}
                      </span>
                    ))}
                  </span>
                  {approval ? <canvas ref={stampEl} className={styles.approved} /> : <span className={styles.answerHint}>{answerHint}</span>}
                </button>
              </div>
            </div>
          </div>
        ) : null}
        <div className={`${styles.face} ${styles.lastFront}`} aria-hidden={asking && !turned}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={alt} loading="lazy" />
          <p className={styles.handwriting} data-writing>
            {caption}
          </p>
        </div>
      </div>
      {/* the card can't be a button (the stamp button sits inside it), so keyboard users flip with this */}
      {asking && approval && !collage ? (
        <button
          type="button"
          className={styles.turnKey}
          aria-label={turned ? content.postcard.turnLabel : content.postcard.turnBackLabel}
          onClick={(e) => {
            e.stopPropagation();
            turn();
          }}
        />
      ) : null}
      <span className={styles.shade} />
    </div>
  );
});

// canvas is 1.5x the box
const STAMP_OF_CANVAS = 0.6;

async function postcardFile() {
  const blob = await renderPostcard(readApproval());
  return new File([blob], content.lastPhoto.fileName, { type: "image/png" });
}

// Links carry text only. The image goes by Save or Share.
function ReplyButton({ via }: { via: "whatsapp" | "email" }) {
  const { replyTo, replyText, replySubject, whatsappHint, emailHint } = content.lastPhoto;
  const label = via === "whatsapp" ? whatsappHint : emailHint;
  const href =
    via === "whatsapp"
      ? `https://wa.me/${replyTo.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(replyText)}`
      : `mailto:${replyTo.email}?subject=${encodeURIComponent(replySubject)}&body=${encodeURIComponent(replyText)}`;
  return (
    <a className={dock.button} href={href} target="_blank" rel="noreferrer" aria-label={label} title={label} onClick={() => track("reply_click", { via })}>
      {via === "whatsapp" ? (
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <path
            d="M8 1.5 A6.5 6.5 0 1 1 4.2 13.3 L1.5 14.5 L2.6 11.9 A6.5 6.5 0 0 1 8 1.5 Z"
            stroke="currentColor"
            strokeWidth="1"
            fill="none"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M1.5 3.5 H14.5 V12.5 H1.5 Z M1.5 3.5 L8 9 L14.5 3.5" stroke="currentColor" strokeWidth="1" fill="none" vectorEffect="non-scaling-stroke" />
        </svg>
      )}
    </a>
  );
}

