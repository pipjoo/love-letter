"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Reduced motion: no smooth scroll, and every GSAP tween jumps to its end.
    // Scroll-driven motion still follows the scrollbar, since the user moves it.
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) gsap.globalTimeline.timeScale(1000);

    const lenis = reduce ? null : new Lenis({ lerp: 0.09, wheelMultiplier: 1 });
    const raf = (time: number) => lenis?.raf(time * 1000);
    if (lenis) {
      // other components scroll through window.lenis
      (window as unknown as { lenis?: Lenis }).lenis = lenis;
      if (document.documentElement.dataset.locked) lenis.stop();
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);
    }

    // refresh once fonts and images settle, or triggers use a stale page height
    const refresh = () => ScrollTrigger.refresh();
    const onLoad = () => refresh();
    window.addEventListener("load", onLoad);
    document.fonts?.ready.then(refresh);
    const imgs = Array.from(document.images);
    imgs.forEach((img) => {
      if (!img.complete) img.addEventListener("load", refresh, { once: true });
    });
    const settle = window.setTimeout(refresh, 1500);

    return () => {
      window.removeEventListener("load", onLoad);
      window.clearTimeout(settle);
      gsap.globalTimeline.timeScale(1);
      if (!lenis) return;
      gsap.ticker.remove(raf);
      lenis.destroy();
      (window as unknown as { lenis?: Lenis }).lenis = undefined;
    };
  }, []);

  return <>{children}</>;
}
