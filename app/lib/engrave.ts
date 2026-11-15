// Photo -> one-ink line engraving (thick lines for dark, thin for light).

export type Luminance = { data: Float32Array; w: number; h: number };

export async function loadLuminance(src: string, aspect: number, focus = 0.35, gridW = 160): Promise<Luminance> {
  const img = new Image();
  img.src = src;
  await img.decode();

  const w = gridW;
  const h = Math.round(gridW / aspect);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;

  // cover crop. focus: 0 top, 1 bottom. Default leans up to keep faces in.
  const iw = img.naturalWidth || 1;
  const ih = img.naturalHeight || 1;
  let sw = iw;
  let sh = ih;
  let sx = 0;
  let sy = 0;
  if (iw / ih > aspect) {
    sw = ih * aspect;
    sx = (iw - sw) * Math.min(1, Math.max(0, focus));
  } else {
    sh = iw / aspect;
    sy = (ih - sh) * Math.min(1, Math.max(0, focus));
  }
  // transparent pixels count as paper
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);

  const px = ctx.getImageData(0, 0, w, h).data;
  const data = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    data[i] = (0.2126 * px[i * 4] + 0.7152 * px[i * 4 + 1] + 0.0722 * px[i * 4 + 2]) / 255;
  }
  return { data: autoLevels(data), w, h };
}

// auto-levels (2nd-98th percentile) so flat photos still have contrast
export function autoLevels(data: Float32Array) {
  const sorted = Array.from(data).sort((a, b) => a - b);
  const lo = sorted[Math.floor(sorted.length * 0.02)];
  const hi = sorted[Math.floor(sorted.length * 0.98)];
  if (hi - lo > 0.05) {
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.min(1, Math.max(0, (data[i] - lo) / (hi - lo)));
    }
  }
  return data;
}

function sample(lum: Luminance, x: number, y: number, W: number, H: number) {
  const gx = Math.min(lum.w - 1, Math.max(0, Math.floor((x / W) * lum.w)));
  const gy = Math.min(lum.h - 1, Math.max(0, Math.floor((y / H) * lum.h)));
  return lum.data[gy * lum.w + gx];
}

/** One engraved line as a closed outline (x, y pairs), thick where the photo is dark. */
function engraveRow(lum: Luminance, i: number, xEnd: number, W: number, H: number, lines: number) {
  const spacing = H / lines;
  const maxT = spacing * 0.92;
  const amp = spacing * 0.9;
  const wavelength = W / 2.2;
  const step = Math.max(1, W / 180);
  const y0 = (i + 0.5) * spacing;
  const upper: number[] = [];
  const lower: number[] = [];
  for (let x = 0; x <= xEnd; x += step) {
    const wave =
      amp * Math.sin((x / wavelength) * Math.PI * 2 + i * 0.55) +
      amp * 0.5 * Math.sin((x / (wavelength * 2.7)) * Math.PI * 2 - i * 0.31);
    const yc = y0 + wave * 0.6;
    const dark = 1 - sample(lum, x, yc, W, H);
    const t = Math.max(spacing * 0.06, Math.pow(dark, 1.15) * maxT);
    upper.push(x, yc - t / 2);
    lower.push(x, yc + t / 2);
  }
  const outline = [...upper];
  for (let k = lower.length - 2; k >= 0; k -= 2) outline.push(lower[k], lower[k + 1]);
  return outline;
}

/** progress 0-1 draws the lines row by row. */
export function drawEngraving(
  ctx: CanvasRenderingContext2D,
  lum: Luminance,
  W: number,
  H: number,
  ink: string,
  progress: number,
  lines = 36,
) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = ink;
  const stagger = 1.4;
  for (let i = 0; i < lines; i++) {
    const local = Math.min(1, Math.max(0, progress * (1 + stagger) - stagger * (i / (lines - 1))));
    const xEnd = local * W;
    if (xEnd <= 0) continue;
    const pts = engraveRow(lum, i, xEnd, W, H, lines);
    ctx.beginPath();
    ctx.moveTo(pts[0], pts[1]);
    for (let k = 2; k < pts.length; k += 2) ctx.lineTo(pts[k], pts[k + 1]);
    ctx.closePath();
    ctx.fill();
  }
}

/** The finished engraving as one SVG path, for the OG image. */
export function engravingPath(lum: Luminance, W: number, H: number, lines: number) {
  let d = "";
  for (let i = 0; i < lines; i++) {
    const pts = engraveRow(lum, i, W, W, H, lines).map((n) => Math.round(n * 10) / 10);
    d += `M${pts[0]} ${pts[1]}`;
    for (let k = 2; k < pts.length; k += 2) d += `L${pts[k]} ${pts[k + 1]}`;
    d += "Z";
  }
  return d;
}
