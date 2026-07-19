/* ============================================================
   Maison Quasar — quasar.js
   Vanilla replacements for the prototype's React state:
   mobile menu, cycling hero, journal filter. Each block is
   feature-detected, so this one file is safe on every page.
   ============================================================ */
(function () {
  "use strict";

  /* ---------- Mobile menu ----------------------------------- */
  function initMobileMenu() {
    var menu = document.querySelector(".mq-mobilemenu");
    var burger = document.querySelector(".mq-nav__burger");
    if (!menu || !burger) return;

    var close = menu.querySelector(".mq-mobilemenu__close");

    function open() { menu.classList.add("open"); menu.setAttribute("aria-hidden", "false"); }
    function shut() { menu.classList.remove("open"); menu.setAttribute("aria-hidden", "true"); }

    burger.addEventListener("click", open);
    if (close) close.addEventListener("click", shut);
    menu.querySelectorAll(".mq-mobilemenu__item").forEach(function (item) {
      item.addEventListener("click", shut);
    });
  }

  /* ---------- Cycling hero ---------------------------------- */
  /* Auto-rotation default 6s. Manual dot/arrow controls do NOT
     pause auto-rotation — matches the Boiler Room / RA pattern
     called out in the handoff. */
  function initHero() {
    var hero = document.querySelector(".mq-hero");
    if (!hero) return;

    var slides = hero.querySelectorAll(".mq-hero__slide");
    var dots = hero.querySelectorAll(".mq-hero__dot");
    var counter = hero.querySelector(".mq-hero__counter");
    var arrows = hero.querySelectorAll(".mq-hero__arrow");
    if (slides.length < 2) return;

    var idx = 0;
    var total = slides.length;
    var autoMs = parseInt(hero.getAttribute("data-hero-auto"), 10);
    if (isNaN(autoMs)) autoMs = 6000;

    function pad(n) { return String(n).padStart(2, "0"); }

    function render() {
      slides.forEach(function (s, i) {
        s.classList.toggle("is-active", i === idx);
        s.setAttribute("aria-hidden", i === idx ? "false" : "true");
      });
      dots.forEach(function (d, i) {
        d.classList.toggle("is-active", i === idx);
        d.setAttribute("aria-current", i === idx ? "true" : "false");
      });
      if (counter) counter.textContent = pad(idx + 1) + " / " + pad(total);
    }

    function goTo(n) { idx = (n % total + total) % total; render(); }

    dots.forEach(function (dot, i) {
      dot.addEventListener("click", function () { goTo(i); });
    });
    arrows.forEach(function (arrow) {
      arrow.addEventListener("click", function () {
        goTo(idx + (arrow.getAttribute("data-dir") === "prev" ? -1 : 1));
      });
    });

    render();
    var prefersReducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (autoMs > 0 && !prefersReducedMotion) {
      setInterval(function () { goTo(idx + 1); }, autoMs);
    }
  }

  /* ---------- Journal filter -------------------------------- */
  function initJournalFilter() {
    var filterBar = document.querySelector(".mq-journal-filter");
    if (!filterBar) return;

    var buttons = filterBar.querySelectorAll("button");
    var entries = document.querySelectorAll(".mq-journal-entry");
    var empty = document.querySelector(".mq-journal-empty");

    /* Populate category counts from the full entry set. */
    buttons.forEach(function (btn) {
      var cat = btn.getAttribute("data-filter");
      var countEl = btn.querySelector(".count");
      if (!countEl || cat === "Tous") return;
      var n = 0;
      entries.forEach(function (e) {
        if (e.getAttribute("data-category") === cat) n++;
      });
      countEl.textContent = n;
    });

    function apply(filter) {
      var visible = 0;
      entries.forEach(function (entry) {
        var match = filter === "Tous" || entry.getAttribute("data-category") === filter;
        entry.style.display = match ? "" : "none";
        if (match) visible++;
      });
      if (empty) empty.style.display = visible === 0 ? "" : "none";
    }

    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        buttons.forEach(function (b) { b.classList.remove("is-active"); });
        btn.classList.add("is-active");
        apply(btn.getAttribute("data-filter"));
      });
    });

    apply("Tous");
  }

  /* ---------- Auto-hide past events -------------------------- */
  /* Any element carrying data-event-date="YYYY-MM-DD" is hidden
     once that date is in the past. Ported from the pre-redesign
     js/app.js so stale event cards don't linger on the site. */
  function initAutoHideEvents() {
    var els = document.querySelectorAll("[data-event-date]");
    if (!els.length) return;
    var today = new Date(new Date().toDateString());
    els.forEach(function (el) {
      if (new Date(el.dataset.eventDate) < today) {
        el.style.display = "none";
      }
    });
  }

  /* ---------- Boot ------------------------------------------ */
  function boot() {
    initMobileMenu();
    initHero();
    initJournalFilter();
    initAutoHideEvents();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
