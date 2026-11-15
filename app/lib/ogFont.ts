// Fonts for the generated images (OG image, icons). next/og can't read
// next/font, so the TTF is fetched from Google Fonts at build time.
// The whole font is fetched, not a `text=` subset, so no names leave the build.
export async function googleFont(family: string) {
  const css = await fetch(`https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}`).then((r) => r.text());
  const url = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1];
  if (!url) throw new Error(`No TTF for ${family} from Google Fonts`);
  return fetch(url).then((r) => r.arrayBuffer());
}

/**
 * Advance width of each character, in em, read from the TTF's cmap and hmtx
 * tables. next/og can't set text on a path, so the postmark lays out its city
 * letter by letter and needs the real widths to space them like the browser.
 */
export function advances(font: ArrayBuffer, text: string) {
  const v = new DataView(font);
  const tables: Record<string, number> = {};
  for (let i = 0, n = v.getUint16(4); i < n; i++) {
    const at = 12 + i * 16;
    tables[String.fromCharCode(v.getUint8(at), v.getUint8(at + 1), v.getUint8(at + 2), v.getUint8(at + 3))] = v.getUint32(at + 8);
  }
  const unitsPerEm = v.getUint16(tables.head + 18);
  const metrics = v.getUint16(tables.hhea + 34);
  // cmap format 4 (Windows Unicode BMP) is enough for a city name
  let sub = 0;
  for (let i = 0, n = v.getUint16(tables.cmap + 2); i < n; i++) {
    const at = tables.cmap + 4 + i * 8;
    if (v.getUint16(at) === 3 && v.getUint16(at + 2) === 1) sub = tables.cmap + v.getUint32(at + 4);
  }
  const segs = v.getUint16(sub + 6) / 2;
  const ends = sub + 14;
  const starts = ends + segs * 2 + 2;
  const deltas = starts + segs * 2;
  const offsets = deltas + segs * 2;
  const glyph = (code: number) => {
    for (let s = 0; s < segs; s++) {
      if (v.getUint16(ends + s * 2) < code) continue;
      const start = v.getUint16(starts + s * 2);
      if (start > code) return 0;
      const delta = v.getInt16(deltas + s * 2);
      const offset = v.getUint16(offsets + s * 2);
      if (!offset) return (code + delta) & 0xffff;
      const g = v.getUint16(offsets + s * 2 + offset + (code - start) * 2);
      return g ? (g + delta) & 0xffff : 0;
    }
    return 0;
  };
  return Array.from(text).map((ch) => {
    const g = Math.min(glyph(ch.codePointAt(0) ?? 0), metrics - 1);
    return v.getUint16(tables.hmtx + g * 4) / unitsPerEm;
  });
}
