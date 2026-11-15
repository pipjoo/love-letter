"use client";

import { useState } from "react";
import { saveFile, shareFile } from "../lib/share";
import { track } from "../lib/track";
import dock from "./Dock.module.css";

// `what` names the picture for analytics: "postcard" or "collage"
type Props = { make: () => Promise<File | null>; label: string; what: string };

function useMaking(make: Props["make"]) {
  const [busy, setBusy] = useState(false);
  const run = async (then: (file: File) => void | Promise<void>) => {
    if (busy) return;
    setBusy(true);
    try {
      const file = await make();
      if (file) await then(file);
    } finally {
      setBusy(false);
    }
  };
  return { busy, run };
}

export function SaveButton({ make, label, what }: Props) {
  const { busy, run } = useMaking(make);
  return (
    <button type="button" className={dock.button} aria-label={label} title={label} aria-busy={busy} data-busy={busy || undefined} onClick={() => {
        track("image_save", { what });
        run(saveFile);
      }}>
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
        <path d="M8 1.5 V10.5 M4.5 7 L8 10.5 L11.5 7 M2.5 14.5 H13.5" stroke="currentColor" strokeWidth="1" fill="none" vectorEffect="non-scaling-stroke" />
      </svg>
    </button>
  );
}

export function ShareButton({ make, label, text, what }: Props & { text?: string }) {
  const { busy, run } = useMaking(make);
  return (
    <button type="button" className={dock.button} aria-label={label} title={label} aria-busy={busy} data-busy={busy || undefined} onClick={() => {
        track("image_share", { what });
        run((f) => shareFile(f, text));
      }}>
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
        <path d="M8 10.5 V1.5 M4.5 5 L8 1.5 L11.5 5 M3 8 V14.5 H13 V8" stroke="currentColor" strokeWidth="1" fill="none" vectorEffect="non-scaling-stroke" />
      </svg>
    </button>
  );
}
