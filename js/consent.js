// ── Cookie consent + Google Analytics 4 (CNIL-compliant) ──
// On the redesigned pages the prompt renders inline in the footer
// (the brand bans floating banners / overlays). Legacy pages that
// have no [data-consent-slot] fall back to the small corner banner.
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

  var CONSENT_TEXT = 'Nous utilisons des cookies de mesure d’audience (Google Analytics) ' +
    'pour comprendre comment vous utilisez le site. Vos données sont anonymisées.';

  function handleChoice(choice, cleanup) {
    if (!choice) return;
    localStorage.setItem(STORAGE_KEY, choice);
    cleanup();
    if (choice === 'accept') loadGA();
  }

  // Redesigned pages: render the prompt inline in the footer.
  function renderFooterPrompt(slot) {
    slot.innerHTML =
      '<p class="mq-footer__consent-text">' + CONSENT_TEXT + '</p>' +
      '<div class="mq-footer__consent-actions">' +
        '<button class="mq-footer__consent-btn" data-consent="refuse">Refuser</button>' +
        '<button class="mq-footer__consent-btn mq-footer__consent-btn--accept" data-consent="accept">Accepter</button>' +
      '</div>';
    slot.hidden = false;
    slot.addEventListener('click', function(e) {
      handleChoice(e.target.dataset.consent, function() {
        slot.innerHTML = '';
        slot.hidden = true;
      });
    });
  }

  // Legacy pages: small corner banner (styled in css/styles.css).
  function showBanner() {
    var b = document.createElement('div');
    b.className = 'cookie-banner';
    b.setAttribute('role', 'dialog');
    b.setAttribute('aria-label', 'Consentement aux cookies');
    b.innerHTML =
      '<p class="cookie-banner__text">' + CONSENT_TEXT + '</p>' +
      '<div class="cookie-banner__actions">' +
        '<button class="btn btn--ghost cookie-banner__btn" data-consent="refuse">Refuser</button>' +
        '<button class="btn btn--filled cookie-banner__btn" data-consent="accept">Accepter</button>' +
      '</div>';
    document.body.appendChild(b);
    b.addEventListener('click', function(e) {
      handleChoice(e.target.dataset.consent, function() { b.remove(); });
    });
  }

  function renderPrompt() {
    var slot = document.querySelector('[data-consent-slot]');
    if (slot) {
      renderFooterPrompt(slot);
    } else {
      showBanner();
    }
  }

  if (consent === 'accept') {
    loadGA();
  } else if (!consent) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', renderPrompt);
    } else {
      renderPrompt();
    }
  }
})();
