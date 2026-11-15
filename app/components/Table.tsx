"use client";

// One pinned screen for the whole page. Objects land on the pile as you
// scroll, then the view pulls back to a collage, which is where the page ends.

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type Lenis from "lenis";
import { content } from "../content";
import Opening, { type Landed } from "./Opening";
import { Album, LastPhoto, Letter, Polaroid, scatterClass } from "./Objects";
import Title from "./Title";
import styles from "./Table.module.css";

gsap.registerPlugin(ScrollTrigger);

type Spot = { x: number; y: number; rotation: number };

// Collage spots, as fractions of the screen.
function collage(wide: boolean): Record<string, Spot> {
  return wide
    ? {
        envelope: { x: -0.2, y: 0.2, rotation: -6 },
        card: { x: -0.14, y: -0.12, rotation: -4 },
        album: { x: 0.12, y: -0.08, rotation: 3 },
        letter: { x: 0.16, y: 0.1, rotation: -2 },
        last: { x: -0.04, y: 0.13, rotation: 4 },
      }
    : {
        // phone: spread down the tall screen
        envelope: { x: 0.14, y: 0.3, rotation: -5 },
        card: { x: -0.16, y: -0.3, rotation: -4 },
        album: { x: 0.13, y: -0.12, rotation: 3 },
        letter: { x: 0.16, y: -0.1, rotation: 3 },
        last: { x: -0.15, y: 0.14, rotation: -3 },
      };
}

// Collage widths relative to the postcard, roughly true to life.
const WIDTH_VS_CARD = { envelope: 1.1, album: 1.25, letter: 1.2, last: 0.9 };
// These keep one shape on every screen in the collage, only the size changes.
const PRINT_RATIO = 1.6;
const PIECE_SIZE = 0.8;
const LETTER_W = 1280;

// Spread evenly around the pile, however many photos there are.
// Even polaroids sit on top, odd ones tucked underneath.
function scatterSpots(wide: boolean, count: number) {
  return Array.from({ length: count }, (_, i) => {
    const under = i % 2 === 1;
    const a = (i / count) * Math.PI * 2 + 0.35;
    const rx = under ? (wide ? 0.22 : 0.2) : wide ? 0.34 : 0.32;
    const ry = under ? (wide ? 0.2 : 0.22) : wide ? 0.33 : 0.36;
    return { x: 0.5 + Math.cos(a) * rx, y: 0.5 + Math.sin(a) * ry, rotation: (i % 4 < 2 ? 1 : -1) * (5 + (i % 3) * 3) };
  });
}

// Only the album lands tilted. More tilt would show the table behind a full-screen sheet.
const LAND_TILT = { album: 0.2, letter: 0, last: 0 };
// how much each layer shrinks when something lands on top
const SETTLE = 0.02;

const getLenis = () => (window as unknown as { lenis?: Lenis }).lenis;

/** Fade to the bare table, then reload. */
let replaying = false;
function replay() {
  if (replaying) return;
  replaying = true;
  window.dispatchEvent(new Event("letter:leave"));
  const curtain = document.createElement("div");
  curtain.className = styles.curtain;
  document.body.appendChild(curtain);
  gsap.to(curtain, {
    opacity: 1,
    duration: 0.7,
    ease: "power2.inOut",
    onComplete: () => {
      if ("scrollRestoration" in history) history.scrollRestoration = "manual";
      getLenis()?.scrollTo(0, { immediate: true });
      window.scrollTo(0, 0);
      window.location.reload();
    },
  });
}

