import { ImageResponse } from "next/og";
import { content } from "./content";
import { engravingPath } from "./lib/engrave";
import { luminance, paperImage, tableImage } from "./lib/ogArt";
import { advances, googleFont } from "./lib/ogFont";
import {
  POSTMARK_VIEW,
  POSTMARK_W,
  POSTMARK_WAVES,
  RING_INNER,
  RING_R,
  RING_TEXT,
  RING_X,
  RING_Y,
  STAMP_GAP,
  STAMP_LOOKS,
  STAMP_PAPER,
  STAMP_RIGHT,
  STAMP_SHAPES,
  postmarkLeft,
  stampCount,
} from "./lib/shapes";

// The link preview: the closed envelope on the table, drawn with the same
// geometry as Opening.tsx (sizes in cqw of the envelope) and the same textures.
export const alt = content.meta.title;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const ENV_W = 860;
const ENV_H = ENV_W / 1.6;
const cq = ENV_W / 100;

const { theme, envelope, destination, header, gallery } = content;
const faded = (alpha: number) => {
  const n = parseInt(theme.text.slice(1), 16);
  return `rgba(${n >> 16}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
};

/** Same date as the stamps on the page: content's fixed day, otherwise the build day. */
function stampDate() {
  const fixed: string = envelope.stamp.date;
  const now = fixed ? new Date(`${fixed}T12:00:00Z`) : new Date();
  const part = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(header.locale, { ...opts, timeZone: header.timeZone }).format(now);
  return { month: part({ month: "short" }), day: part({ day: "numeric" }), year: part({ year: "numeric" }) };
}

async function stampArt(look: (typeof STAMP_LOOKS)[number], photo: { src: string; focus: number }) {
  const sheet = STAMP_SHAPES[look.shape];
  const w = look.width * cq;
  const h = (w * sheet.h) / sheet.w;
  // Stamp.module.css: inset 9%, rows of 20% (day) and 7.5% of the width, gaps of 3%
  const picW = w * 0.82;
  const picH = h * 0.82 - w * (0.2 + 0.075 + 0.06);
  const lines = Math.min(48, Math.max(14, Math.round(picH / 2.6)));
  const lum = await luminance(photo.src, picW / picH, photo.focus);
  return { w, h, sheet, picW, picH, d: engravingPath(lum, picW * 4, picH * 4, lines) };
}

export default async function Image() {
  const date = stampDate();
  const looks = STAMP_LOOKS.slice(0, stampCount(gallery.items.length));
  const photos = envelope.stamp.photos;
  const [serif, sans, table, paper, ...stamps] = await Promise.all([
    googleFont("Instrument Serif"),
    googleFont("Instrument Sans"),
    tableImage(size.width, size.height, theme.table),
    paperImage(ENV_W, Math.round(ENV_H), theme.paper),
    ...looks.map((look, i) => stampArt(look, photos[i % photos.length])),
  ]);

  const label = { fontFamily: "Sans", fontSize: Math.max(6, 1.4 * cq), letterSpacing: "0.18em", color: faded(0.42) };
  const pmScale = (POSTMARK_W * cq) / POSTMARK_VIEW.w;
  const city = destination.city.toUpperCase();
  // Postmark.module.css: 9px, letter-spacing 0.24em, centred on the top of the ring
  const cityStep = advances(serif, city).map((em) => 9 * (em + 0.24));
  const cityLength = cityStep.reduce((a, b) => a + b, 0) - 9 * 0.24;
  let stampRight = STAMP_RIGHT * cq;

  return new ImageResponse(
    (
      <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <img src={table} width={size.width} height={size.height} alt="" style={{ position: "absolute", left: 0, top: 0 }} />

        <div
          style={{
            position: "relative",
            display: "flex",
            width: ENV_W,
            height: ENV_H,
            color: theme.text,
            boxShadow: "0 14px 32px -20px rgba(0,0,0,0.3)",
          }}
        >
          <img src={paper} width={ENV_W} height={ENV_H} alt="" style={{ position: "absolute", left: 0, top: 0 }} />

          <div style={{ position: "absolute", left: 4 * cq, top: 4 * cq, display: "flex", flexDirection: "column", gap: 1.2 * cq }}>
            <span style={{ ...label, lineHeight: 1 }}>{envelope.fromLabel.toUpperCase()}</span>
            <span style={{ fontFamily: "Serif", fontSize: 3.8 * cq, lineHeight: 1, letterSpacing: "-0.025em" }}>{envelope.from.toUpperCase()}</span>
          </div>

          {stamps.map((s, i) => {
            const right = stampRight;
            stampRight += s.w + STAMP_GAP * cq;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  top: 4 * cq,
                  right,
                  width: s.w,
                  height: s.h,
                  display: "flex",
                  transform: `rotate(${looks[i].tilt}deg)`,
                }}
              >
                <svg width={s.w} height={s.h} viewBox={`0 0 ${s.sheet.w} ${s.sheet.h}`} style={{ position: "absolute", left: 0, top: 0 }}>
                  <path d={s.sheet.d} fill={STAMP_PAPER} />
                </svg>
                <div
                  style={{
                    position: "absolute",
                    left: s.w * 0.09,
                    top: s.h * 0.09,
                    width: s.picW,
                    height: s.h * 0.82,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    fontFamily: "Serif",
                    fontSize: s.w * 0.075,
                    letterSpacing: "0.06em",
                    lineHeight: 1,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", height: s.w * 0.2 }}>
                    <span>{date.month.toUpperCase()}</span>
                    <span style={{ fontSize: s.w * 0.2, letterSpacing: 0 }}>{date.day}</span>
                  </div>
                  <svg width={s.picW} height={s.picH} viewBox={`0 0 ${s.picW * 4} ${s.picH * 4}`}>
                    <path d={s.d} fill={theme.ink} />
                  </svg>
                  <div style={{ display: "flex", justifyContent: "space-between", height: s.w * 0.075 }}>
                    <span>{destination.country.toUpperCase()}</span>
                    <span>{date.year}</span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* postmark, printed over the left stamp */}
          <div
            style={{
              position: "absolute",
              left: postmarkLeft(looks) * cq,
              top: 18.4 * cq,
              width: POSTMARK_W * cq,
              height: POSTMARK_VIEW.h * pmScale,
              display: "flex",
              color: theme.ink,
              opacity: 0.88,
            }}
          >
            <svg width={POSTMARK_W * cq} height={POSTMARK_VIEW.h * pmScale} viewBox={`0 0 ${POSTMARK_VIEW.w} ${POSTMARK_VIEW.h}`}>
              <defs>
                <filter id="wear" x="0" y="0" width="100%" height="100%" filterUnits="userSpaceOnUse">
                  <feTurbulence type="fractalNoise" baseFrequency="0.32" numOctaves="3" seed="11" />
                  <feColorMatrix type="saturate" values="0" />
                  <feComponentTransfer>
                    <feFuncR type="linear" slope="7" intercept="-2.4" />
                    <feFuncG type="linear" slope="7" intercept="-2.4" />
                    <feFuncB type="linear" slope="7" intercept="-2.4" />
                    <feFuncA type="linear" slope="0" intercept="1" />
                  </feComponentTransfer>
                </filter>
                <mask id="worn" maskUnits="userSpaceOnUse" x="0" y="0" width={POSTMARK_VIEW.w} height={POSTMARK_VIEW.h}>
                  <rect width={POSTMARK_VIEW.w} height={POSTMARK_VIEW.h} filter="url(#wear)" />
                </mask>
              </defs>
              <g mask="url(#worn)" fill="none" stroke={theme.ink} strokeWidth="2" strokeLinecap="round">
                {POSTMARK_WAVES.map((d, i) => (
                  <path key={i} d={d} />
                ))}
                <circle cx={RING_X} cy={RING_Y} r={RING_R} />
                <circle cx={RING_X} cy={RING_Y} r={RING_INNER} />
              </g>
            </svg>
            {/* next/og can't set text on a path, and its rotate() shifts small boxes, so each
                letter follows the arc's height but stays upright (the arc spans only ~40deg) */}
            {city.split("").map((ch, k) => {
              const along = cityStep.slice(0, k).reduce((a, b) => a + b, 0) + (cityStep[k] - 9 * 0.24) / 2 - cityLength / 2;
              const angle = along / RING_TEXT;
              const x = (RING_X + RING_TEXT * Math.sin(angle)) * pmScale;
              const y = (RING_Y - RING_TEXT * Math.cos(angle)) * pmScale;
              const box = 9 * pmScale * 1.4;
              return (
                <span
                  key={k}
                  style={{
                    position: "absolute",
                    left: x - box / 2,
                    top: y - box / 2,
                    width: box,
                    height: box,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "Serif",
                    fontSize: 9 * pmScale,
                  }}
                >
                  {ch}
                </span>
              );
            })}
            <span
              style={{
                position: "absolute",
                left: (RING_X - 30) * pmScale,
                top: (RING_Y - 10) * pmScale,
                width: 60 * pmScale,
                height: 20 * pmScale,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "Serif",
                fontSize: 15 * pmScale,
                letterSpacing: "0.08em",
              }}
            >
              {date.year}
            </span>
          </div>

          <div style={{ position: "absolute", left: 4 * cq, bottom: 4 * cq, display: "flex", gap: 1.4 * cq, alignItems: "flex-start" }}>
            <span style={{ ...label, lineHeight: 1, marginTop: 0.6 * cq }}>{envelope.toLabel.toUpperCase()}</span>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontFamily: "Serif", fontSize: 5.8 * cq, lineHeight: 1, letterSpacing: "-0.025em" }}>{envelope.to.toUpperCase()}</span>
              <span style={{ fontFamily: "Serif", fontSize: 2.1 * cq, lineHeight: 1, marginTop: 1.8 * cq, color: faded(0.58) }}>{envelope.toAddress}</span>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Serif", data: serif, weight: 400 },
        { name: "Sans", data: sans, weight: 400 },
      ],
    },
  );
}
