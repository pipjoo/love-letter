"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type Lenis from "lenis";
import { content } from "../content";
import { holdScroll } from "../lib/scroll";
import { track } from "../lib/track";
import { useStampZoom } from "../lib/stampZoom";
import Stamp from "./Stamp";
import Postmark from "./Postmark";
import { POSTMARK_W, STAMP_GAP, STAMP_LOOKS, STAMP_RIGHT, postmarkLeft as placePostmark, stampCount } from "../lib/shapes";
import Title from "./Title";
import styles from "./Opening.module.css";

gsap.registerPlugin(ScrollTrigger);

/** Page width minus the scrollbar. */
function measurePage() {
  document.documentElement.style.setProperty("--page-w", `${document.documentElement.clientWidth}px`);
}

function unlockScroll() {
  delete document.documentElement.dataset.locked;
  holdScroll(false);
  measurePage();
  (window as unknown as { lenis?: Lenis }).lenis?.start();
  ScrollTrigger.refresh();
}

export type Landed = { card: HTMLDivElement; envelope: HTMLButtonElement; openFlap: HTMLDivElement; title: HTMLDivElement };

export default function Opening({ onLanded }: { onLanded?: (els: Landed) => void }) {
  const { envelope, postcard, header, gallery, theme } = content;

  const root = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const front = useRef<HTMLButtonElement>(null);
  const flap = useRef<HTMLDivElement>(null);
  const peekLetter = useRef<HTMLDivElement>(null);
  const peekPhoto = useRef<HTMLDivElement>(null);
  const hint = useRef<HTMLParagraphElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const cardInner = useRef<HTMLDivElement>(null);
  const postmark = useRef<SVGSVGElement>(null);
  const openFlap = useRef<HTMLDivElement>(null);
  const paperFill = useRef<HTMLSpanElement>(null);
  const cardTitle = useRef<HTMLDivElement>(null);
  const frontCaption = useRef<HTMLParagraphElement>(null);
  const stampsRef = useRef<HTMLDivElement>(null);

  const [startStamps, setStartStamps] = useState(false);
  const [instant, setInstant] = useState(false);
  const [ready, setReady] = useState(false);
  const [landed, setLanded] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const opened = useRef(false);
  const drawn = useRef({ timeline: false, stamps: 0 });

  const count = stampCount(gallery.items.length);
  const stampPhotos = envelope.stamp.photos;
  const stamps = STAMP_LOOKS.slice(0, count).map((look, i) => ({
    ...look,
    ...stampPhotos[i % stampPhotos.length],
  }));

  // ring under the left stamp, wavy lines under the rest, so the printing stays readable
  const postmarkLeft = placePostmark(stamps);

  // content date if set, otherwise today in the letter's time zone
  const stampDate = useMemo(() => {
    const fixed: string = envelope.stamp.date;
    const now = fixed ? new Date(`${fixed}T12:00:00Z`) : new Date();
    const part = (opts: Intl.DateTimeFormatOptions) =>
      new Intl.DateTimeFormat(header.locale, { ...opts, timeZone: header.timeZone }).format(now);
    return { month: part({ month: "short" }), day: part({ day: "numeric" }), year: part({ year: "numeric" }) };
  }, [envelope.stamp.date, header.locale, header.timeZone]);

  const checkReady = () => {
    if (drawn.current.timeline && drawn.current.stamps >= count) setReady(true);
  };

  useEffect(() => {
    // hold input instead of overflow:hidden, so the page width doesn't change
    document.documentElement.dataset.locked = "true";
    holdScroll(true);
    window.scrollTo(0, 0);
    return () => unlockScroll();
  }, []);

  const tuckPostcard = () => {
    if (!stage.current || !card.current) return;
    const s = stage.current.offsetWidth;
    const h = stage.current.offsetHeight;
    // card is screen-sized, shrink it to fit the envelope both ways
    const fit = Math.min((s * 0.86) / card.current.offsetWidth, (h * 0.86) / card.current.offsetHeight);
    gsap.set(card.current, {
      xPercent: -50,
      yPercent: -50,
      scale: fit,
      y: h * 0.03,
      rotation: 0,
      zIndex: 2,
      visibility: "visible",
    });
  };

  // intro: outline, paper, writing, stamps, postmark
  useEffect(() => {
    let alive = true;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = gsap.context(() => {
      tuckPostcard();
      const lines = postmark.current?.querySelectorAll(".pm-line") ?? [];
      const markText = postmark.current?.querySelectorAll("text") ?? [];
      const fromText = root.current!.querySelectorAll(`.${styles.from} [data-rise]`);
      const toText = root.current!.querySelectorAll(`.${styles.address} [data-rise]`);
      // soft shadow only, a hard edge reads as a second outline
      const shadow = "0 10px 22px -14px rgb(0 0 0 / 0.22)";

      if (reduce) {
        setInstant(true);
        setStartStamps(true);
        gsap.set(front.current, { boxShadow: shadow });
        gsap.set(paperFill.current, { opacity: 1 });
        gsap.set([`.${styles.edge}`, ...lines], { strokeDashoffset: 0 });
        gsap.set(markText, { opacity: 1 });
        stage.current!.dataset.drawn = "true";
        drawn.current.timeline = true;
        return;
      }

      gsap.set([...fromText, ...toText, hint.current], { opacity: 0, yPercent: 60 });
      gsap.set(markText, { opacity: 0, y: 6 });

      const intro = gsap
        .timeline({
          paused: true,
          onComplete: () => {
            drawn.current.timeline = true;
            checkReady();
          },
        })
        .to(`.${styles.edge}`, { strokeDashoffset: 0, autoRound: false, duration: 1.8, ease: "power2.inOut" }, 0)
        .to(paperFill.current, { opacity: 1, duration: 0.9, ease: "power1.out" }, 1.7)
        .call(() => stage.current?.setAttribute("data-drawn", "true"), [], 2.6)
        .call(() => setStartStamps(true), [], 0.3)
        .to(fromText, { opacity: 1, yPercent: 0, duration: 0.7, stagger: 0.08, ease: "power3.out" }, 2.1)
        .to(toText, { opacity: 1, yPercent: 0, duration: 0.7, stagger: 0.08, ease: "power3.out" }, 2.35)
        .to(lines, { strokeDashoffset: 0, autoRound: false, duration: 0.6, stagger: 0.07, ease: "power2.out" }, 2.6)
        .to(markText, { opacity: 1, y: 0, duration: 0.6, stagger: 0.06, ease: "power3.out" }, 3)
        // no shadow until drawn, so the first frame is empty
        .fromTo(front.current, { boxShadow: "0 0 0 0 rgb(0 0 0 / 0)" }, { boxShadow: shadow, duration: 0.9 }, 1.7)
        .to(hint.current, { opacity: 1, yPercent: 0, duration: 0.6, ease: "power3.out" }, 3.2);

      // wait for fonts and a paint, or the drawing happens before anyone sees it
      document.fonts.ready.then(() => requestAnimationFrame(() => alive && intro.play()));
    }, root);

    measurePage();
    const onResize = () => {
      measurePage();
      if (!opened.current) tuckPostcard();
    };
    window.addEventListener("resize", onResize);
    return () => {
      alive = false;
      window.removeEventListener("resize", onResize);
      ctx.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // mouse: the envelope tilts toward the cursor
  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduce || !stage.current) return;
    gsap.set(stage.current, { transformPerspective: 1000 });
    const move = (e: PointerEvent) => {
      if (opened.current || document.documentElement.dataset.stampZoom) return;
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      gsap.to(stage.current, { rotationY: nx * 4, rotationX: -ny * 4, x: nx * 6, y: ny * 6, duration: 0.9, ease: "power3.out", overwrite: "auto" });
    };
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, []);

  useStampZoom({ root, stage, front, stamps: stampsRef, ready, opened });

  const onStampDrawn = () => {
    drawn.current.stamps += 1;
    checkReady();
  };

  const open = () => {
    if (!ready || opened.current) return;
    opened.current = true;
    track("envelope_open");
    window.dispatchEvent(new Event("letter:open"));
    stage.current!.dataset.open = "true";
    const H = stage.current!.offsetHeight;
    const envelopeParts = [front.current, flap.current, peekLetter.current, peekPhoto.current, hint.current];
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    gsap.to(stage.current, { rotationX: 0, rotationY: 0, x: 0, y: 0, duration: 0.35, ease: "power2.out", overwrite: "auto" });

    const done = () => {
      gsap.set(envelopeParts, { visibility: "hidden" });
      // drop leftover 3D and pin the card to whole pixels, or the text blurs
      gsap.set(stage.current, { clearProps: "transform" });
      setLanded(true);
      unlockScroll();
      // unlocking brings the scrollbar back and shifts layout, so pin after
      pinCard();
      onLanded?.({ card: card.current!, envelope: front.current!, openFlap: openFlap.current!, title: cardTitle.current! });
    };

    if (reduce) {
      gsap
        .timeline({ onComplete: done })
        .to(envelopeParts, { opacity: 0, duration: 0.4 })
        .set(card.current, { y: 0, scale: 1, rotation: 0, zIndex: 5 });
      return;
    }

    gsap
      .timeline({ onComplete: done })
      // rotates away from us, so it never swings past the envelope edges
      .to(flap.current, { rotationX: -180, transformPerspective: 900, duration: 0.6, ease: "power2.inOut" }, 0)
      .to(peekLetter.current, { y: -H * 0.14, duration: 0.5, ease: "power2.out" }, 0.3)
      .to(peekPhoto.current, { y: -H * 0.22, rotation: 8, duration: 0.5, ease: "power2.out" }, 0.35)
      .to(card.current, { y: -H * 0.6, duration: 0.85, ease: "power2.out" }, 0.4)
      .to(envelopeParts, { y: `+=${window.innerHeight}`, duration: 0.9, ease: "power2.in" }, 0.85)
      // raise only after the envelope and flap are gone, or the hidden part pops in
      .set(card.current, { zIndex: 5 }, 0.85 + 0.9)
      .to(card.current, { y: 0, scale: 1, rotation: 0, duration: 1.1, ease: "power3.inOut" }, 1.45);
  };

  const pinCard = () => {
    const el = card.current;
    // only at full size; mid-scroll it's scaled and would measure wrong
    if (!el || Number(gsap.getProperty(el, "scale")) !== 1) return;
    const r = el.getBoundingClientRect();
    gsap.set(el, { x: `+=${-r.left}`, y: `+=${-r.top}` });
  };

  useEffect(() => {
    if (!landed) return;
    const onResize = () => requestAnimationFrame(pinCard);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [landed]);

  const flipping = useRef(false);
  const flip = () => {
    if (!landed || flipping.current) return;
    flipping.current = true;
    const toBack = !flipped;
    setFlipped(toBack);
    const el = card.current!;
    const inner = cardInner.current!;

    // flat (no 3D) at rest for sharp text. Perspective is set, never tweened: tweening it distorts the turn.
    gsap.set(inner, { transformPerspective: 2400 });
    if (!toBack) {
      delete el.dataset.side;
      gsap.set(inner, { rotationY: 180 });
    }
    // scroll locked while the back is showing
    if (toBack) holdScroll(true);

    gsap
      .timeline({
        onComplete: () => {
          gsap.set(inner, { clearProps: "transform" });
          if (toBack) el.dataset.side = "back";
          else holdScroll(false);
          flipping.current = false;
        },
      })
      .to(el, { scale: 0.82, duration: 0.4, ease: "power2.inOut" })
      .to(inner, { rotationY: toBack ? 180 : 0, duration: 0.75, ease: "power3.inOut" })
      .to(el, { scale: 1, duration: 0.45, ease: "power2.inOut" });
  };

  return (
    <div className={styles.root} ref={root}>
      <div className={styles.stage} ref={stage}>
        <div className={styles.flap} ref={flap} aria-hidden="true">
          <span className={`${styles.flapFill} ${styles.textured}`} />
          <svg viewBox="0 0 100 62" preserveAspectRatio="none">
            <polygon points="0,0 100,0 50,62" />
          </svg>
        </div>

        <div className={styles.peekLetter} ref={peekLetter} aria-hidden="true" />
        <div className={styles.peekPhoto} ref={peekPhoto} aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={gallery.items[1 % gallery.items.length].src} alt="" />
        </div>

        <div
          className={styles.card}
          ref={card}
          data-landed={landed}
          data-cursor={landed ? "open" : undefined}
          data-cursor-label={postcard.flipHint}
          role="button"
          tabIndex={landed ? 0 : -1}
          aria-label={flipped ? postcard.turnBackLabel : postcard.turnLabel}
          onClick={flip}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              flip();
            }
          }}
        >
          <div className={styles.cardInner} ref={cardInner}>
            <div className={`${styles.face} ${styles.cardFront}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={postcard.photo} alt={postcard.alt} />
              <Title ref={cardTitle} variant="card" />
              <p className={styles.frontCaption} ref={frontCaption}>
                {postcard.caption}
              </p>
            </div>
            <div className={`${styles.face} ${styles.cardBack}`}>
              <div className={styles.noteSide}>
                <p className={styles.noteDate}>
                  {content.destination.country}, {postcard.date}
                </p>
                <div className={styles.note}>
                  <p className={styles.noteGreeting}>
                    <span>{postcard.greeting}</span>
                    <svg className={styles.heart} viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M12 20.5s-7.2-4.6-9.4-9.1C1 8.1 3 4.6 6.5 4.6c2.1 0 3.7 1.2 5.5 3.3 1.8-2.1 3.4-3.3 5.5-3.3 3.5 0 5.5 3.5 3.9 6.8-2.2 4.5-9.4 9.1-9.4 9.1z"
                        pathLength={1}
                      />
                    </svg>
                  </p>
                  {postcard.message.map((p, i) => (
                    <p key={i} className={styles.notePara}>
                      {p}
                    </p>
                  ))}
                  <p className={styles.noteSign}>
                    {postcard.signoff}
                  </p>
                </div>
              </div>
              <div className={styles.divider} />
              <div className={styles.addressSide}>
                <div className={styles.cardHead}>
                  <span>{postcard.cardLabel}</span>
                  <span className={styles.stampBox}>{postcard.boxLabel}</span>
                </div>
                <div className={styles.rules}>
                  {[envelope.to, "", "", ""].map((text, i) => (
                    <span key={i} className={styles.rule}>
                      <i className={styles.ruleLine} />
                      {text ? (
                        <span className={styles.ruleName}>
                          {text}
                        </span>
                      ) : null}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <button
          className={styles.front}
          ref={front}
          onClick={open}
          disabled={!ready}
          data-cursor={ready && !landed ? "open" : undefined}
          data-cursor-label={envelope.hint}
          aria-label={envelope.openLabel}
        >
          {/* open flap, only for the collage */}
          <div className={styles.openFlap} ref={openFlap} aria-hidden="true">
            <span className={`${styles.flapFill} ${styles.textured}`} />
            <svg viewBox="0 0 100 62" preserveAspectRatio="none">
              <polygon points="0,62 100,62 50,0" />
            </svg>
          </div>

          <span className={`${styles.paperFill} ${styles.textured}`} ref={paperFill} aria-hidden="true" />

          <svg className={styles.edgeSvg} viewBox="0 0 160 100" preserveAspectRatio="none" aria-hidden="true">
            <rect className={styles.edge} x="0" y="0" width="160" height="100" pathLength={1} />
          </svg>

          <div className={styles.from}>
            <span className={styles.label} data-rise>
              {envelope.fromLabel}
            </span>
            <span className={styles.fromName} data-rise>
              {envelope.from}
            </span>
          </div>

          <div
            ref={stampsRef}
            className={styles.stamps}
            style={{ right: `${STAMP_RIGHT}cqw`, gap: `${STAMP_GAP}cqw` }}
            data-cursor={ready ? "open" : undefined}
            data-cursor-label={envelope.stampHint}
          >
            {stamps.map((s, i) => (
              <div
                key={i}
                className={styles.stampSlot}
                style={{ width: `${s.width}cqw`, translate: `0 ${s.drop}cqw`, rotate: `${s.tilt}deg` }}
              >
                <Stamp
                  src={s.src}
                  focus={s.focus}
                  ink={theme.ink}
                  shape={s.shape}
                  month={stampDate.month}
                  day={stampDate.day}
                  country={content.destination.country}
                  year={stampDate.year}
                  start={startStamps}
                  delay={i * 0.25}
                  instant={instant}
                  onDrawn={onStampDrawn}
                />
              </div>
            ))}
          </div>

          <div className={styles.postmark} style={{ left: `${postmarkLeft}cqw`, width: `${POSTMARK_W}cqw` }}>
            <Postmark ref={postmark} city={content.destination.city} year={stampDate.year} />
          </div>

          <div className={styles.address}>
            <span className={styles.label} data-rise>
              {envelope.toLabel}
            </span>
            <span className={styles.toName} data-rise>
              {envelope.to}
            </span>
            <span className={styles.toLine} data-rise>
              {envelope.toAddress}
            </span>
          </div>
        </button>

        <p className={styles.hint} ref={hint} data-ready={ready} aria-hidden="true">
          {envelope.hint}
        </p>
      </div>
    </div>
  );
}
