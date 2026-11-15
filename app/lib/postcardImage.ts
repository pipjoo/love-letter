// Last postcard as a 1600x1000 PNG for save/share. Close to the screen
// layout, not pixel-exact.

import { content } from "../content";
import type { Approval } from "./approve";

const W = 1600;
const H = 1000;

const cssVar = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function wrap(ctx: CanvasRenderingContext2D, text: string, max: number) {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    const next = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(next).width > max) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

/** Centred on (0, 0). */
export function drawStamp(ctx: CanvasRenderingContext2D, approval: Approval, w: number, ink: string, serif: string, sans: string) {
  const h = w * 0.42;
  const r = h * 0.14;
  ctx.save();
  ctx.rotate((approval.r * Math.PI) / 180);
  ctx.strokeStyle = ink;
  ctx.fillStyle = ink;
  const frame = (inset: number, width: number) => {
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.roundRect(-w / 2 + inset, -h / 2 + inset, w - inset * 2, h - inset * 2, Math.max(2, r - inset));
    ctx.stroke();
  };
  frame(0, w * 0.018);
  frame(w * 0.04, w * 0.007);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `${Math.round(h * 0.4)}px ${serif}`;
  ctx.fillText(content.lastPhoto.stampLabel.toUpperCase(), 0, -h * 0.06);
  ctx.font = `${Math.round(h * 0.11)}px ${sans}`;
  const day = new Date(approval.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }).toUpperCase();
  ctx.fillText(day, 0, h * 0.26);
  ctx.restore();
}

/** Knock out small specks so the ink looks hand-pressed. */
function wear(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  let seed = 7;
  const rand = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  ctx.save();
  ctx.globalCompositeOperation = "destination-out";
  for (let i = 0; i < 700; i++) {
    ctx.globalAlpha = 0.25 + rand() * 0.6;
    ctx.beginPath();
    ctx.arc(x + rand() * w, y + rand() * h, 0.6 + rand() * 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export async function renderPostcard(approval: Approval | null) {
  const hand = cssVar("--font-hand") || "cursive";
  const serif = cssVar("--font-serif") || "serif";
  const sans = cssVar("--font-sans") || "sans-serif";
  const { paperShade, ink } = content.theme;
  await document.fonts.ready;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = paperShade;
  ctx.fillRect(0, 0, W, H);
  try {
    const grain = await loadImage("/photos/texture-grain.jpg");
    ctx.save();
    ctx.globalCompositeOperation = "soft-light";
    ctx.globalAlpha = 0.6;
    const s = Math.max(W / grain.width, H / grain.height);
    ctx.drawImage(grain, (W - grain.width * s) / 2, (H - grain.height * s) / 2, grain.width * s, grain.height * s);
    ctx.restore();
  } catch {
  }

  // 7 : rule : 5, same as on screen
  const padX = W * 0.07;
  const padY = H * 0.08;
  const gap = W * 0.05;
  const part = (W - padX * 2 - gap * 2 - 1) / 12;
  const noteW = part * 7;
  const ruleX = padX + noteW + gap;
  const addrX = ruleX + 1 + gap;
  const addrW = part * 5;
  const small = W * 0.012;

  ctx.fillStyle = ink;
  ctx.strokeStyle = ink;
  ctx.textBaseline = "top";

  ctx.save();
  ctx.globalAlpha = 0.6;
  ctx.font = `${small}px ${sans}`;
  ctx.letterSpacing = `${small * 0.18}px`;
  ctx.fillText(`${content.destination.city}, ${content.destination.country}`.toUpperCase(), padX, padY);
  ctx.restore();

  ctx.save();
  ctx.font = `${W * 0.032}px ${hand}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const lines = wrap(ctx, content.lastPhoto.ask, noteW * 0.92);
  const lineH = W * 0.032 * 1.4;
  const cy = padY + small * 2 + (H - padY * 2 - small * 2) / 2;
  ctx.translate(padX + noteW / 2, cy);
  ctx.rotate((-1 * Math.PI) / 180);
  lines.forEach((line, i) => ctx.fillText(line, 0, (i - (lines.length - 1) / 2) * lineH));
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = 0.25;
  ctx.fillRect(ruleX, padY, 1, H - padY * 2);
  ctx.restore();

  ctx.save();
  ctx.font = `${small}px ${sans}`;
  ctx.letterSpacing = `${small * 0.24}px`;
  ctx.fillText(content.postcard.cardLabel.toUpperCase(), addrX, padY);
  ctx.restore();

  const ruleH = H * 0.045;
  const ruleGap = H * 0.024;
  const rulesTop = H - padY - (ruleH * 4 + ruleGap * 3);
  ctx.save();
  for (let i = 0; i < 4; i++) {
    const y = rulesTop + i * (ruleH + ruleGap) + ruleH;
    ctx.globalAlpha = 0.3;
    ctx.fillRect(addrX, y, addrW, 1);
    if (i === 0) {
      ctx.globalAlpha = 1;
      ctx.font = `${W * 0.026}px ${hand}`;
      ctx.textBaseline = "bottom";
      ctx.fillText(content.envelope.from, addrX, y - H * 0.004);
    }
  }
  ctx.restore();

  const boxW = W * 0.095;
  const boxH = boxW / 0.8;
  const boxX = addrX + addrW - boxW;
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.setLineDash([5, 4]);
  ctx.strokeRect(boxX + 0.5, padY + 0.5, boxW, boxH);
  ctx.setLineDash([]);
  ctx.font = `${W * 0.008}px ${sans}`;
  ctx.letterSpacing = `${W * 0.0008}px`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const boxLines = wrap(ctx, content.postcard.boxLabel.toUpperCase(), boxW * 0.8);
  boxLines.forEach((line, i) => ctx.fillText(line, boxX + boxW / 2, padY + boxH / 2 + (i - (boxLines.length - 1) / 2) * W * 0.011));
  ctx.restore();

  // own layer, so the wear only eats the ink
  const rulesH = ruleH * 4 + ruleGap * 3;
  const areaW = addrW * 0.9;
  const areaH = areaW / 1.6;
  const stampX = addrX + addrW * 0.22 + areaW / 2;
  const stampY = rulesTop - rulesH * 0.55 + areaH / 2;
  const stampW = areaW * 0.6;
  if (approval) {
    const layer = document.createElement("canvas");
    layer.width = W;
    layer.height = H;
    const sctx = layer.getContext("2d")!;
    sctx.translate(stampX, stampY);
    drawStamp(sctx, approval, stampW, ink, serif, sans);
    sctx.setTransform(1, 0, 0, 1, 0, 0);
    wear(sctx, stampX - areaW / 2, stampY - areaH / 2, areaW, areaH);
    ctx.save();
    ctx.globalAlpha = 0.88;
    ctx.globalCompositeOperation = "multiply";
    ctx.drawImage(layer, 0, 0);
    ctx.restore();
  }

  return new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("No image"))), "image/png"));
}