export default function Table() {
  const root = useRef<HTMLElement>(null);
  const album = useRef<HTMLDivElement>(null);
  const letter = useRef<HTMLDivElement>(null);
  const last = useRef<HTMLDivElement>(null);
  const header = useRef<HTMLDivElement>(null);
  const footer = useRef<HTMLElement>(null);
  const scatter = useRef<HTMLDivElement>(null);
  const scatterUnder = useRef<HTMLDivElement>(null);
  const built = useRef(false);

  const build = ({ card, envelope, openFlap, title }: Landed) => {
    if (built.current || !root.current) return;
    built.current = true;

    const objects = [album.current!, letter.current!, last.current!];
    const albumEl = album.current!;
    const shade = (el: HTMLElement) => el.querySelector<HTMLElement>("[class*='shade']");
    const writing = last.current!.querySelector<HTMLElement>("[data-writing]");
    const letterEl = letter.current!;
    const W = () => window.innerWidth;
    const H = () => window.innerHeight;
    const wide = () => W() / H() > 1;
    // pull the spots in as pieces shrink, so the pile keeps its shape
    const spot = (key: string) => {
      const s = collage(wide())[key];
      return { ...s, x: s.x * PIECE_SIZE, y: s.y * PIECE_SIZE };
    };
    const toward = (f: number) => 0.5 + (f - 0.5) * PIECE_SIZE;
    const inset = () => (wide() ? "24px" : "12px");
    // postcard width in the collage. Small on purpose, to leave room for dragging.
    const collageScale = () => (wide() ? 0.3 : 0.5) * PIECE_SIZE;

    const offY = () => H() * 1.1;
    const ENTRY_TILT = [1, 0, -1.5];
    objects.forEach((obj, i) => gsap.set(obj, { x: 0, y: offY(), rotation: ENTRY_TILT[i], scale: 1 }));
    gsap.set(objects, { visibility: "visible" });
    if (writing) gsap.set(writing, { opacity: 0, yPercent: 60 });

    // the landed card is pinned to the corner
    const cardX = Number(gsap.getProperty(card, "x")) || 0;
    const cardY = Number(gsap.getProperty(card, "y")) || 0;
    const faces = card.querySelectorAll("[class*='face']");

    // Every tween uses fromTo. With only `to`, a refresh mid-scroll records the
    // current (shrunk, darkened) state as the start, and scrolling back breaks.
    let total = 10;
    let collageFrom = 9;
    let pileFrom = 9;
    const pieces: HTMLElement[] = [envelope, card, ...objects];
    const tl = gsap.timeline({
      defaults: { immediateRender: false },
      scrollTrigger: {
        trigger: root.current,
        pin: true,
        start: "top top",
        end: () => `+=${H() * total * 0.6}`,
        scrub: 1.2,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          setCollageActive(self.progress >= collageFrom / total);
          const pile = self.progress >= pileFrom / total;
          if (pile !== !!document.documentElement.dataset.pile) {
            if (pile) document.documentElement.dataset.pile = "true";
            else delete document.documentElement.dataset.pile;
          }
        },
      },
    });

    let collageActive = false;
    const setCollageActive = (on: boolean) => {
      if (on === collageActive) return;
      collageActive = on;
      if (!on) resetOffsets();
      if (on) document.documentElement.dataset.collage = "true";
      else delete document.documentElement.dataset.collage;
      pieces.forEach((p) => {
        if (on) {
          p.dataset.prevCursor = p.dataset.cursor ?? "";
          p.dataset.prevLabel = p.dataset.cursorLabel ?? "";
          p.dataset.cursor = "open";
          p.dataset.cursorLabel = p === envelope ? content.collage.replayHint : content.collage.seeHint;
        } else if (p.dataset.prevCursor !== undefined) {
          if (p.dataset.prevCursor) p.dataset.cursor = p.dataset.prevCursor;
          else delete p.dataset.cursor;
          if (p.dataset.prevLabel) p.dataset.cursorLabel = p.dataset.prevLabel;
          else delete p.dataset.cursorLabel;
          delete p.dataset.prevCursor;
          delete p.dataset.prevLabel;
        }
      });
    };

    // the card title hands over to an identical copy that becomes the header
    const paper = getComputedStyle(document.documentElement).getPropertyValue("--paper").trim();
    const titleBox = () => ({
      fontSize: getComputedStyle(title).fontSize,
      top: `${title.offsetTop}px`,
      left: `${title.offsetLeft}px`,
      right: `${title.offsetLeft}px`,
    });
    tl.fromTo(title, { visibility: "visible" }, { visibility: "hidden", duration: 0.01 }, 0)
      .fromTo(header.current, { visibility: "hidden" }, { visibility: "visible", duration: 0.01 }, 0)
      .fromTo(
        header.current,
        { fontSize: () => titleBox().fontSize, top: () => titleBox().top, left: () => titleBox().left, right: () => titleBox().right },
        // autoRound off: whole-pixel font steps read as a stutter while scrolling
        { fontSize: () => (wide() ? "15px" : "13px"), top: inset, left: inset, right: inset, duration: 0.8, ease: "power2.inOut", autoRound: false },
        0,
      );

    // ENTER to land, HOLD to rest. The first starts right away, no dead scroll.
    const START = 0.2;
    const ENTER = 1.6;
    const HOLD = 0.25;
    const SHADE = 0.06;
    const tilts = [LAND_TILT.album, LAND_TILT.letter, LAND_TILT.last];
    const pile: HTMLElement[] = [card];
    const landedAt = new Map<HTMLElement, number>([
      [card, 0],
      [envelope, 0],
    ]);

    // pieces taller than the screen keep scrolling up after they land
    const travel = (el: HTMLElement) => () => Math.max(0, el.offsetHeight - H());
    // album: stop just before the torn edge, which shows during the hold
    const albumPad = () => parseFloat(getComputedStyle(albumEl.firstElementChild as HTMLElement).paddingBottom) || 0;
    const albumEnd = () => -(travel(albumEl)() + 60);
    const restingY = (el: HTMLElement) => (el === albumEl ? albumEnd() : -travel(el)());
    let cursor = START;
    objects.forEach((obj, i) => {
      const at = cursor;
      tl.fromTo(obj, { y: offY, rotation: ENTRY_TILT[i] }, { y: 0, rotation: tilts[i], duration: ENTER, ease: "power1.inOut" }, at);
      cursor = at + ENTER;
      landedAt.set(obj, cursor);
      const read = (ENTER * travel(obj)()) / H();
      if (obj === albumEl && read > 0) {
        const readTo = () => -Math.max(0, travel(albumEl)() - albumPad());
        tl.fromTo(obj, { y: 0 }, { y: readTo, duration: read, ease: "none" }, cursor);
        cursor += read;
        tl.fromTo(obj, { y: readTo }, { y: albumEnd, duration: HOLD * 2, ease: "power1.inOut" }, cursor);
        cursor += HOLD * 2;
      } else {
        if (read > 0) {
          tl.fromTo(obj, { y: 0 }, { y: () => -travel(obj)(), duration: read, ease: "none" }, cursor);
          cursor += read;
        }
        cursor += HOLD;
      }
      pile.forEach((under, k) => {
        const before = 1 - SETTLE * (pile.length - 1 - k);
        tl.fromTo(under, { scale: before }, { scale: before - SETTLE, duration: ENTER, ease: "power1.inOut" }, at);
      });
      const covered = pile[pile.length - 1];
      if (covered === card) {
        tl.fromTo(faces, { filter: "brightness(1)" }, { filter: "brightness(0.95)", duration: ENTER, ease: "none" }, at);
      } else {
        const s = shade(covered);
        if (s) tl.fromTo(s, { opacity: 0 }, { opacity: SHADE, duration: ENTER, ease: "none" }, at);
      }
      pile.push(obj);
    });

    // hide the postcard under the album, so the torn edge shows the table, not the card
    tl.fromTo(card, { visibility: "visible" }, { visibility: "hidden", duration: 0.01 }, landedAt.get(albumEl)!);

    const lastLanded = landedAt.get(last.current!)!;
    if (writing) {
      tl.fromTo(writing, { opacity: 0, yPercent: 60 }, { opacity: 1, yPercent: 0, duration: 0.8, ease: "power3.out" }, lastLanded - 0.1);
    }

    const C = lastLanded + 0.9;
    const sc = collageScale;
    const COLLAGE = 1.4;
    collageFrom = C + COLLAGE * 0.85;
    pileFrom = C - 0.02;
    const settled = (k: number) => 1 - SETTLE * (pile.length - 1 - k);
    const cardW = () => W() * sc();
    const cardH = () => W() / PRINT_RATIO;
    const envScale = () => (cardW() * WIDTH_VS_CARD.envelope) / envelope.offsetWidth;
    tl.fromTo([envelope, openFlap], { visibility: "hidden" }, { visibility: "visible", duration: 0.01 }, C - 0.01)
      .fromTo(card, { visibility: "hidden" }, { visibility: "visible", duration: 0.01 }, C - 0.01)
      .fromTo(
        envelope,
        { x: 0, y: () => H() * 1.1, rotation: 0, scale: envScale, transformOrigin: "50% 50%" },
        // scale on both ends so it doesn't drift
        { x: () => spot("envelope").x * W(), y: () => spot("envelope").y * H(), rotation: () => spot("envelope").rotation, scale: envScale, duration: COLLAGE, ease: "power3.inOut" },
        C,
      )
      .fromTo(
        card,
        { x: cardX, y: cardY, rotation: 0, scale: settled(0) },
        {
          x: () => spot("card").x * W(),
          y: () => spot("card").y * H(),
          rotation: () => spot("card").rotation,
          scale: () => sc(),
          duration: COLLAGE,
          ease: "power3.inOut",
        },
        C,
      )
      .fromTo(card, { height: () => H() }, { height: cardH, duration: 0.01 }, C - 0.02)
      .fromTo(faces, { filter: "brightness(0.95)" }, { filter: "brightness(1)", duration: COLLAGE, ease: "none" }, C)
      // blend-mode over blue turns mustard, so stop inverting once the table shows
      .fromTo(header.current, { color: "#fff" }, { color: paper, duration: 0.8, ease: "none" }, C + 0.2)
      .fromTo(header.current, { mixBlendMode: "difference" }, { mixBlendMode: "normal", duration: 0.01 }, C + 0.5)
      .fromTo(footer.current, { visibility: "hidden", opacity: 0, y: 12 }, { visibility: "visible", opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }, C + COLLAGE * 0.7);
    (["album", "letter", "last"] as const).forEach((key, i) => {
      const el = objects[i];
      const pileW = () => (key === "letter" ? LETTER_W : W());
      tl.fromTo(
        el,
        { x: 0, y: () => restingY(el), xPercent: 0, yPercent: 0, rotation: tilts[i], scale: settled(i + 1) },
        {
          // yPercent resolves against the piece's own height, so any height stays centred
          x: () => spot(key).x * W() + W() / 2,
          y: () => spot(key).y * H() + H() / 2,
          xPercent: -50,
          yPercent: -50,
          rotation: () => spot(key).rotation,
          scale: () => (cardW() * WIDTH_VS_CARD[key]) / pileW(),
          duration: COLLAGE,
          ease: "power3.inOut",
        },
        C,
      );
      // last photo crops to a landscape print as the view pulls back
      if (key === "last") {
        tl.fromTo(el, { height: () => H() }, { height: () => W() / PRINT_RATIO, duration: COLLAGE, ease: "power3.inOut" }, C);
      }
      const s = shade(objects[i]);
      const darkened = i < objects.length - 1 ? SHADE : 0;
      if (s && darkened) tl.fromTo(s, { opacity: darkened }, { opacity: 0, duration: COLLAGE, ease: "none" }, C);
    });
    // Polaroids leave the album: loose copies take their exact spots while the
    // album ones hide at the same moment.
    const grid = albumEl.querySelector<HTMLElement>("[class*='albumGrid']")!;
    const inAlbum = Array.from(grid.children) as HTMLElement[];
    // flowers share this layer
    const loose = [scatter.current!, scatterUnder.current!]
      .flatMap((layer) => Array.from(layer.querySelectorAll<HTMLElement>(":scope > figure")))
      .sort((a, b) => Number(a.dataset.i) - Number(b.dataset.i));
    loose.forEach((el) => {
      pieces.push(el);
      landedAt.set(el, landedAt.get(albumEl)!);
    });
    // a bit bigger than true scale so the photos still read
    const looseW = () => cardW() * (wide() ? 0.3 : 0.36);
    tl.fromTo(letterEl, { "--edge": "var(--deckle-flat)" }, { "--edge": "var(--deckle)", duration: 0.01 }, C - 0.02);
    // Hide the whole album, never its grid alone, or the polaroids stay hidden in their own section.
    tl.fromTo(albumEl, { visibility: "visible" }, { visibility: "hidden", duration: 0.01 }, C)
      .fromTo(loose, { visibility: "hidden" }, { visibility: "visible", duration: 0.01 }, C);
    loose.forEach((el, i) => {
      const fig = inAlbum[i];
      const target = () => {
        const t = scatterSpots(wide(), loose.length)[i];
        return { ...t, x: toward(t.x), y: toward(t.y) };
      };
      tl.fromTo(
        el,
        // enter from below like everything else; the album is buried by now
        {
          width: () => fig.offsetWidth,
          x: () => target().x * W() - looseW() / 2,
          y: () => H() * 1.15,
          scale: () => looseW() / fig.offsetWidth,
          rotation: () => target().rotation - 20,
        },
        {
          // Width at both ends too, or scrolling back leaves the polaroid 0px wide.
          width: () => fig.offsetWidth,
          x: () => target().x * W() - looseW() / 2,
          y: () => target().y * H() - looseW() / 0.82 / 2,
          scale: () => looseW() / fig.offsetWidth,
          rotation: () => target().rotation,
          duration: COLLAGE * 0.8,
          ease: "power3.out",
        },
        C + 0.1 + i * 0.03,
      );
    });

    const flowerEls = Array.from(scatter.current!.querySelectorAll<HTMLImageElement>("[data-flower]"));
    flowerEls.forEach((el, i) => {
      const f = content.collage.flowers[i];
      const w = () => W() * f.size * (wide() ? 1 : 1.8) * PIECE_SIZE;
      tl.fromTo(
        el,
        { visibility: "hidden", width: w, x: () => toward(f.x) * W() - w() / 2, y: () => H() * 1.1, rotation: f.rotation - 30 },
        { visibility: "visible", width: w, x: () => toward(f.x) * W() - w() / 2, y: () => toward(f.y) * H() - w() / 2, rotation: f.rotation, duration: COLLAGE * 0.5, ease: "power3.out" },
        C + COLLAGE * 0.35 + i * 0.08,
      );
    });

    // a short still moment before the page ends
    tl.to({}, { duration: 1 }, C + COLLAGE);

    total = tl.duration();
    ScrollTrigger.refresh();
    // the pin made the page taller
    getLenis()?.resize();

    // Collage play: drag (neighbours get nudged), hover drift, click to go back.
    // All in CSS `translate`, so it never fights the scroll timeline's transform.
    const flowers = Array.from(scatter.current!.querySelectorAll<HTMLElement>("[data-flower]"));
    const draggables = () => [...pieces, ...flowers].filter((el) => getComputedStyle(el).visibility === "visible");
    const offset = new Map<HTMLElement, { dx: number; dy: number; hx: number; hy: number }>();
    const off = (el: HTMLElement) => {
      let o = offset.get(el);
      if (!o) offset.set(el, (o = { dx: 0, dy: 0, hx: 0, hy: 0 }));
      return o;
    };
    const apply = (el: HTMLElement) => {
      const o = off(el);
      el.style.translate = `${(o.dx + o.hx).toFixed(1)}px ${(o.dy + o.hy).toFixed(1)}px`;
    };
    const SMOOTH = "translate 0.9s cubic-bezier(0.22, 1, 0.36, 1)";
    [...pieces, ...flowers].forEach((el) => (el.style.transition = SMOOTH));
    function resetOffsets() {
      offset.clear();
      [...pieces, ...flowers].forEach((el) => (el.style.translate = ""));
    }
    const centre = (el: HTMLElement) => {
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2, r };
    };

    const DRIFT = 12;
    let dragging: HTMLElement | null = null;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (fine) {
      window.addEventListener("pointermove", (e) => {
        if (!collageActive || dragging) return;
        const hit = document.elementFromPoint(e.clientX, e.clientY);
        const hovered = hit ? pieces.find((el) => el.contains(hit)) : undefined;
        pieces.forEach((el) => {
          const o = off(el);
          if (el === hovered) {
            const c = centre(el);
            o.hx = Math.max(-1, Math.min(1, (e.clientX - c.x) / (c.r.width / 2))) * DRIFT;
            o.hy = Math.max(-1, Math.min(1, (e.clientY - c.y) / (c.r.height / 2))) * DRIFT;
          } else {
            o.hx = 0;
            o.hy = 0;
          }
          apply(el);
        });
      });
    }

    // neighbours move by a share of the drag, less the further away
    const NUDGE = 0.12;
    const REACH = 320;
    let prev = { x: 0, y: 0 };
    let start = { x: 0, y: 0 };
    let moved = false;
    let suppressClick = false;
    root.current.addEventListener("pointerdown", (e) => {
      if (!collageActive || e.button !== 0) return;
      const hit = e.target as Node;
      const held = draggables().find((el) => el.contains(hit));
      if (!held) return;
      e.preventDefault();
      dragging = held;
      moved = false;
      start = prev = { x: e.clientX, y: e.clientY };
      held.style.transition = "none";
      const o = off(held);
      o.hx = 0;
      o.hy = 0;
      held.style.cursor = "grabbing";
    });
    window.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const stepX = e.clientX - prev.x;
      const stepY = e.clientY - prev.y;
      prev = { x: e.clientX, y: e.clientY };
      if (!moved && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 5) moved = true;
      if (!moved) return;
      const o = off(dragging);
      o.dx += stepX;
      o.dy += stepY;
      apply(dragging);
      const c = centre(dragging);
      draggables().forEach((other) => {
        if (other === dragging) return;
        const oc = centre(other);
        const share = NUDGE * Math.exp(-Math.hypot(oc.x - c.x, oc.y - c.y) / REACH);
        const oo = off(other);
        oo.dx += stepX * share;
        oo.dy += stepY * share;
        apply(other);
      });
    });
    const drop = () => {
      if (!dragging) return;
      dragging.style.transition = SMOOTH;
      dragging.style.cursor = "";
      if (moved) suppressClick = true;
      dragging = null;
    };
    window.addEventListener("pointerup", drop);
    window.addEventListener("pointercancel", drop);

    // capture phase, so it wins over the postcard's own flip
    const st = tl.scrollTrigger!;
    root.current.addEventListener(
      "click",
      (e) => {
        if (!collageActive) return;
        const hit = pieces.find((p) => p.contains(e.target as Node));
        if (!hit && !flowers.some((f) => f.contains(e.target as Node))) return;
        e.preventDefault();
        e.stopPropagation();
        if (suppressClick || !hit || document.documentElement.dataset.capture) {
          suppressClick = false;
          return;
        }
        if (hit === envelope) return replay();
        const t = landedAt.get(hit) ?? 0;
        const y = st.start + (t / total) * (st.end - st.start);
        getLenis()?.scrollTo(y, { duration: 2.2 });
        if (!getLenis()) window.scrollTo({ top: y, behavior: "smooth" });
      },
      true,
    );
  };

  const { envelope: env, header: place, colophon } = content;

  return (
    <section className={styles.root} ref={root}>
      <div className={styles.scatterUnder} ref={scatterUnder}>
        {content.gallery.items.map((p, i) =>
          i % 2 === 1 ? <Polaroid key={p.src + i} photo={p} index={i} className={scatterClass} /> : null,
        )}
      </div>
      <Opening onLanded={build} />
      <Album ref={album} />
      <Letter ref={letter} />
      <LastPhoto ref={last} />
      <div className={styles.scatter} ref={scatter}>
        {content.gallery.items.map((p, i) =>
          i % 2 === 0 ? <Polaroid key={p.src + i} photo={p} index={i} className={scatterClass} /> : null,
        )}
        {content.collage.flowers.map((f) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={f.src}
            className={styles.flower}
            src={f.src}
            alt=""
            aria-hidden="true"
            draggable={false}
            data-flower
            data-cursor="open"
            data-cursor-label={content.collage.dragHint}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        ))}
      </div>
      <Title ref={header} variant="header" onClick={replay} />
      <footer className={styles.footer} ref={footer}>
        <span>
          From {env.from}, {place.place.split(",")[0]}
        </span>
        <a href={`mailto:${colophon.contact}`} data-cursor="open" data-cursor-label={colophon.contactHint}>
          {colophon.credit}
        </a>
      </footer>
    </section>
  );
}
