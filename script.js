/* =========================================================
   LA RANCHERITA — interactions
   Lenis smooth scroll · GSAP ScrollTrigger reveals/parallax ·
   Swiper galleries · nav · mobile overlay · menu tabs · counters
   ========================================================= */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Lenis smooth scroll (single rAF driver) ---------- */
  var lenis = null;
  if (window.Lenis && !reduceMotion) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 1 });
    function raf(t) { lenis.raf(t); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
  }

  /* ---------- GSAP / ScrollTrigger ---------- */
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    if (lenis) { lenis.on("scroll", ScrollTrigger.update); }

    /* Reveals */
    if (!reduceMotion) {
      gsap.utils.toArray("[data-reveal]").forEach(function (el) {
        ScrollTrigger.create({
          trigger: el,
          start: "top 88%",
          once: true,
          onEnter: function () { el.classList.add("is-visible"); }
        });
      });

      /* Hero image parallax */
      var heroImg = document.getElementById("heroImg");
      if (heroImg) {
        gsap.to(heroImg, {
          yPercent: 14, ease: "none",
          scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
        });
      }

      /* Figure parallax */
      gsap.utils.toArray("[data-parallax]").forEach(function (img) {
        gsap.fromTo(img, { yPercent: -7 }, {
          yPercent: 7, ease: "none",
          scrollTrigger: { trigger: img.closest("[data-parallax-wrap]") || img, start: "top bottom", end: "bottom top", scrub: true }
        });
      });
    } else {
      document.querySelectorAll("[data-reveal]").forEach(function (el) { el.classList.add("is-visible"); });
    }

    /* Stat counters */
    gsap.utils.toArray("[data-count]").forEach(function (el) {
      var target = parseFloat(el.getAttribute("data-count"));
      var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
      var suffix = el.getAttribute("data-suffix") || "";
      var obj = { v: 0 };
      ScrollTrigger.create({
        trigger: el, start: "top 90%", once: true,
        onEnter: function () {
          if (reduceMotion) { el.textContent = target.toFixed(decimals) + suffix; return; }
          gsap.to(obj, {
            v: target, duration: 1.6, ease: "power2.out",
            onUpdate: function () { el.textContent = obj.v.toFixed(decimals) + suffix; }
          });
        }
      });
    });
  } else {
    document.querySelectorAll("[data-reveal]").forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------- Nav: transparent -> solid ---------- */
  var nav = document.getElementById("nav");
  function onScroll() {
    if (!nav) return;
    if (window.scrollY > 60) nav.classList.add("is-solid");
    else nav.classList.remove("is-solid");
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Mobile overlay ---------- */
  var toggle = document.getElementById("navToggle");
  var overlay = document.getElementById("overlay");
  var overlayClose = document.getElementById("overlayClose");

  function openOverlay() {
    if (!overlay) return;
    overlay.classList.add("is-open");
    if (toggle) toggle.setAttribute("aria-expanded", "true");
    if (lenis) lenis.stop();
    document.body.style.overflow = "hidden";
  }
  function closeOverlay() {
    if (!overlay) return;
    overlay.classList.remove("is-open");
    if (toggle) toggle.setAttribute("aria-expanded", "false");
    if (lenis) lenis.start();
    document.body.style.overflow = "";
  }
  if (toggle) toggle.addEventListener("click", openOverlay);
  if (overlayClose) overlayClose.addEventListener("click", closeOverlay);
  if (overlay) {
    overlay.querySelectorAll(".overlay__nav a").forEach(function (a) {
      a.addEventListener("click", closeOverlay);
    });
  }
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeOverlay();
  });

  /* ---------- Smooth anchor scrolling ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href");
      if (id.length < 2) return;
      var el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(el, { offset: -70 });
      else el.scrollIntoView({ behavior: "smooth" });
    });
  });

  /* ---------- Menu tabs ---------- */
  var tabs = document.querySelectorAll(".menu__tab");
  var panels = document.querySelectorAll(".menu__panel");
  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      var name = tab.getAttribute("data-tab");
      tabs.forEach(function (t) {
        var on = t === tab;
        t.classList.toggle("is-active", on);
        t.setAttribute("aria-selected", on ? "true" : "false");
      });
      panels.forEach(function (p) {
        p.classList.toggle("is-active", p.getAttribute("data-panel") === name);
      });
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    });
  });

  /* ---------- Highlight today's row ONLY when actually open now ---------- */
  (function () {
    var rows = document.querySelectorAll("#hours tbody tr");
    if (!rows.length) return;
    // open/close in minutes from midnight, matching THIS site's hours table.
    // close > 1440 = runs past midnight into the next day. null = closed that day.
    var HRS = {
      0: { o: 480, c: 1320 },  // Sun 8:00 AM – 10:00 PM
      1: { o: 480, c: 1320 },  // Mon 8:00 AM – 10:00 PM
      2: { o: 480, c: 1320 },  // Tue 8:00 AM – 10:00 PM
      3: { o: 480, c: 1320 },  // Wed 8:00 AM – 10:00 PM
      4: { o: 480, c: 1320 },  // Thu 8:00 AM – 10:00 PM
      5: { o: 480, c: 1320 },  // Fri 8:00 AM – 10:00 PM
      6: { o: 480, c: 1320 }   // Sat 8:00 AM – 10:00 PM
    };
    var d = new Date();
    var day = d.getDay();                       // 0 Sun .. 6 Sat
    var now = d.getHours() * 60 + d.getMinutes();
    var open = false;
    var t = HRS[day];
    if (t && now >= t.o && now < Math.min(t.c, 1440)) open = true;   // today's shift, up to midnight
    var yt = HRS[(day + 6) % 7];                                     // yesterday
    if (yt && yt.c > 1440 && now < (yt.c - 1440)) open = true;       // still open from last night's late shift
    if (!open) return;                                              // closed → no highlight, no "Open now"
    var rowIndex = day === 0 ? 6 : day - 1;    // table order: Mon..Sun
    if (rows[rowIndex]) rows[rowIndex].classList.add("is-now");
  })();

  /* ---------- Swiper: gallery ---------- */
  if (window.Swiper) {
    if (document.querySelector(".gallery__swiper")) {
      new Swiper(".gallery__swiper", {
        slidesPerView: "auto",
        spaceBetween: 18,
        grabCursor: true,
        navigation: {
          nextEl: ".gallery__btn--next",
          prevEl: ".gallery__btn--prev"
        }
      });
    }

    if (document.querySelector(".reviews__swiper")) {
      new Swiper(".reviews__swiper", {
        slidesPerView: 1,
        loop: true,
        autoplay: reduceMotion ? false : { delay: 5200, disableOnInteraction: false },
        speed: 700,
        pagination: { el: ".reviews__dots", clickable: true }
      });
    }
  }
})();
