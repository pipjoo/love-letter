"use client";

// Starts on the envelope click: browsers only allow audio after a user gesture.

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { content } from "../content";
import { useDockItem } from "../lib/dock";
import { filePlayer, soundCloudPlayer, type Player } from "../lib/player";
import styles from "./Dock.module.css";

const VOLUME = 0.7;

export default function Music() {
  const { src, soundcloud, playHint, pauseHint } = content.music;
  const player = useRef<Player | null>(null);
  const level = useRef({ v: 0 });
  // what the listener chose, separate from pausing on a hidden tab
  const wanted = useRef(false);
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);

  const fade = (to: number, duration: number, then?: () => void) => {
    gsap.killTweensOf(level.current);
    gsap.to(level.current, { v: to, duration, ease: "power1.out", onUpdate: () => player.current?.setVolume(level.current.v), onComplete: then });
  };
  const fadeIn = () => {
    wanted.current = true;
    player.current?.setVolume(level.current.v);
    player.current?.play();
    fade(VOLUME, 2);
  };
  const fadeOut = () => {
    wanted.current = false;
    fade(0, 0.4, () => player.current?.pause());
  };

  useEffect(() => {
    if (!src && !soundcloud) return;
    const p = soundcloud ? soundCloudPlayer(soundcloud, setPlaying) : filePlayer(src, setPlaying);
    player.current = p;
    p.setVolume(0);

    const onOpen = () => {
      setStarted(true);
      fadeIn();
    };
    const onVisibility = () => {
      if (document.hidden) p.pause();
      else if (wanted.current) fadeIn();
    };
    const onLeave = () => {
      if (wanted.current) fadeOut();
    };

    window.addEventListener("letter:open", onOpen);
    window.addEventListener("letter:leave", onLeave);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      p.destroy();
      window.removeEventListener("letter:open", onOpen);
      window.removeEventListener("letter:leave", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, soundcloud]);

  const toggle = () => {
    if (wanted.current) fadeOut();
    else fadeIn();
  };

  useDockItem(
    "music",
    100,
    started ? (
      <button
        type="button"
        className={styles.button}
        data-playing={playing}
        aria-label={playing ? pauseHint : playHint}
        title={playing ? pauseHint : playHint}
        onClick={toggle}
      >
        <span className={styles.bars} aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      </button>
    ) : null,
  );

  return null;
}
