// Objects.tsx calls openPhoto, Lightbox.tsx listens. The grid is passed
// so the lightbox knows where each polaroid goes back to.

export type OpenPhoto = { index: number; grid: HTMLElement };

export function openPhoto(index: number, el: HTMLElement) {
  if (document.documentElement.dataset.collage) return;
  const grid = el.parentElement;
  if (!grid) return;
  window.dispatchEvent(new CustomEvent<OpenPhoto>("lightbox:open", { detail: { index, grid } }));
}
