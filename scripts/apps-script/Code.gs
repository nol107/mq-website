/**
 * Maison Quasar — bouton « Mettre à jour le site » du Google Sheet
 * « recensement artistes passés chez MQ ».
 *
 * Installation (une seule fois) :
 * 1. Dans le Sheet : Extensions › Apps Script, coller ce fichier, enregistrer.
 * 2. Paramètres du projet (roue dentée) › Propriétés du script › Ajouter :
 *      GITHUB_TOKEN = le jeton GitHub « fine-grained »
 *      (dépôt nol107/mq-website uniquement, permission Actions : Read and write)
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
