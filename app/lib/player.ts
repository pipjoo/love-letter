// Same interface for a local file and a SoundCloud track (hidden widget,
// so no copyrighted audio file sits in the repo).

export type Player = {
  play: () => void;
  pause: () => void;
  setVolume: (v: number) => void;
  destroy: () => void;
};

type OnPlaying = (playing: boolean) => void;

export function filePlayer(src: string, onPlaying: OnPlaying): Player {
  const a = new Audio(src);
  a.loop = true;
  a.preload = "auto";
  a.volume = 0;
  const play = () => onPlaying(true);
  const pause = () => onPlaying(false);
  a.addEventListener("play", play);
  a.addEventListener("pause", pause);
  return {
    play: () => void a.play().catch(() => onPlaying(false)),
    pause: () => a.pause(),
    setVolume: (v) => (a.volume = v),
    destroy: () => {
      a.pause();
      a.removeEventListener("play", play);
      a.removeEventListener("pause", pause);
    },
  };
}

type Widget = {
  bind: (event: string, cb: () => void) => void;
  play: () => void;
  pause: () => void;
  seekTo: (ms: number) => void;
  setVolume: (v: number) => void;
};
type SC = { Widget: ((iframe: HTMLIFrameElement) => Widget) & { Events: Record<string, string> } };

let api: Promise<SC> | null = null;
function loadApi() {
  api ??= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://w.soundcloud.com/player/api.js";
    s.onload = () => resolve((window as unknown as { SC: SC }).SC);
    s.onerror = reject;
    document.head.appendChild(s);
  });
  return api;
}

export function soundCloudPlayer(url: string, onPlaying: OnPlaying): Player {
  const iframe = document.createElement("iframe");
  iframe.src = `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&auto_play=false&visual=false&show_artwork=false&hide_related=true&show_comments=false`;
  iframe.allow = "autoplay";
  iframe.title = "Music";
  iframe.setAttribute("aria-hidden", "true");
  iframe.tabIndex = -1;
  // offscreen, not display:none: some browsers stop hidden players
  Object.assign(iframe.style, { position: "fixed", left: "-10px", top: "-10px", width: "1px", height: "1px", opacity: "0", pointerEvents: "none", border: "0" });
  document.body.appendChild(iframe);

  // queue calls until the widget is ready
  let widget: Widget | null = null;
  const queue: ((w: Widget) => void)[] = [];
  const run = (fn: (w: Widget) => void) => (widget ? fn(widget) : queue.push(fn));
  loadApi()
    .then((SC) => {
      const w = SC.Widget(iframe);
      w.bind(SC.Widget.Events.READY, () => {
        widget = w;
        queue.splice(0).forEach((fn) => fn(w));
      });
      w.bind(SC.Widget.Events.PLAY, () => onPlaying(true));
      w.bind(SC.Widget.Events.PAUSE, () => onPlaying(false));
      w.bind(SC.Widget.Events.FINISH, () => {
        w.seekTo(0);
        w.play();
      });
    })
    .catch(() => onPlaying(false));

  return {
    play: () => run((w) => w.play()),
    pause: () => run((w) => w.pause()),
    setVolume: (v) => run((w) => w.setVolume(Math.round(v * 100))),
    destroy: () => iframe.remove(),
  };
}
