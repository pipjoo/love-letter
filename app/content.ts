// Every word and photo on the page lives here. Photos go in /public/photos.
// The sample names and text are made up.

export const content = {
  // tab title and link preview
  meta: {
    title: "Sophie — Happy Birthday",
    description: "A little corner of the internet, made with love.",
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
    toAddress: "Jakarta, 12160",
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
      date: "",
      // focus: 0 keeps the top of the photo, 1 the bottom
      photos: [
        { src: "/photos/stamp-tower.webp", focus: 0.4 },
        { src: "/photos/stamp-fuji.webp", focus: 0.66 },
      ],
    },
  },

  // stamps show the country, the postmark the city
  destination: {
    city: "Seoul",
    country: "Korea",
  },

  postcard: {
    // sample photo: Pexels (pexels.com/photo/9937460)
    photo: "/photos/postcard-town.webp",
    alt: "A lakeside town with red roofs, seen from above",
    // left and right at the top; becomes the header on scroll
    title: ["Dear Sophie", "Happy Birthday"],
    // handwritten on the photo
    caption: "the place you always want to go",
    // cursor label
    flipHint: "Flip",
    // screen readers
    turnLabel: "Turn the postcard over to read it",
    turnBackLabel: "Turn the postcard to the photo",
    // on the back of both postcards
    cardLabel: "Post Card",
    boxLabel: "Place stamp here",
    // shown after the country, e.g. "Korea, 14 November 2026"
    date: "14 November 2026",
    greeting: "My dearest Sophie,",
    message: [
      "Happy birthday to the girl who makes every ordinary day feel like somewhere worth travelling to.",
      "One day I'll take you to this little town by the water, and we'll get lost in its streets until the sun goes down.",
      "Until then, I've hidden a few more things in this envelope. Keep reading.",
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
      { src: "/photos/sample-2.svg", alt: "A moment together", caption: "our first trip" },
      { src: "/photos/sample-3.svg", alt: "A moment together", caption: "rainy sunday" },
      { src: "/photos/sample-4.svg", alt: "A moment together", caption: "that laugh" },
      { src: "/photos/sample-5.svg", alt: "A moment together", caption: "late dinner" },
      { src: "/photos/sample-6.svg", alt: "A moment together", caption: "the beach" },
      { src: "/photos/sample-7.svg", alt: "A moment together", caption: "us, again" },
      { src: "/photos/sample-8.svg", alt: "A moment together", caption: "home" },
      { src: "/photos/sample-9.svg", alt: "A moment together", caption: "always" },
      { src: "/photos/sample-2.svg", alt: "A moment together", caption: "slow mornings" },
      { src: "/photos/sample-4.svg", alt: "A moment together", caption: "your birthday" },
      { src: "/photos/sample-6.svg", alt: "A moment together", caption: "the long way home" },
      { src: "/photos/sample-8.svg", alt: "A moment together", caption: "next year" },
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
      "There are things I don't say often enough, so let me write them down where they'll stay.",
      "You are my calm on the loud days and my favorite person on the quiet ones.",
      "So on your birthday, this is my promise: to keep choosing you, and to keep showing up.",
    ],
    signoff: "Sam",
  },

  // last photo, turned into a postcard written back
  lastPhoto: {
    src: "/photos/sample-9.svg",
    alt: "Sophie and Sam",
    caption: "with love, always",
    // the invitation, answered with an "approved" stamp. Empty = just the photo.
    ask: "Let's finally see Seoul together.",
    stampHint: "stamp",
    stampLabel: "Approved",
    answerHint: "Stamp here to say yes",
    shareHint: "Share",
    saveHint: "Save",
    shareText: "Approved. Let's finally see Seoul together.",
    fileName: "seoul-approved.png",
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
    soundcloud: "",
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
