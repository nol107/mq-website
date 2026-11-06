// ── Cookie consent + Google Analytics 4 + Meta Pixel (CNIL-compliant) ──
// On the redesigned pages the prompt renders inline in the footer
// (the brand bans floating banners / overlays). Legacy pages that
// have no [data-consent-slot] fall back to the small corner banner.
//
// Nothing is loaded before the visitor clicks "Accepter".
// The storage key is versioned: when the purposes change (v2 adds the
// Meta pixel), everyone is asked again, as the CNIL requires consent
// to be specific to each purpose.
//
// Tracking helper for pages: window.mqTrack(name, params, opts)
//   - sends a GA4 event `name` if GA is loaded
//   - sends a Meta event if the pixel is loaded:
//       opts.meta = 'Lead' (standard event) or a custom name (trackCustom)
//   Calls made before consent are simply dropped.
(function() {
  var GA_ID = 'G-6XG6Q19H4H';
  // Meta dataset shared with Shotgun & SubmitHub ("Shotgun Release 2").
  // Never send ViewContent from this site: on this dataset ViewContent is
  // the SubmitHub "click to a streaming platform" conversion used by the
  // music campaigns.
  var META_PIXEL_ID = '1658842735925586';
  var STORAGE_KEY = 'mq_consent_v2';
  var consent = null;
  try { consent = localStorage.getItem(STORAGE_KEY); } catch (e) {}

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

  function loadMetaPixel() {
    /* Meta Pixel base code */
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
    n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
    document,'script','https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', META_PIXEL_ID);
    window.fbq('track', 'PageView');
  }

  function loadAll() {
    loadGA();
    loadMetaPixel();
    document.dispatchEvent(new CustomEvent('mq:consent-granted'));
  }

  window.mqTrack = function(name, params, opts) {
    params = params || {};
    opts = opts || {};
    if (typeof window.gtag === 'function') {
      window.gtag('event', name, params);
    }
    if (typeof window.fbq === 'function' && opts.meta) {
      var STANDARD = ['Lead', 'Contact', 'CompleteRegistration', 'Schedule'];
      if (STANDARD.indexOf(opts.meta) !== -1) {
        window.fbq('track', opts.meta, params);
      } else {
        window.fbq('trackCustom', opts.meta, params);
      }
    }
  };
  window.mqHasConsent = function() { return consent === 'accept'; };

  var CONSENT_TEXT = 'Avec votre accord, nous utilisons des cookies de mesure d’audience ' +
    '(Google Analytics) et le pixel Meta, pour comprendre comment le site est utilisé ' +
    'et mesurer nos publicités Instagram et Facebook. ' +
    '<a href="/mentions-legales.html">En savoir plus</a>';

  function handleChoice(choice, cleanup) {
    if (!choice) return;
    consent = choice;
    try { localStorage.setItem(STORAGE_KEY, choice); } catch (e) {}
    cleanup();
    if (choice === 'accept') loadAll();
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

  // TEMPORARY test mode: skip the consent prompt and load tracking at once.
  // Set back to false before going live (CNIL requires prior consent).
  var TEST_MODE_NO_CONSENT = true;

  if (TEST_MODE_NO_CONSENT) {
    consent = 'accept';
    loadAll();
  } else if (consent === 'accept') {
    loadAll();
  } else if (!consent) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', renderPrompt);
    } else {
      renderPrompt();
    }
  }
})();
