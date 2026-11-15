# AGENTS.md

Instructions for any AI coding agent (Claude, Codex, Gemini, Cursor, and others).
Keep answers short. Small models read this file too, so every rule here is one line.

## What this project is

A one-page love letter website. Next.js 16, React 19, TypeScript, GSAP, Lenis, CSS Modules.

## Most requests are content edits

If the user wants to change names, words, dates, photos, the song or the colors, edit **only** `app/content.ts`.
Do not touch components for content changes.

### Recipe: change the names

1. Open `app/content.ts`.
2. Replace every `Sophie` with the recipient's name (title, envelope, letter, last photo).
3. Replace every `Sam` with the sender's name.
4. Change `envelope.toAddress` to the recipient's city and postal code.
5. Also change the reply address, see "Recipe: where the answer goes". Otherwise answers go to the template's author.

### Recipe: change the photos

1. Ask the user to put their photos in `public/photos/`. JPG, PNG or WebP all work.
2. In `app/content.ts`, replace each `/photos/album-NN.webp` path in `gallery.items` with the new file name, for example `/photos/beach.jpg`.
3. Any number of photos works. Add or remove items freely.
4. Update each `alt` with a short description, and each `caption` with a few handwritten words.
5. Polaroids are almost square. Crop tall photos so faces stay in.
6. Change `postcard.photo` and `lastPhoto.src` the same way.
7. Keep each photo under about 400 KB. Photos straight from a phone make the page slow.

### Recipe: change the stamps

1. Put one or two photos in `public/photos/` and list them in `envelope.stamp.photos`.
2. `focus` picks which part of a tall photo stays in frame: 0 is the top, 1 is the bottom.
3. The page shows one stamp when the album has three photos or fewer, and two otherwise.
4. Photos with a plain or transparent background engrave best.

### Recipe: change the couple's favourite place

1. In `app/content.ts`, edit `destination.city` and `destination.country`.
2. The stamps show the country, the postmark shows the city, and the postcard's back is dated from there.

### Recipe: print the birthday on the stamps

1. In `app/content.ts`, set `envelope.stamp.date` to the day, for example `"2026-07-15"`.
2. Leave it empty (`""`) to print the day the page is opened.

### Recipe: change the sender's city and time zone

1. In `app/content.ts`, edit `header.place`, and `header.timeZone` (IANA name, for example `Europe/London`).

### Recipe: add a song

1. Either put an audio file in `public/music/` and set `music.src`, for example `"/music/our-song.mp3"`.
2. Or paste a SoundCloud track link into `music.soundcloud`. It plays through SoundCloud's own hidden player.
3. Leave both empty for no music. The music button disappears.
4. Never commit a copyrighted song file to a public repository. Use the SoundCloud link instead.

### Recipe: change the invitation on the last postcard

1. Edit `lastPhoto.ask`, the question written on the last postcard.
2. Edit `lastPhoto.stampLabel` (the word on the stamp), `answerHint`, `shareText` and `fileName` to match.
3. Set `ask` to `""` to drop the invitation. The last piece is then just the photo: no stamp, no flip.

### Recipe: where the answer goes

1. In `lastPhoto.replyTo`, set `email` and/or `whatsapp` (country code, digits only, for example `"6281234567890"`).
2. Leave one empty to hide its button. Leave both empty for no reply buttons.
3. Edit `replySubject` and `replyText`. That is the message the recipient sends back.
4. A link can only carry text. The stamped postcard image goes by the Save or Share button.

### Recipe: change the stickers

1. Edit `gallery.stickers`, a list of emoji.
2. Ten fit on one row on a phone.

### Recipe: change the flowers on the collage

1. Ask the user for transparent PNG or WebP images they own or may use, and put them in `public/flowers/`.
2. Edit `collage.flowers`, one item per flower: `src`, `x` and `y` (centre, as a fraction of the screen), `size` (fraction of the screen width) and `rotation` in degrees.
3. Leave the list empty (`[]`) for no flowers.
4. Never use images copied from Pinterest or a web search in a public repository.

### Recipe: change the colors

1. Edit `theme` in `app/content.ts`: `table`, `paper`, `paperShade`, `ink`, `text`.
2. The favicon and the link preview image follow these colors.

### Recipe: change the link preview

1. Edit `meta.title` and `meta.description`.
2. The preview image is drawn from `content.ts` at build time: the envelope with the names, stamps and postmark. Nothing else to do.
3. On a host other than Vercel, set the environment variable `NEXT_PUBLIC_SITE_URL` to the site's address, for example `https://our-letter.com`.

### Recipe: change the footer credit

1. `colophon` credits the template's author. Keep it unless the user asks to change it.

### Recipe: check your work

1. Run `npm run build`. It must finish without errors.
2. Run `npm run dev` and open http://localhost:3000.

## Rules

- Never commit real personal photos or messages to a public repository.
- Keep all copy in `app/content.ts`. No text hardcoded in components.
- Respect `prefers-reduced-motion`. Every animation needs a reduced-motion path.
- Nothing appears from nowhere: objects enter from a screen edge, from behind another object, or are drawn by a line. Objects never fade.
- Text is the exception: it rises and fades in from below. A stamp's paper color may also fade in after its outline is drawn.
- Three typefaces: Instrument Serif for names and printed text (names in capitals), Cedarville Cursive for anything handwritten on the postcard, Instrument Sans for small labels and the cursor (cursor text in lowercase).
- The stamp and postmark shapes live in `app/lib/shapes.ts`. The page and the preview image both use them, so change them there.
- All files in this repository are written in English.
- `AGENTS.md`, `CLAUDE.md` and `GEMINI.md` belong to the template. Keep them.

## Project status

The page is one pinned "table": an envelope opens into a postcard, then an album page, a folded letter and a last postcard are laid on the pile as you scroll, and the camera pulls back to a collage (`app/components/Table.tsx`).
