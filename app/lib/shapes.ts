// Geometry shared by the page and the generated OG image, so both draw the
// same stamp edge and postmark. No "use client": server code imports it too.

// One path (rectangle + half-circle perforations) so it can be drawn on.
function perforated(w: number, h: number, pitch: number, r: number) {
  const along = (len: number) => {
    const n = Math.floor((len - pitch) / pitch);
    const pad = (len - n * pitch) / 2;
    return Array.from({ length: n + 1 }, (_, i) => pad + i * pitch);
  };
  const xs = along(w);
  const ys = along(h);
  const bite = (x: number, y: number) => `A ${r} ${r} 0 0 0 ${x} ${y}`;
  let d = "M 0 0";
  for (const x of xs) d += ` L ${x - r} 0 ${bite(x + r, 0)}`;
  d += ` L ${w} 0`;
  for (const y of ys) d += ` L ${w} ${y - r} ${bite(w, y + r)}`;
  d += ` L ${w} ${h}`;
  for (const x of [...xs].reverse()) d += ` L ${x + r} ${h} ${bite(x - r, h)}`;
  d += ` L 0 ${h}`;
  for (const y of [...ys].reverse()) d += ` L 0 ${y + r} ${bite(0, y - r)}`;
  return d + " Z";
}

export const STAMP_SHAPES = {
  classic: { w: 80, h: 100, d: perforated(80, 100, 6, 1.9) },
  square: { w: 90, h: 90, d: perforated(90, 90, 4.6, 1.3) },
};

export const STAMP_PAPER = "#fdfbf6";

// Envelope sizes in cqw (% of the envelope width).
export const STAMP_RIGHT = 4;
export const STAMP_GAP = 1.6;
export const POSTMARK_W = 25;
// Two stamps of the same width but different shapes, tops aligned, the second slightly tilted.
export const STAMP_LOOKS = [
  { shape: "classic", width: 16, drop: 0, tilt: 0 },
  { shape: "square", width: 16, drop: 0, tilt: -1 },
] as const;

/** One stamp, two when the letter has more than four photos (heavier mail). */
export function stampCount(galleryPhotos: number) {
  return 1 + galleryPhotos > 4 ? 2 : 1;
}

// Postmark, in its own 200 x 110 viewBox.
export const POSTMARK_VIEW = { w: 200, h: 110 };
export const RING_X = 48;
export const RING_Y = 55;
export const RING_R = 46;
export const RING_INNER = 32;
export const RING_TEXT = (RING_R + RING_INNER) / 2;

export const POSTMARK_WAVES = [0, 1, 2, 3, 4].map((i) => {
  const y = 34 + i * 12;
  const start = RING_X + Math.sqrt(RING_R * RING_R - (y - RING_Y) * (y - RING_Y));
  const len = POSTMARK_VIEW.w - start;
  const a = 5;
  const at = (f: number) => start + len * f;
  return `M${start} ${y} C ${at(1 / 6)} ${y - a}, ${at(2 / 6)} ${y + a}, ${at(0.5)} ${y} S ${at(5 / 6)} ${y - a}, ${POSTMARK_VIEW.w} ${y}`;
});

/** Left edge of the postmark (cqw), so its ring sits on the left-most stamp. */
export function postmarkLeft(stamps: readonly { width: number }[]) {
  const lastStampLeft = 100 - STAMP_RIGHT - stamps.reduce((sum, s) => sum + s.width, 0) - (stamps.length - 1) * STAMP_GAP;
  const ringCenter = lastStampLeft + stamps[stamps.length - 1].width / 2;
  return ringCenter - POSTMARK_W * (RING_X / POSTMARK_VIEW.w);
}
