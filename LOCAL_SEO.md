# Local SEO checklist — Maison Quasar Studio

## 1. Claim the Google Business Profile (GBP)

A profile already exists in Google's Knowledge Graph for "Maison Quasar"
(internal id `kgmid=/g/11v9_z91ly`). Claim it before doing anything else —
without claiming, you can't edit photos, hours, or respond to reviews.

1. Go to https://business.google.com
2. Search "Maison Quasar"
3. Click "Manage now" → request ownership
4. Verify (Google sends a postcard to 182 bd de la Villette, takes ~5 days)

## 2. Optimize the GBP after claiming

- **Category**: primary = "Recording studio". Secondary = "Music school" or
  "Music production studio" (Google allows up to 9 secondary categories).
- **Photos**: upload all 6 from `photos_studio/` + add 5–10 more over time
  (sessions in progress, equipment close-ups, artists in the cabin).
- **Hours**: set actual opening hours (or "by appointment only" if more accurate).
- **Phone number**: add a number you actually answer.
- **Website**: link to https://maisonquasar.fr/a-propos.html#studio
- **Services**: add the four listed in our schema — Beatmaking,
  Enregistrement, Mix & Mastering, Réalisation de clip vidéo.
- **Description**: 750 chars max, mention "Paris 19e", "boulevard de la Villette",
  "studio d'enregistrement", "rap", "hip-hop". Don't keyword-stuff — write
  naturally.

## 3. Reviews — the single biggest local-rank lever

Google ranks local businesses heavily on review count + recency.
**Goal: 10 reviews in the first 90 days.**

- After every studio session, send the artist a short message with your
  GBP review link. Most won't write one unless asked.
- Get the share link from your GBP dashboard ("Get more reviews" button).
- Don't offer anything in exchange — Google detects this and demotes you.
- Reply to every review within 48h. Even a "merci 🙏" works.

## 4. Local citations (off-Google directories)

Each one of these = a backlink + a consistency signal. Use the **exact same**
name, address, phone everywhere ("NAP consistency" matters):

- Pages Jaunes — https://www.pagesjaunes.fr/
- Yelp Paris
- Paris.fr cultural directory
- Le Bonbon Paris
- Tripadvisor (less relevant but cheap)

## 5. Posts on GBP (free traffic boost)

Post weekly directly inside GBP — event announcements, new sessions,
behind-the-scenes. These show up directly in Google search results
when someone searches "Maison Quasar" or "studio Paris 19".

---

# Journal cadence

The Journal section was built to give Google fresh, indexable content.
Each post = a new URL = a new chance to rank for long-tail searches
(artist names, song titles, venue names, neighborhood terms).

**Target cadence: one post per session/event.**
- Each new Quasar Session → one post
- Each Cuisine19/Cuisine33 night → one recap post a few days after
- Each EP/single release → one post

12 posts per year is the minimum to be considered "active" by Google
and worth crawling regularly. Each post should be 300–500 words minimum
to be indexable as substantive content.

**Template:** copy `journal/quasar-session-5-ozaleji.html`, change:
- `<title>`, `<meta description>`, all OG tags
- `<link rel="canonical">`
- The `BlogPosting` JSON-LD block (headline, datePublished, description)
- Page H1, embedded video, body text
- Add the new file to `sitemap.xml`
- Add a card linking to it in `journal/index.html`
