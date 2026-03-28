// ── Lazy-load iframes via data-src ──
function loadIframes(panel) {
  panel.querySelectorAll('iframe[data-src]').forEach(function(iframe) {
    iframe.src = iframe.dataset.src;
    iframe.removeAttribute('data-src');
  });
}

// ── Gestion des onglets ──
var TABS = ['actu', 'sessions', 'c19'];
var btns = document.querySelectorAll('.tab-btn');
var panels = document.querySelectorAll('.tab-panel');

function activateTab(id) {
  btns.forEach(function(b) {
    var active = b.dataset.tab === id;
    b.classList.toggle('active', active);
    b.setAttribute('aria-selected', active);
  });
  panels.forEach(function(p) { p.classList.remove('active'); });
  var panel = document.getElementById('tab-' + id);
  if (panel) {
    panel.classList.add('active');
    loadIframes(panel);
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
  history.replaceState(null, '', '#' + id);
}

btns.forEach(function(btn) {
  btn.addEventListener('click', function() { activateTab(btn.dataset.tab); });
});

// ── Persistance via hash URL ──
var hash = location.hash.replace('#', '');
if (TABS.indexOf(hash) !== -1) {
  activateTab(hash);
} else {
  var first = document.querySelector('.tab-panel.active');
  if (first) loadIframes(first);
}
