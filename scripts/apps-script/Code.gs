/**
 * Maison Quasar — bouton « Mettre à jour le site » du Google Sheet
 * « recensement artistes passés chez MQ ».
 *
 * Installation (une seule fois) :
 * 1. Dans le Sheet : Extensions › Apps Script, coller ce fichier, enregistrer.
 * 2. Paramètres du projet (roue dentée) › Propriétés du script › Ajouter :
 *      GITHUB_TOKEN = le jeton GitHub « fine-grained »
 *      (dépôt nol107/mq-website uniquement, permission Actions : Read and write)
 *    Pour « Compléter les liens et photos » (facultatif pour Spotify) :
 *      SPOTIFY_CLIENT_ID et SPOTIFY_CLIENT_SECRET = identifiants d'une app créée sur
 *      developer.spotify.com (le propriétaire de l'app doit avoir Spotify Premium).
 *      Sans eux, seuls Deezer, Apple Music et les photos sont complétés.
 * 3. Recharger le Sheet : un menu « Maison Quasar » apparaît.
 *    Optionnel : Insertion › Dessin (un bouton), puis ⋮ › Attribuer un script › majSite
 *    (le clic sur un dessin ne marche pas dans l'appli mobile).
 * Au premier clic, Google demande d'autoriser le script : accepter.
 */

const REPO = 'nol107/mq-website';
const WORKFLOW = 'artistes.yml';

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Maison Quasar')
    .addItem('Compléter les liens et photos', 'completerLiens')
    .addItem('Mettre à jour le site', 'majSite')
    .addItem('Voir l\'avancement sur GitHub', 'voirActions')
    .addToUi();
}

function majSite() {
  const ui = SpreadsheetApp.getUi();
  const token = PropertiesService.getScriptProperties().getProperty('GITHUB_TOKEN');
  if (!token) {
    ui.alert('Jeton GitHub manquant : ajoute GITHUB_TOKEN dans les propriétés du script.');
    return;
  }
  SpreadsheetApp.flush(); // s'assure que les dernières saisies sont enregistrées
  const res = UrlFetchApp.fetch(
    'https://api.github.com/repos/' + REPO + '/actions/workflows/' + WORKFLOW + '/dispatches',
    {
      method: 'post',
      contentType: 'application/json',
      muteHttpExceptions: true,
      headers: {
        Authorization: 'Bearer ' + token,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      },
      payload: JSON.stringify({ ref: 'main' })
    }
  );
  const code = res.getResponseCode();
  if (code >= 200 && code < 300) {
    ui.alert('Mise à jour lancée ✓\nLe site sera à jour d\'ici 2 à 5 minutes.');
  } else if (code === 401 || code === 403) {
    ui.alert('GitHub refuse le jeton (' + code + ') : il a peut-être expiré ou n\'a pas la permission Actions en écriture.');
  } else {
    ui.alert('Erreur ' + code + ' :\n' + res.getContentText().slice(0, 500));
  }
}

function voirActions() {
  const url = 'https://github.com/' + REPO + '/actions/workflows/' + WORKFLOW;
  const html = HtmlService.createHtmlOutput('<a href="' + url + '" target="_blank">Ouvrir l\'historique des mises à jour</a>')
    .setWidth(320).setHeight(60);
  SpreadsheetApp.getUi().showModalDialog(html, 'GitHub Actions');
}


/* ============================================================
 * Compléter les liens et photos
 * Cherche chaque ligne (artiste + titre) sur Deezer, Apple Music et Spotify
 * et remplit UNIQUEMENT les cases vides. Les cases remplies sont surlignées
 * en jaune, avec une note : à vérifier avant « Mettre à jour le site ».
 * Colonne « type » : morceau → recherche de titre ; EP / album → recherche d'album.
 * ============================================================ */

const SURLIGNAGE = '#fff2a8';
const PAUSE_MS = 300;

