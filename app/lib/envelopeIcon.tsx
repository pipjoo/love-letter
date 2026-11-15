import { ImageResponse } from "next/og";
import { content } from "../content";

/** The favicon and the home-screen icon: a small envelope on the table. */
export function envelopeIcon(px: number) {
  const { table, paper, ink } = content.theme;
  const w = px * 0.72;
  const h = w * 0.66;
  const line = Math.max(1, px / 24);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: table }}>
        <svg width={w} height={h} viewBox="0 0 100 66">
          <rect x="0" y="0" width="100" height="66" fill={paper} />
          <polyline points="0,0 50,38 100,0" fill="none" stroke={ink} strokeWidth={(line * 100) / w} />
        </svg>
      </div>
    ),
    { width: px, height: px },
  );
}
