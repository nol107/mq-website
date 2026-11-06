/* Maison Quasar — artistes.js
   Accordéon exclusif : les <details name="artistes"> le font nativement
   (Chrome/Edge 120, Firefox 130, Safari 17.2). Ce polyfill couvre les
   navigateurs plus anciens. Source : developer.chrome.com/docs/css-ui/exclusive-accordion */
(function () {
  "use strict";
  var cards = document.querySelectorAll("details.mq-art-card[name]");
  cards.forEach(function (d) {
    d.addEventListener("toggle", function () {
      if (!d.open) return;
      cards.forEach(function (o) { if (o !== d && o.open) o.open = false; });
    });
  });
})();
