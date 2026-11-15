"use client";

import { forwardRef, useId } from "react";
import { POSTMARK_VIEW, POSTMARK_WAVES, RING_INNER, RING_R, RING_TEXT, RING_X, RING_Y } from "../lib/shapes";
import styles from "./Postmark.module.css";

type Props = { city: string; year: string };

const CX = RING_X;
const CY = RING_Y;
const R = RING_R;
const R_INNER = RING_INNER;
const R_TEXT = RING_TEXT;
const W = POSTMARK_VIEW.w;
const WAVES = POSTMARK_WAVES;

// pathLength=1 on every stroke so it can be drawn on. The noise mask
// leaves gaps like an unevenly inked rubber stamp.
const Postmark = forwardRef<SVGSVGElement, Props>(function Postmark({ city, year }, ref) {
  const id = useId().replace(/:/g, "");
  return (
    <svg ref={ref} className={styles.root} viewBox={`0 0 ${W} 110`} aria-hidden="true">
      <defs>
        <path id={`${id}-arc`} d={`M ${CX - R_TEXT} ${CY} A ${R_TEXT} ${R_TEXT} 0 0 1 ${CX + R_TEXT} ${CY}`} />
        <filter id={`${id}-wear`} x="0" y="0" width="100%" height="100%" filterUnits="userSpaceOnUse">
          <feTurbulence type="fractalNoise" baseFrequency="0.32" numOctaves="3" seed="11" />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            {/* hard threshold: mostly ink, darkest noise worn away */}
            <feFuncR type="linear" slope="7" intercept="-2.4" />
            <feFuncG type="linear" slope="7" intercept="-2.4" />
            <feFuncB type="linear" slope="7" intercept="-2.4" />
            <feFuncA type="linear" slope="0" intercept="1" />
          </feComponentTransfer>
        </filter>
        <mask id={`${id}-mask`} maskUnits="userSpaceOnUse" x="0" y="0" width={W} height="110">
          <rect width={W} height="110" filter={`url(#${id}-wear)`} />
        </mask>
      </defs>
      <g mask={`url(#${id}-mask)`}>
        {WAVES.map((d, i) => (
          <path key={i} className="pm-line" d={d} pathLength={1} />
        ))}
        <circle className="pm-line" cx={CX} cy={CY} r={R} pathLength={1} />
        <circle className="pm-line" cx={CX} cy={CY} r={R_INNER} pathLength={1} />
        <text className={styles.city} dominantBaseline="central">
          <textPath href={`#${id}-arc`} startOffset="50%" textAnchor="middle">
            {city}
          </textPath>
        </text>
        <text className={styles.year} x={CX} y={CY} textAnchor="middle" dominantBaseline="central">
          {year}
        </text>
      </g>
    </svg>
  );
});

export default Postmark;