function completerLiens() {
  const ui = SpreadsheetApp.getUi();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  const data = sheet.getDataRange().getValues();
  const head = data[0].map(function (h) { return String(h).trim().toLowerCase(); });
  const col = function (name) { return head.indexOf(name); };
  const C = {
    artiste: col('artiste'), titre: col('titre'), type: col('type'), photo: col('lien_photo'),
    spotify: col('lien_spotify'), apple: col('lien_apple'), deezer: col('lien_deezer')
  };
  if (C.artiste < 0 || C.titre < 0) { ui.alert('Colonnes « artiste » et « titre » introuvables.'); return; }

  const spotify = spotifyToken_();
  const stats = { spotify: 0, apple: 0, deezer: 0, photo: 0, introuvables: [] };
  let spotifyBloque = '';

  // Artistes qui ont déjà une photo (une seule photo par artiste suffit)
  const avecPhoto = {};
  for (let r = 1; r < data.length; r++) {
    if (C.photo >= 0 && String(data[r][C.photo]).trim()) avecPhoto[norm_(data[r][C.artiste])] = true;
  }

  for (let r = 1; r < data.length; r++) {
    const artiste = String(data[r][C.artiste]).trim();
    const titre = String(data[r][C.titre]).trim();
    if (!artiste || !titre) continue;
    const album = C.type >= 0 && /^(ep|album)$/i.test(String(data[r][C.type]).trim());
    const recherche = titreRecherche_(titre);
    const vide = function (k) { return C[k] >= 0 && !String(data[r][C[k]]).trim(); };
    const trouve = [];

    // Deezer : lien
    if (vide('deezer')) {
      const d = deezer_(artiste, recherche, album);
      if (d && d.lien) { ecrire_(sheet, r, C.deezer, d.lien, 'Deezer'); stats.deezer++; trouve.push('deezer'); }
    }
    // Photo de l'artiste (Deezer), une seule par artiste
    if (C.photo >= 0 && !avecPhoto[norm_(artiste)] && vide('photo')) {
      const photo = deezerPhoto_(artiste);
      if (photo) {
        ecrire_(sheet, r, C.photo, photo, 'Deezer, photo de l\'artiste'); stats.photo++;
        avecPhoto[norm_(artiste)] = true;
      }
    }
    // Apple Music
    if (vide('apple')) {
      const a = apple_(artiste, recherche, album);
      if (a) { ecrire_(sheet, r, C.apple, a, 'Apple Music'); stats.apple++; trouve.push('apple'); }
    }
    // Spotify (si identifiants présents et pas bloqué)
    if (vide('spotify') && spotify && !spotifyBloque) {
      const s = spotify_(spotify, artiste, recherche, album);
      if (s && s.bloque) { spotifyBloque = s.bloque; }
      else if (s) { ecrire_(sheet, r, C.spotify, s, 'Spotify'); stats.spotify++; trouve.push('spotify'); }
    }
    if (!trouve.length && (vide('deezer') || vide('apple') || (vide('spotify') && spotify))) {
      stats.introuvables.push(artiste + ' – ' + titre);
    }
  }

  let msg = 'Ajouté (surligné en jaune, à vérifier) :\n' +
    '• Spotify : ' + stats.spotify + '\n• Apple Music : ' + stats.apple +
    '\n• Deezer : ' + stats.deezer + '\n• Photos : ' + stats.photo;
  if (!spotify) msg += '\n\nSpotify ignoré : SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET absents des propriétés du script.';
  if (spotifyBloque) msg += '\n\nSpotify a demandé de patienter ' + spotifyBloque + ' : relance plus tard pour la suite.';
  if (stats.introuvables.length) msg += '\n\nRien trouvé pour :\n' + stats.introuvables.slice(0, 15).join('\n') +
    (stats.introuvables.length > 15 ? '\n…' : '');
  msg += '\n\nVérifie les cases jaunes, retire le surlignage, puis « Mettre à jour le site ».';
  ui.alert(msg);
}

function ecrire_(sheet, r, c, valeur, source) {
  const cell = sheet.getRange(r + 1, c + 1);
  cell.setValue(valeur).setBackground(SURLIGNAGE).setNote('Ajouté automatiquement (' + source + ') — à vérifier');
}

/* Normalisation pour comparer les noms : minuscules, sans accents ni ponctuation */
function norm_(s) {
  return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ').trim();
}
/* « Now you see – titres 1, 2 & 6 » → « Now you see » */
function titreRecherche_(t) {
  return String(t).split(/\s+[–—-]\s+/)[0].trim();
}
/* Les Quasar Sessions sortent sous « Maison Quasar » : on accepte aussi ce nom pour les liens */
function artisteOk_(cherche, trouve) {
  return memeArtiste_(cherche, trouve) || memeArtiste_('Maison Quasar', trouve);
}
function memeArtiste_(cherche, trouve) {
  const a = norm_(cherche), b = norm_(trouve);
  return a && b && (a === b || b.split(' ').join('') === a.split(' ').join(''));
}
function memeTitre_(cherche, trouve) {
  const a = norm_(cherche).replace(/ /g, ''), b = norm_(trouve).replace(/ /g, '');
  return a && b && (a === b || b.indexOf(a) === 0 || a.indexOf(b) === 0);
}
/* 1er essai « artiste titre » ; sinon « titre Maison Quasar » (sorties Quasar Sessions) */
function essais_(artiste, titre, chercher) {
  const qs = [artiste + ' ' + titre, titre + ' Maison Quasar'];
  for (let i = 0; i < qs.length; i++) {
    const r = chercher(qs[i]);
    if (r) return r;
  }
  return null;
}
function getJson_(url, options) {
  Utilities.sleep(PAUSE_MS);
  const res = UrlFetchApp.fetch(url, Object.assign({ muteHttpExceptions: true }, options || {}));
  return { code: res.getResponseCode(), headers: res.getAllHeaders(), json: (function () {
    try { return JSON.parse(res.getContentText()); } catch (e) { return null; }
  })() };
}

