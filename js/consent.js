// ── Cookie consent + Google Analytics 4 (CNIL-compliant) ──
(function() {
  var GA_ID = 'G-6XG6Q19H4H';
  var STORAGE_KEY = 'mq_consent';
  var consent = localStorage.getItem(STORAGE_KEY);

  function loadGA() {
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', GA_ID, { anonymize_ip: true });
  }

  function showBanner() {
    var b = document.createElement('div');
    b.className = 'cookie-banner';
    b.setAttribute('role', 'dialog');
    b.setAttribute('aria-label', 'Consentement aux cookies');
    b.innerHTML =
      '<p class="cookie-banner__text">Nous utilisons des cookies de mesure d\u2019audience (Google Analytics) pour comprendre comment vous utilisez le site. Vos données sont anonymisées.</p>' +
      '<div class="cookie-banner__actions">' +
        '<button class="btn btn--ghost cookie-banner__btn" data-consent="refuse">Refuser</button>' +
        '<button class="btn btn--filled cookie-banner__btn" data-consent="accept">Accepter</button>' +
      '</div>';
    document.body.appendChild(b);

    b.addEventListener('click', function(e) {
      var choice = e.target.dataset.consent;
      if (!choice) return;
      localStorage.setItem(STORAGE_KEY, choice);
      b.remove();
      if (choice === 'accept') loadGA();
    });
  }

  if (consent === 'accept') {
    loadGA();
  } else if (!consent) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', showBanner);
    } else {
      showBanner();
    }
  }
})();
