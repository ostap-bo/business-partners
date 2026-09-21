(function () {
  "use strict";

  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  var SERVICES = window.SERVICES_DATA || [];
  var CATEGORIES = window.CATEGORIES_DATA || [];

  function basePath() {
    var d = parseInt(document.body.getAttribute("data-depth") || "0", 10);
    var out = "";
    for (var i = 0; i < d; i++) out += "../";
    return out;
  }

  function categoryName(slug) {
    for (var i = 0; i < CATEGORIES.length; i++) if (CATEGORIES[i].slug === slug) return CATEGORIES[i].name;
    return "";
  }

  function serviceBySlug(slug) {
    for (var i = 0; i < SERVICES.length; i++) if (SERVICES[i].slug === slug) return SERVICES[i];
    return null;
  }

  function iconSvg(name, size) {
    var bodies = {
      check: '<polyline points="5,13 10,18 19,7"/>',
      "chevron-right": '<polyline points="9,6 15,12 9,18"/>'
    };
    var s = size || 18;
    return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' + (bodies[name] || bodies.check) + '</svg>';
  }

  // ------------------------------------------------------------------
  // Mobile nav
  // ------------------------------------------------------------------
  function initMobileNav() {
    var toggle = qs("#mobile-menu-toggle");
    var header = qs(".site-header");
    if (!toggle || !header) return;
    toggle.addEventListener("click", function () {
      header.classList.toggle("mobile-open");
    });
  }

  // ------------------------------------------------------------------
  // Language switch - real links generated per-page by the backend
  // (templates.py / link()). The only thing JS needs to do is carry the
  // current ?slug= (or any other query string) across the switch, since
  // service.html is one shared template addressed via query param and
  // the backend link() helper has no way to know it at build time.
  // ------------------------------------------------------------------
  function initLangSwitch() {
    var search = window.location.search;
    if (!search) return;
    qsa(".js-lang-switch").forEach(function (a) {
      a.setAttribute("href", a.getAttribute("href") + search);
    });
  }

  // ------------------------------------------------------------------
  // Consultation modal ("Зв'язатися з нами" popup) - every such button
  // across the site opens this single, shared modal instead of navigating.
  // ------------------------------------------------------------------
  function initConsultModal() {
    var modal = qs("#consult-modal");
    if (!modal) return;
    var closeBtn = qs("#consult-modal-close", modal);
    var openers = qsa(".js-open-consult-modal");
    var lastFocused = null;

    function open() {
      lastFocused = document.activeElement;
      modal.hidden = false;
      document.body.classList.add("modal-open");
      if (closeBtn) closeBtn.focus();
    }
    function close() {
      modal.hidden = true;
      document.body.classList.remove("modal-open");
      if (lastFocused && lastFocused.focus) lastFocused.focus();
    }

    openers.forEach(function (btn) {
      btn.addEventListener("click", open);
    });
    if (closeBtn) closeBtn.addEventListener("click", close);
    modal.addEventListener("click", function (e) {
      if (e.target === modal) close();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !modal.hidden) close();
    });
  }

  // ------------------------------------------------------------------
  // Card sliders (team / advantages, etc.) - scroll-snap track + arrow
  // buttons that can sit anywhere in the layout (e.g. a section head-row),
  // wired to their track by a shared id via data-target.
  // ------------------------------------------------------------------
  function initSliders() {
    qsa(".slider-nav[data-target]").forEach(function (nav) {
      var track = document.getElementById(nav.getAttribute("data-target"));
      var viewport = track && track.parentElement;
      if (!track || !viewport) return;
      var prev = qs(".slider-prev", nav);
      var next = qs(".slider-next", nav);
      var offset = 0; // current translateX, in px (0 = start)

      function cardStep() {
        var card = track.firstElementChild;
        if (!card) return 280;
        var gapStr = window.getComputedStyle(track).columnGap || window.getComputedStyle(track).gap || "18px";
        var gap = parseFloat(gapStr) || 18;
        return card.getBoundingClientRect().width + gap;
      }
      function maxOffset() {
        return Math.max(0, track.scrollWidth - viewport.clientWidth);
      }
      // How many whole cards fit in the visible viewport - we page by
      // exactly this many at a time, so a card is never left half-cropped
      // at the edge; anything that doesn't fit stays reachable only via
      // the arrow buttons (per "не влазить - не додавай, буде в скролі").
      function cardsPerView() {
        return Math.max(1, Math.floor(viewport.clientWidth / cardStep()));
      }
      function apply() {
        track.style.transform = "translateX(-" + offset + "px)";
      }
      function goNext() {
        offset = Math.min(offset + cardStep() * cardsPerView(), maxOffset());
        apply();
      }
      function goPrev() {
        offset = Math.max(offset - cardStep() * cardsPerView(), 0);
        apply();
      }
      if (prev) prev.addEventListener("click", goPrev);
      if (next) next.addEventListener("click", goNext);
      window.addEventListener("resize", function () {
        offset = Math.min(offset, maxOffset());
        apply();
      });
    });
  }

  // ------------------------------------------------------------------
  // Accordion (supports multiple independent groups via data-group)
  // ------------------------------------------------------------------
  function initAccordion(root) {
    qsa(".accordion-item", root || document).forEach(function (item) {
      var trigger = qs(".accordion-trigger", item);
      if (!trigger || trigger._wired) return;
      trigger._wired = true;
      trigger.addEventListener("click", function () {
        var open = item.classList.contains("open");
        item.classList.toggle("open", !open);
        trigger.setAttribute("aria-expanded", String(!open));
      });
    });
  }

  // ------------------------------------------------------------------
  // Forms - real client-side validation + demo success state
  // ------------------------------------------------------------------
  function wireForm(form) {
    if (!form || form._wired) return;
    form._wired = true;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true;
      qsa("[required]", form).forEach(function (field) {
        field.classList.remove("field-error");
        var valid = field.type === "checkbox" ? field.checked : (field.value && field.value.trim());
        if (!valid) { field.classList.add("field-error"); ok = false; }
      });
      if (!ok) return;
      var wrap = form.closest(".form-wrap");
      var successEl = wrap ? qs(".form-success", wrap) : null;
      form.hidden = true;
      if (successEl) successEl.hidden = false;
    });
  }

  function initForms() {
    qsa("form.stacked-form").forEach(wireForm);
  }

  // ------------------------------------------------------------------
  // Service detail page - rendered from ?slug= against SERVICES_DATA
  // ------------------------------------------------------------------
  function initServicePage() {
    var nameEl = qs("#service-name");
    if (!nameEl) return; // not the service template page

    var base = basePath();
    var lang = document.body.getAttribute("data-lang") || "uk";
    var bcLabels = {
      uk: { home: "Головна", services: "Послуги" },
      en: { home: "Home", services: "Services" }
    }[lang];
    var params = new URLSearchParams(window.location.search);
    var slug = params.get("slug");
    var svc = slug ? serviceBySlug(slug) : null;

    if (!svc) {
      qs("#service-hero").hidden = true;
      qsa("main .section").forEach(function (s) { s.hidden = true; });
      var nf = qs("#service-not-found");
      if (nf) nf.hidden = false;
      var bc0 = qs("#service-breadcrumbs");
      if (bc0) bc0.innerHTML =
        '<a href="' + base + 'index.html">' + bcLabels.home + '</a><span class="bc-sep">' + iconSvg("chevron-right", 13) + '</span>' +
        '<a href="' + base + 'services.html">' + bcLabels.services + '</a>';
      return;
    }

    document.title = svc.name + " - " + document.title;
    qs("#service-category").textContent = svc.category_name;
    nameEl.textContent = svc.name;
    qs("#service-offer").textContent = svc.offer;

    var bc = qs("#service-breadcrumbs");
    if (bc) {
      bc.innerHTML =
        '<a href="' + base + 'index.html">' + bcLabels.home + '</a><span class="bc-sep">' + iconSvg("chevron-right", 13) + '</span>' +
        '<a href="' + base + 'services.html">' + bcLabels.services + '</a><span class="bc-sep">' + iconSvg("chevron-right", 13) + '</span>' +
        '<span class="bc-current">' + svc.name + '</span>';
    }

    var includedEl = qs("#service-included");
    if (includedEl) {
      includedEl.innerHTML = svc.included.map(function (item) {
        return '<li>' + iconSvg("check", 16) + '<span>' + item + '</span></li>';
      }).join("");
    }

    var faqEl = qs("#service-faq");
    if (faqEl) {
      faqEl.innerHTML = svc.faq.map(function (pair, i) {
        return '<div class="accordion-item" data-group="service-faq">' +
          '<button type="button" class="accordion-trigger" aria-expanded="false"><span>' + pair[0] + '</span>' +
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" ' +
          'stroke-linecap="round" stroke-linejoin="round" class="acc-caret"><polyline points="6,9 12,15 18,9"/></svg></button>' +
          '<div class="accordion-panel"><p class="muted">' + pair[1] + '</p></div></div>';
      }).join("");
      initAccordion(faqEl);
    }

    var teamEl = qs("#service-team");
    if (teamEl) teamEl.textContent = svc.team;

    var hiddenField = qs("#form-service-field");
    if (hiddenField) hiddenField.value = svc.name;
  }

  document.addEventListener("DOMContentLoaded", function () {
    initMobileNav();
    initLangSwitch();
    initConsultModal();
    initSliders();
    initAccordion();
    initForms();
    initServicePage();
  });
})();
