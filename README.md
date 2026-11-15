# Love Letter

A one-page love letter you can make your own in minutes. An envelope opens into a postcard, then an album of polaroids, a folded letter and a last postcard asking a question are laid on the table as you scroll. It ends as a collage you can rearrange and save as a picture.

Change the names, words and photos in one file, then deploy it for free.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fpipjoo%2Flove-letter&project-name=love-letter&repository-name=love-letter)

## Make it yours with an AI agent

Works with Claude Code, Codex, Gemini CLI, Cursor and similar tools, including free plans.

1. Download or clone this repository.
2. Open the folder in your AI tool.
3. Say what you want, for example:
   - "Change the names to Dina and Raka, and use the photos I put in public/photos."
   - "Print her birthday, 15 July, on the stamps."
   - "Ask 'Let's go to Lombok this year?' on the last postcard, and send the answer to my WhatsApp."
   - "Play this song: <a SoundCloud link>."

The agent reads `AGENTS.md`, which has a recipe for each of these, and only edits `app/content.ts`.

## Make it yours by hand

You need [Node.js](https://nodejs.org) 20 or newer.

1. Run `npm install`.
2. Put your photos in `public/photos/`.
3. Open `app/content.ts` and change the names, words and photo paths. Every part has a short comment.
4. Run `npm run dev` and open http://localhost:3000.

Before you share it, change `lastPhoto.replyTo` to your own email or WhatsApp. It points to the template's author by default.

## What you can change

All in `app/content.ts`:

- Names, the postcard, the letter and every caption.
- Any number of photos in the album.
- The stamps: one or two photos, engraved in ink, with a date you choose.
- The couple's favourite place, printed on the stamps and the postmark.
- A song, from a file or a SoundCloud link.
- The question on the last postcard, and where the answer is sent. Leave the question empty for a plain last photo.
- The sticker emoji, the flowers on the finished collage, and the colors.

The link preview image and the favicon are drawn from the same file, so they show your names and colors without extra work.

## Deploy for free

The button above copies this repository to your GitHub and deploys it on Vercel.

Or by hand:

1. Push your copy to your own GitHub account. Keep it **private** if it contains personal photos.
2. Go to [vercel.com/new](https://vercel.com/new), import the repository and press Deploy.

On another host, set the environment variable `NEXT_PUBLIC_SITE_URL` to your site's address so the link preview works.

## A note on privacy

Your site is public to anyone with the link. Only use photos and words you are comfortable sharing.

Stickers and the "approved" stamp are saved in the visitor's own browser. Nothing is sent anywhere.

## License and credits

The code is [MIT](LICENSE). The images in `public/` keep their own licenses:

- Sample photos, all from Pexels: the [Bali coast](https://www.pexels.com/photo/34356770/) on the postcard, the [beach](https://www.pexels.com/photo/34609172/) on the last postcard, the [Wisnu](https://www.pexels.com/photo/34955123/) and [Garuda](https://www.pexels.com/photo/13449172/) statues on the stamps, and the album photos ([1](https://www.pexels.com/photo/25643178/), [2](https://www.pexels.com/photo/25643191/), [3](https://www.pexels.com/photo/25643174/), [4](https://www.pexels.com/photo/33769367/), [5](https://www.pexels.com/photo/25643190/), [6](https://www.pexels.com/photo/37401949/), [7](https://www.pexels.com/photo/30036877/), [8](https://www.pexels.com/photo/25643186/), [9](https://www.pexels.com/photo/37401736/), [10](https://www.pexels.com/photo/21972317/), [11](https://www.pexels.com/photo/24960091/), [12](https://www.pexels.com/photo/18102249/)).
- Textures from Unsplash: [blue speckles](https://unsplash.com/photos/-cJjkNo8r7k) on the table, [snow](https://unsplash.com/photos/tCm7ZKIt-yE) as print grain, [creased paper](https://unsplash.com/photos/yBAp_IVJTy0) on the album, "Folded off-white paper texture" on the letter, and [white wall paint](https://unsplash.com/photos/MjehAOr30n8) on the stamps.
- Song in the sample: [Lovesong, instrumental](https://soundcloud.com/petra-be/adele-lovesong-instrumental) by petra-be, played through SoundCloud's own player. Nothing is copied into the repository.
- Flowers (sunflower, daisy, apple blossom): Unsplash, cut out on a transparent background.
- Polaroid frame: made for this template.
- Fonts: Instrument Serif, Instrument Sans and Cedarville Cursive, from Google Fonts under the SIL Open Font License.

The Unsplash and Pexels licenses allow free use without attribution. Your own photos stay yours.

Made by Affif Johansyah. Want a custom version? Email [hello@affifjo.com](mailto:hello@affifjo.com).
