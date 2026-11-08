#!/usr/bin/env python3
"""Génère la mosaïque de artistes.html depuis le Google Sheet
« recensement artistes passés chez MQ ».

Colonnes attendues (ligne 1) :
  artiste | lien_photo | titre | lien_spotify | lien_apple | lien_deezer | ordre
  + optionnelles : real | compo | mix | rec | master  (cases à cocher : ce qui a été fait au studio)

- Une ligne = un morceau. Les lignes d'un même artiste sont regroupées.
- « ordre » classe les artistes (plus petit = en premier, vide = à la fin).
  Les morceaux gardent l'ordre des lignes du Sheet.
- « ordre » manquant ou égal : l'ordre des lignes du tableau départage.
- « lien_photo » : peut être répété sur chaque ligne (copier-coller). Les liens de
  l'artiste sont essayés dans l'ordre du tableau ; la première image qui se
  télécharge est retenue. Lien de partage Google Drive (« tous les utilisateurs disposant
  du lien »), URL directe d'image (CDN Spotify, Deezer…), ou nom de fichier déjà présent dans photos_artistes/.
  L'image est téléchargée, redimensionnée et copiée dans photos_artistes/<slug>.webp :
  le site n'affiche jamais de lien Drive.

Variables d'environnement :
  SHEET_ID   identifiant du Sheet (obligatoire sauf si CSV_FILE)
  CSV_FILE   (tests) lire un CSV local au lieu du Sheet
Sans dépendance hors Pillow (pour les photos).
"""
import csv
import html
import io
import os
import re
import sys
import unicodedata
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGE = os.path.join(ROOT, "artistes.html")
PHOTO_DIR = os.path.join(ROOT, "photos_artistes")
START = re.compile(r"<!-- ARTISTES:START.*?-->")
END = "<!-- ARTISTES:END -->"
UA = {"User-Agent": "maisonquasar-site-build"}
PLATFORMS = [("lien_spotify", "Spotify"), ("lien_apple", "Apple Music"), ("lien_deezer", "Deezer")]
# Ce qui a été fait au studio sur le morceau : colonne du Sheet, libellé court, libellé complet
CREDITS = [("real", "Réal", "Réalisation"), ("compo", "Compo", "Composition"),
           ("rec", "Rec", "Enregistrement"), ("mix", "Mix", "Mixage"),
           ("master", "Master", "Mastering")]
TRUE_VALUES = {"true", "vrai", "x", "oui", "yes", "1", "✓", "✔"}
PHOTO_MAX = 900  # px, côté le plus long


def log(*a):
    print(*a, file=sys.stderr)


def fetch(url, timeout=30):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read(), r.headers.get("Content-Type", "")


def read_rows():
    if os.environ.get("CSV_FILE"):
        text = open(os.environ["CSV_FILE"], encoding="utf-8").read()
    else:
        sid = os.environ["SHEET_ID"]
        urls = [
            f"https://docs.google.com/spreadsheets/d/{sid}/export?format=csv",
            f"https://docs.google.com/spreadsheets/d/{sid}/gviz/tq?tqx=out:csv",
        ]
        text, err = None, None
        for u in urls:
            try:
                data, ctype = fetch(u)
                if "html" in ctype.lower():
                    raise ValueError(f"réponse HTML (Sheet non partagé ?) : {ctype}")
                text = data.decode("utf-8-sig")
                break
            except Exception as e:  # on essaie l'URL suivante
                err = e
                log(f"échec {u} : {e}")
        if text is None:
            raise SystemExit(f"Impossible de lire le Sheet : {err}")
    rows = list(csv.DictReader(io.StringIO(text)))
    return [{(k or "").strip().lower(): (v or "").strip() for k, v in r.items()} for r in rows]


