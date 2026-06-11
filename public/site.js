/* Vanilla replacements for the interactions the Framer runtime used to
 * provide: accordions (FAQ / services), the mobile menu, count-up stats and
 * a gentle reveal for elements as they scroll into view. */
(function () {
  "use strict";

  /* ---- Accordions: swap between captured closed/open markup ---- */
  document.addEventListener("click", function (e) {
    var wrap = e.target.closest("[data-vs-acc]");
    if (wrap) {
      if (e.target.closest("a[href]")) return;
      var state = wrap.getAttribute("data-vs-state");
      var next = state === "closed" ? "open" : "closed";
      var tpl = wrap.querySelector(next === "open" ? "template[data-vs-open]" : "template[data-vs-closed]");
      if (!tpl) return;
      var templates = wrap.querySelectorAll("template");
      Array.prototype.forEach.call(wrap.children, function (c) {
        if (c.tagName !== "TEMPLATE") c.remove();
      });
      wrap.insertBefore(tpl.content.cloneNode(true), wrap.firstChild);
      wrap.setAttribute("data-vs-state", next);
      return;
    }

    /* ---- Mobile menu: swap nav between closed/open captures ---- */
    var navWrap = e.target.closest("[data-vs-nav]");
    if (navWrap) {
      var isBurger = e.target.closest('[data-framer-name="Menu Button"], [data-framer-name="Mobile Close"], [data-framer-name*="Close"]');
      var link = e.target.closest("a[href]");
      if (link) return; // let navigation happen
      if (!isBurger) return;
      var open = navWrap.getAttribute("data-vs-state") === "open";
      if (!open) {
        var tplOpen = navWrap.querySelector("template[data-vs-open]");
        if (!tplOpen) return;
        if (!navWrap.__closedHTML) {
          var current = navWrap.firstElementChild;
          navWrap.__closedHTML = current ? current.outerHTML : null;
        }
        Array.prototype.forEach.call(navWrap.children, function (c) {
          if (c.tagName !== "TEMPLATE") c.remove();
        });
        var frag = tplOpen.content.cloneNode(true);
        navWrap.insertBefore(frag, navWrap.firstChild);
        navWrap.setAttribute("data-vs-state", "open");
        document.documentElement.classList.add("vs-menu-open");
      } else {
        Array.prototype.forEach.call(navWrap.children, function (c) {
          if (c.tagName !== "TEMPLATE") c.remove();
        });
        if (navWrap.__closedHTML) {
          navWrap.insertAdjacentHTML("afterbegin", navWrap.__closedHTML);
        }
        navWrap.setAttribute("data-vs-state", "closed");
        document.documentElement.classList.remove("vs-menu-open");
      }
    }
  });

  /* ---- Count-up stats ---- */
  var countEls = document.querySelectorAll("[data-countup]");
  if ("IntersectionObserver" in window && countEls.length) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          io.unobserve(entry.target);
          var el = entry.target;
          var raw = el.getAttribute("data-countup") || el.textContent;
          var m = raw.match(/(\d+)\s*([+%]?)/);
          if (!m) return;
          var target = parseInt(m[1], 10);
          var suffix = m[2] || "";
          var t0 = null;
          var dur = 1600;
          function tick(t) {
            if (!t0) t0 = t;
            var p = Math.min(1, (t - t0) / dur);
            var eased = 1 - Math.pow(1 - p, 3);
            el.textContent = Math.round(target * eased) + suffix;
            if (p < 1) requestAnimationFrame(tick);
          }
          requestAnimationFrame(tick);
        });
      },
      { threshold: 0.6 }
    );
    countEls.forEach(function (el) {
      io.observe(el);
    });
  }

  /* ---- Scroll reveal for elements marked by the converter ---- */
  var revealEls = document.querySelectorAll("[data-vs-reveal]");
  if ("IntersectionObserver" in window && revealEls.length) {
    var rio = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("vs-in");
            rio.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    revealEls.forEach(function (el) {
      rio.observe(el);
    });
  }
})();
