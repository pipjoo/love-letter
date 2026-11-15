// Bitmaps for the OG image, made with sharp at build time. next/og can't do
// blend modes, SVG filters or WebP, so the textured table and paper are
// composed here the way the CSS composes them on the page.
import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { autoLevels, type Luminance } from "./engrave";

const publicFile = (src: string) => path.join(process.cwd(), "public", src);

const dataUri = (buf: Buffer, type: string) => `data:${type};base64,${buf.toString("base64")}`;

/** The blue table with the speckle photo multiplied over it (Table.module.css). */
export async function tableImage(w: number, h: number, color: string) {
  const speckle = await sharp(publicFile("/photos/texture-speckle-wide-soft.webp")).resize(w, h, { fit: "cover" }).toBuffer();
  const out = await sharp({ create: { width: w, height: h, channels: 3, background: color } })
    .composite([{ input: speckle, blend: "multiply" }])
    .jpeg({ quality: 90 })
    .toBuffer();
  return dataUri(out, "image/jpeg");
}

/** Envelope paper: the color, the SVG grain from globals.css, and the print grain in soft light. */
export async function paperImage(w: number, h: number, color: string) {
  const css = await readFile(path.join(process.cwd(), "app", "globals.css"), "utf8");
  const tiles = [...css.matchAll(/url\("data:image\/svg\+xml;utf8,(<svg[^"]+<\/svg>)"\)/g)].map((m) =>
    Buffer.from(m[1].replace(/%23/g, "#")),
  );
  // the 600px mottling tile is taller than the envelope, so tile on a bigger sheet and crop
  const big = { width: Math.max(w, 600), height: Math.max(h, 600) };
  const sheet = await sharp({ create: { ...big, channels: 3, background: color } })
    .composite((await Promise.all(tiles.map((svg) => sharp(svg).png().toBuffer()))).map((input) => ({ input, tile: true })))
    .png()
    .toBuffer();
  // sharp crops before it composites within one pipeline, so crop in a second pass
  const tiled = await sharp(sheet).extract({ left: 0, top: 0, width: w, height: h }).png().toBuffer();
  const grain = await sharp(publicFile("/photos/texture-grain.jpg"))
    .resize(w, h, { fit: "cover" })
    .ensureAlpha(0.6)
    .png()
    .toBuffer();
  const out = await sharp(tiled).composite([{ input: grain, blend: "soft-light" }]).png().toBuffer();
  return dataUri(out, "image/png");
}

/** Same as loadLuminance in engrave.ts, read with sharp instead of a canvas. */
export async function luminance(src: string, aspect: number, focus = 0.35, gridW = 160): Promise<Luminance> {
  const w = gridW;
  const h = Math.round(gridW / aspect);
  const img = sharp(publicFile(src));
  const { width: iw = 1, height: ih = 1 } = await img.metadata();
  let sw = iw;
  let sh = ih;
  let sx = 0;
  let sy = 0;
  if (iw / ih > aspect) {
    sw = Math.round(ih * aspect);
    sx = Math.round((iw - sw) * Math.min(1, Math.max(0, focus)));
  } else {
    sh = Math.round(iw / aspect);
    sy = Math.round((ih - sh) * Math.min(1, Math.max(0, focus)));
  }
  const raw = await img
    .extract({ left: sx, top: sy, width: sw, height: sh })
    .resize(w, h, { fit: "fill" })
    .flatten({ background: "#ffffff" })
    .removeAlpha()
    .raw()
    .toBuffer();
  const data = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    data[i] = (0.2126 * raw[i * 3] + 0.7152 * raw[i * 3 + 1] + 0.0722 * raw[i * 3 + 2]) / 255;
  }
  return { data: autoLevels(data), w, h };
}