def slugify(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-") or "artiste"


def is_true(v):
    return (v or "").strip().lower() in TRUE_VALUES


def safe_url(u):
    return u if re.match(r"^https://[^\s\"'<>]+$", u) else ""


def drive_id(u):
    m = re.search(r"drive\.google\.com/(?:file/d/|open\?id=|uc\?(?:.*&)?id=)([\w-]{20,})", u)
    return m.group(1) if m else None


def get_photo(link, slug, keep_old=True):
    """Renvoie le chemin relatif de la photo, ou '' si aucune."""
    dest_rel = f"photos_artistes/{slug}.webp"
    dest = os.path.join(ROOT, dest_rel)
    if not link:
        return dest_rel if os.path.exists(dest) else ""
    local = os.path.join(PHOTO_DIR, os.path.basename(link))
    if "/" not in link and os.path.exists(local):
        return f"photos_artistes/{os.path.basename(link)}"
    did = drive_id(link)
    candidates = (
        [f"https://drive.usercontent.google.com/download?id={did}&export=download",
         f"https://drive.google.com/uc?export=download&id={did}"]
        if did else [safe_url(link)]
    )
    for u in filter(None, candidates):
        try:
            data, ctype = fetch(u, timeout=60)
            from PIL import Image, ImageOps
            img = ImageOps.exif_transpose(Image.open(io.BytesIO(data))).convert("RGB")
            img.thumbnail((PHOTO_MAX, PHOTO_MAX))
            os.makedirs(PHOTO_DIR, exist_ok=True)
            img.save(dest, "WEBP", quality=80, method=6)
            return dest_rel
        except Exception as e:
            log(f"photo {slug} : échec {u} : {e}")
    # Échec : on garde la photo précédente si elle existe
    return dest_rel if keep_old and os.path.exists(dest) else ""


def group(rows):
    artists, order = {}, []
    for i, r in enumerate(rows):
        name = r.get("artiste", "")
        title = r.get("titre", "")
        if not name:
            continue
        key = name.casefold()
        if key not in artists:
            artists[key] = {"name": name, "photos": [], "rank": None, "first": i, "tracks": []}
            order.append(key)
        a = artists[key]
        link = r.get("lien_photo", "")
        if link and link not in a["photos"]:
            a["photos"].append(link)  # dans l'ordre du tableau
        try:
            rank = float(r.get("ordre", "").replace(",", "."))
            a["rank"] = rank if a["rank"] is None else min(a["rank"], rank)
        except ValueError:
            pass
        if title:
            a["tracks"].append({
                "title": title,
                "credits": [(short, full) for k, short, full in CREDITS if is_true(r.get(k))],
                **{k: safe_url(r.get(k, "")) for k, _ in PLATFORMS},
            })
    out = [artists[k] for k in order]
    out.sort(key=lambda a: (a["rank"] is None, a["rank"] or 0, a["first"]))
    return out


def render(artists):
    e = html.escape
    parts = []
    for a in artists:
        slug = slugify(a["name"])
        photo = ""
        for link in a["photos"]:  # première image qui se télécharge
            photo = get_photo(link, slug, keep_old=False)
            if photo:
                break
        if not photo:
            photo = get_photo("", slug)  # sinon, photo précédente si elle existe
        n = len(a["tracks"])
        count = f"{n} morceau" + ("x" if n > 1 else "")
        media = (f'<img src="{e(photo)}" alt="{e(a["name"])}" loading="lazy" width="900" height="900" />'
                 if photo else f'<span class="mq-art-card__initials" aria-hidden="true">{e(a["name"][:2])}</span>')
        tracks = []
        for t in a["tracks"]:
            links = "".join(
                f'<a class="mq-art-pill mq-art-pill--sm" href="{e(t[k])}" target="_blank" rel="noopener noreferrer"'
                f' aria-label="{e(t["title"])} sur {label}">{label}</a>'
                for k, label in PLATFORMS if t[k]
            )
            tracks.append(
                f'          <li class="mq-art-track"><span class="mq-art-track__title">{e(t["title"])}</span>'
                + (f'<span class="mq-art-track__credits"><span class="mq-art-track__credits-label">Au studio</span>'
                   + "".join(f'<abbr title="{full}">{short}</abbr>' for short, full in t["credits"])
                   + "</span>" if t["credits"] else "")
                + (f'<div class="mq-art-links">{links}</div>' if links else "") + "</li>"
            )
        parts.append(f'''      <details class="mq-art-card" name="artistes" id="{e(slug)}">
        <summary>
          <span class="mq-art-card__media">{media}</span>
          <span class="mq-art-card__row">
            <span class="mq-art-card__id">
              <span class="mq-art-card__name">{e(a["name"])}</span>
              <span class="mq-art-card__count">{count}</span>
            </span>
            <span class="mq-art-card__toggle" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path class="v" d="M12 5v14"/></svg></span>
          </span>
        </summary>
        <ul class="mq-art-tracks">
{chr(10).join(tracks)}
        </ul>
      </details>''')
    return "\n".join(parts)


def main():
    rows = read_rows()
    artists = group(rows)
    if not artists:
        # Sécurité : un Sheet vide ou illisible ne doit pas vider la page en ligne.
        log("Aucun artiste trouvé dans le Sheet : page inchangée.")
        return
    page = open(PAGE, encoding="utf-8").read()
    m = START.search(page)
    end = page.find(END)
    if not m or end < m.end():
        raise SystemExit("Marqueurs ARTISTES:START / ARTISTES:END introuvables dans artistes.html")
    new = page[: m.end()] + "\n" + render(artists) + "\n" + page[end:]
    if new != page:
        open(PAGE, "w", encoding="utf-8").write(new)
    log(f"{len(artists)} artistes, {sum(len(a['tracks']) for a in artists)} morceaux.")


if __name__ == "__main__":
    main()
