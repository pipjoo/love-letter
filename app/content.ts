// Every word and photo on the page lives here. Photos go in /public/photos.
// The sample is a made-up couple: Sam in Jakarta asks Sophie in Bangkok to
// meet him in Bali for their anniversary. Photos from Pexels.

export const content = {
  // tab title and link preview
  meta: {
    title: "Happy Anniversary, Sophie",
    description: "A letter from Sam, with a question inside.",
  },

  // table: background. paper: envelope and cards. ink: postmark and engravings. text: writing.
  theme: {
    table: "#2b3f9c",
    paper: "#f7f3ea",
    paperShade: "#ebe5d8",
    ink: "#2b3f9c",
    text: "#141414",
  },

  // One stamp, two when the letter has more than four photos.
  envelope: {
    to: "Sophie",
    // city and postal code only
    toAddress: "Bangkok, 10330",
    from: "Sam",
    toLabel: "To",
    fromLabel: "From",
    hint: "Open",
    // screen readers
    openLabel: "Open the envelope for Sophie",
    // cursor labels: over the stamps, and while zoomed in
    stampHint: "see",
    backHint: "back",
    stamp: {
      // YYYY-MM-DD, e.g. the birthday. Empty = the day the page is opened.
      date: "2026-11-14",
      // focus: 0 keeps the top of the photo, 1 the bottom
      photos: [
        { src: "/photos/stamp-garuda.webp", focus: 0.4 },
        { src: "/photos/stamp-wisnu.webp", focus: 0.15 },
      ],
    },
  },

  // stamps show the country, the postmark the city
  destination: {
    city: "Bali",
    country: "Indonesia",
  },

  postcard: {
    photo: "/photos/postcard-bali.webp",
    alt: "Cliffs and turquoise sea on the coast of Bali, seen from above",
    // left and right at the top; becomes the header on scroll
    title: ["Dear Sophie", "Happy Anniversary"],
    // handwritten on the photo
    caption: "you, me, this coast",
    // cursor label
    flipHint: "Flip",
    // screen readers
    turnLabel: "Turn the postcard over to read it",
    turnBackLabel: "Turn the postcard to the photo",
    // on the back of both postcards
    cardLabel: "Post Card",
    boxLabel: "Place stamp here",
    // shown after the country, e.g. "Indonesia, 14 November 2026"
    date: "14 November 2026",
    greeting: "My dearest Sophie,",
    message: [
      "Happy anniversary. One year of late calls between Jakarta and Bangkok, and I still look forward to every one.",
      "This is the coast I keep looking at. I want to stand there with you, not send you a picture of it.",
      "I've hidden a few more things in this envelope. Keep reading.",
    ],
    signoff: "Forever yours, Sam",
  },

  // time zone for the date on the stamps and postmark
  header: {
    place: "Jakarta, Indonesia",
    timeZone: "Asia/Jakarta",
    locale: "en-US",
    // screen readers: the header restarts the page
    replayLabel: "Start again from the envelope",
  },

  // Polaroids, four per row (two on phones). Twelve = three rows.
  gallery: {
    items: [
      { src: "/photos/album-01.webp", alt: "A couple in graduation gowns walking across a street", caption: "graduation day" },
      { src: "/photos/album-02.webp", alt: "A man in a red gown hugging a woman in sunglasses", caption: "the hug after" },
      { src: "/photos/album-03.webp", alt: "A couple in gowns crossing a street, seen from behind", caption: "walking you home" },
      { src: "/photos/album-04.webp", alt: "A little girl grinning at the camera", caption: "you, age five" },
      { src: "/photos/album-05.webp", alt: "A couple walking down a sunny street", caption: "our first trip" },
      { src: "/photos/album-06.webp", alt: "A wrist with a gold and blue bracelet", caption: "the bracelet" },
      { src: "/photos/album-07.webp", alt: "A woman laughing, in black and white", caption: "that laugh" },
      { src: "/photos/album-08.webp", alt: "Two people holding hands on a street", caption: "not letting go" },
      { src: "/photos/album-09.webp", alt: "A woman sitting with her arms around her knees", caption: "missing me?" },
      { src: "/photos/album-10.webp", alt: "A woman smiling behind a glass of red wine", caption: "late dinner" },
      { src: "/photos/album-11.webp", alt: "A woman with short hair walking away", caption: "back to bangkok" },
      { src: "/photos/album-12.webp", alt: "A bouquet of roses in a dim room", caption: "one year" },
    ],
    // cursor label and button names
    viewHint: "see",
    prevHint: "Previous photo",
    nextHint: "Next photo",
    closeHint: "Close",
    // stickers stay in this browser only
    stickerHint: "Stickers",
    // the tray, drawn with the device's own emoji. Ten fit on one row on a phone.
    stickers: ["❤️", "💕", "💖", "💘", "💌", "😍", "🥰", "😘", "💋", "🌹"],
    clearHint: "Remove all stickers",
  },

  loveLetter: {
    salutation: "Dear Sophie,",
    paragraphs: [
      "A year ago I didn't know a phone screen could feel this close. Now I plan my evenings around your voice.",
      "Thank you for staying up late, for the voice notes on bad days, and for never letting the distance become an excuse.",
      "I don't want to spend another anniversary on a video call. So I have one more thing to ask.",
    ],
    signoff: "Sam",
  },

  // last photo, turned into a postcard written back
  lastPhoto: {
    src: "/photos/last-bali-beach.webp",
    alt: "Blue umbrellas along a beach in Bali, seen from above",
    caption: "see you on this beach",
    // the invitation, answered with an "approved" stamp. Empty = just the photo.
    ask: "Meet me in Bali for our anniversary?",
    stampHint: "stamp",
    stampLabel: "Approved",
    answerHint: "Stamp here to say yes",
    shareHint: "Share",
    saveHint: "Save",
    shareText: "Approved. See you in Bali.",
    fileName: "bali-approved.png",
    // WhatsApp number with country code (6281234567890) and/or email.
    // Empty hides the button. Links carry text only, the image goes by Save or Share.
    replyTo: {
      whatsapp: "",
      email: "hello@affifjo.com",
    },
    replySubject: "I tried your love letter",
    replyText: "Hi Affif, I've already tested the web, I really like it.",
    whatsappHint: "Send on WhatsApp",
    emailHint: "Send by email",
  },

  // footer of the collage
  colophon: {
    credit: "Made by affifjo",
    contact: "hello@affifjo.com",
    contactHint: "email",
  },

  // Starts when the envelope opens. A file in /public/music (src) or a
  // SoundCloud link (soundcloud). Leave both empty for no music.
  music: {
    src: "",
    soundcloud: "https://soundcloud.com/petra-be/adele-lovesong-instrumental",
    playHint: "Play music",
    pauseHint: "Pause music",
  },

  collage: {
    seeHint: "see",
    replayHint: "replay",
    dragHint: "drag",
    // 9:16 story capture
    captureHint: "Capture",
    captureGuide: "Drag the pieces into the frame",
    captureSaveHint: "Save picture",
    captureShareHint: "Share picture",
    captureCloseHint: "Close",
    captureFile: "love-letter.png",
    // Flowers dropped on the finished pile (Unsplash, transparent WebP).
    // x/y: centre as a fraction of the screen. size: fraction of screen width.
    flowers: [
      { src: "/flowers/sunflower.webp", x: 0.31, y: 0.7, size: 0.1, rotation: -18 },
      { src: "/flowers/daisy.webp", x: 0.66, y: 0.27, size: 0.08, rotation: 14 },
      { src: "/flowers/blossom.webp", x: 0.6, y: 0.78, size: 0.07, rotation: 32 },
    ] as { src: string; x: number; y: number; size: number; rotation: number }[],
  },

} as const;
