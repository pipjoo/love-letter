import type Lenis from "lenis";

// Swallow scroll input instead of overflow:hidden, so the scrollbar
// (and the page width) never change.
const SCROLL_KEYS = new Set(["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "]);
const swallow = (e: Event) => e.preventDefault();
const swallowKeys = (e: KeyboardEvent) => {
  if (SCROLL_KEYS.has(e.key)) e.preventDefault();
};

export function holdScroll(hold: boolean) {
  const lenis = (window as unknown as { lenis?: Lenis }).lenis;
  if (hold) {
    lenis?.stop();
    window.addEventListener("wheel", swallow, { passive: false });
    window.addEventListener("touchmove", swallow, { passive: false });
    window.addEventListener("keydown", swallowKeys);
  } else {
    lenis?.start();
    window.removeEventListener("wheel", swallow);
    window.removeEventListener("touchmove", swallow);
    window.removeEventListener("keydown", swallowKeys);
  }
}