/* Deezer : API publique sans clé (la recherche simple marche mieux que la recherche avancée) */
function deezer_(artiste, titre, album) {
  return essais_(artiste, titre, function (q) { return deezerQ_(q, artiste, titre, album); });
}
function deezerQ_(q, artiste, titre, album) {
  const res = getJson_('https://api.deezer.com/search' + (album ? '/album' : '') + '?limit=15&q=' + encodeURIComponent(q));
  const items = (res.json && res.json.data) || [];
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    if (!it.artist || !artisteOk_(artiste, it.artist.name)) continue;
    if (!memeTitre_(titre, it.title)) continue;
    return { lien: it.link };
  }
  return null;
}
/* Photo de l'artiste : recherche d'artiste Deezer, nom identique, sans l'image par défaut */
function deezerPhoto_(artiste) {
  const res = getJson_('https://api.deezer.com/search/artist?limit=10&q=' + encodeURIComponent(artiste));
  const items = (res.json && res.json.data) || [];
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    if (!memeArtiste_(artiste, it.name)) continue;
    const photo = it.picture_xl || '';
    return /\/artist\/\//.test(photo) ? '' : photo; // « artist// » = pas de photo
  }
  return '';
}

/* Apple Music : API iTunes Search, sans clé */
function apple_(artiste, titre, album) {
  return essais_(artiste, titre, function (q) { return appleQ_(q, artiste, titre, album); });
}
function appleQ_(q, artiste, titre, album) {
  const url = 'https://itunes.apple.com/search?country=fr&limit=15&media=music&entity=' +
    (album ? 'album' : 'song') + '&term=' + encodeURIComponent(q);
  const res = getJson_(url);
  const items = (res.json && res.json.results) || [];
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    if (!artisteOk_(artiste, it.artistName)) continue;
    if (!memeTitre_(titre, album ? it.collectionName : it.trackName)) continue;
    const lien = album ? it.collectionViewUrl : it.trackViewUrl;
    return lien ? lien.replace(/[?&]uo=\d+/, '').replace(/\?$/, '') : null;
  }
  return null;
}

/* Spotify : jeton « client credentials » */
function spotifyToken_() {
  const p = PropertiesService.getScriptProperties();
  const id = p.getProperty('SPOTIFY_CLIENT_ID'), secret = p.getProperty('SPOTIFY_CLIENT_SECRET');
  if (!id || !secret) return null;
  const res = UrlFetchApp.fetch('https://accounts.spotify.com/api/token', {
    method: 'post', muteHttpExceptions: true,
    headers: { Authorization: 'Basic ' + Utilities.base64Encode(id + ':' + secret) },
    payload: { grant_type: 'client_credentials' }
  });
  if (res.getResponseCode() !== 200) return null;
  return JSON.parse(res.getContentText()).access_token;
}
function spotify_(token, artiste, titre, album) {
  return essais_(artiste, titre, function (q) { return spotifyQ_(q, token, artiste, titre, album); });
}
function spotifyQ_(q, token, artiste, titre, album) {
  const type = album ? 'album' : 'track';
  const res = getJson_('https://api.spotify.com/v1/search?market=FR&limit=10&type=' + type + '&q=' + encodeURIComponent(q),
    { headers: { Authorization: 'Bearer ' + token } });
  if (res.code === 429) {
    const s = parseInt(res.headers['Retry-After'] || res.headers['retry-after'] || '0', 10);
    return { bloque: s >= 3600 ? Math.round(s / 3600) + ' h' : s >= 60 ? Math.round(s / 60) + ' min' : s + ' s' };
  }
  const items = (res.json && res.json[type + 's'] && res.json[type + 's'].items) || [];
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    if (!it || !(it.artists || []).some(function (a) { return artisteOk_(artiste, a.name); })) continue;
    if (!memeTitre_(titre, it.name)) continue;
    return it.external_urls && it.external_urls.spotify;
  }
  return null;
}
