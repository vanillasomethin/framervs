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

  /* ---- Scroll reveal: replay Framer entrance animations ---- */
  var revealEls = document.querySelectorAll("[data-vs-reveal]");
  if ("IntersectionObserver" in window && revealEls.length) {
    var rio = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          rio.unobserve(el);
          // Stagger siblings (e.g. the letter-by-letter hero headline).
          var idx = 0;
          if (el.parentElement) {
            var sibs = el.parentElement.children;
            for (var i = 0; i < sibs.length; i++) {
              if (sibs[i] === el) break;
              if (sibs[i].hasAttribute && sibs[i].hasAttribute("data-vs-reveal")) idx++;
            }
          }
          el.style.transitionDelay = Math.min(idx * 45, 700) + "ms";
          requestAnimationFrame(function () {
            el.classList.add("vs-in");
          });
        });
      },
      { threshold: 0.08 }
    );
    revealEls.forEach(function (el) {
      rio.observe(el);
    });
  } else {
    revealEls.forEach(function (el) {
      el.classList.add("vs-in");
    });
  }

  var reduceMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- Ticker marquees: flex <ul> tracks inside overflow-hidden rows ---- */
  if (!reduceMotion) {
    var tracks = [];
    Array.prototype.forEach.call(document.querySelectorAll("ul"), function (ul) {
      var s = ul.getAttribute("style") || "";
      if (s.indexOf("translateX") === -1 || !ul.parentElement || !ul.children.length) return;
      var cs = getComputedStyle(ul.parentElement);
      if ((cs.overflow + cs.overflowX).indexOf("hidden") === -1) return;
      var copies = Array.prototype.slice.call(ul.children);
      for (var d = 0; d < 2; d++) {
        copies.forEach(function (li) {
          ul.appendChild(li.cloneNode(true));
        });
      }
      tracks.push({ el: ul, x: 0, copy: 0 });
    });
    if (tracks.length) {
      var last = performance.now();
      var SPEED = 0.04; // px per ms
      var tick = function (t) {
        var dt = Math.min(t - last, 100);
        last = t;
        tracks.forEach(function (tr) {
          if (!tr.copy) tr.copy = tr.el.scrollWidth / 3;
          tr.x -= dt * SPEED;
          if (-tr.x >= tr.copy) tr.x += tr.copy;
          tr.el.style.transform = "translateX(" + tr.x + "px)";
        });
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  }

  /* ---- Scroll parallax: replay measured scroll-linked transforms ---- */
  var pxEls = document.querySelectorAll("[data-vs-px]");
  if (pxEls.length && !reduceMotion) {
    var pxItems = [];
    pxEls.forEach(function (el) {
      try {
        var d = JSON.parse(el.getAttribute("data-vs-px"));
        d.el = el;
        pxItems.push(d);
      } catch (e) {}
    });
    // Each entry carries the measured (scrollY, value...) sample points;
    // interpolate linearly between them and clamp at the ends.
    var interp = function (pts, y, slot) {
      if (y <= pts[0][0]) return pts[0][slot];
      var last = pts[pts.length - 1];
      if (y >= last[0]) return last[slot];
      for (var i = 1; i < pts.length; i++) {
        if (y <= pts[i][0]) {
          var p0 = pts[i - 1];
          var p1 = pts[i];
          var f = (y - p0[0]) / (p1[0] - p0[0] || 1);
          return p0[slot] + (p1[slot] - p0[slot]) * f;
        }
      }
      return last[slot];
    };
    var pxTick = false;
    var pxUpdate = function () {
      pxTick = false;
      var y = window.scrollY || window.pageYOffset;
      pxItems.forEach(function (d) {
        if (!d.el.offsetParent || !d.pts) return; // hidden breakpoint variant
        var t = d.t.replace(/^transform:\s*/, "");
        t = t.replace("%v0", interp(d.pts, y, 1).toFixed(1));
        if (t.indexOf("%v1") !== -1) t = t.replace("%v1", interp(d.pts, y, 2).toFixed(1));
        d.el.style.transform = t;
      });
    };
    window.addEventListener(
      "scroll",
      function () {
        if (!pxTick) {
          pxTick = true;
          requestAnimationFrame(pxUpdate);
        }
      },
      { passive: true }
    );
    pxUpdate();
  }

  /* ---- Hero cursor image trail ---- */
  var trailHost = document.querySelector("[data-vs-trail]");
  if (trailHost && !reduceMotion && window.matchMedia("(pointer: fine)").matches) {
    var trailImgs = [];
    try {
      trailImgs = JSON.parse(trailHost.getAttribute("data-vs-trail"));
    } catch (e) {}
    if (trailImgs.length) {
      trailImgs.forEach(function (u) {
        new Image().src = u; // pre-warm
      });
      var ti = 0;
      var lastX = -999;
      var lastY = -999;
      var live = 0;
      if (getComputedStyle(trailHost).position === "static") trailHost.style.position = "relative";
      trailHost.addEventListener("mousemove", function (e) {
        var r = trailHost.getBoundingClientRect();
        var x = e.clientX - r.left;
        var y = e.clientY - r.top;
        if (Math.hypot(x - lastX, y - lastY) < 110 || live > 6) return;
        lastX = x;
        lastY = y;
        var d = document.createElement("div");
        d.style.cssText =
          "position:absolute;width:200px;height:150px;background-size:contain;" +
          "background-position:center;background-repeat:no-repeat;border-radius:2px;" +
          "pointer-events:none;perspective:500px;will-change:transform;z-index:2;" +
          "transform:rotateX(-90deg);transition:transform .45s cubic-bezier(.22,1,.36,1),opacity .4s ease";
        d.style.backgroundImage = 'url("' + trailImgs[ti++ % trailImgs.length] + '")';
        d.style.left = x - 100 + "px";
        d.style.top = y - 85 + "px";
        trailHost.appendChild(d);
        live++;
        requestAnimationFrame(function () {
          d.style.transform = "rotateX(0deg)";
        });
        setTimeout(function () {
          d.style.transform = "rotateX(90deg)";
          d.style.opacity = "0";
          setTimeout(function () {
            d.remove();
            live--;
          }, 450);
        }, 750);
      });
    }
  }

  /* ---- Testimonial carousel: gentle auto-advance ---- */
  if (!reduceMotion) {
    Array.prototype.forEach.call(document.querySelectorAll("[data-vs-carousel]"), function (c) {
      if (c.children.length < 2) return;
      var i = 0;
      setInterval(function () {
        if (!c.clientWidth) return; // hidden breakpoint variant
        i++;
        var kids = c.children;
        if (i >= kids.length) i = 0;
        var x = kids[i].offsetLeft - kids[0].offsetLeft;
        if (x > c.scrollWidth - c.clientWidth) {
          i = 0;
          x = 0;
        }
        c.scrollTo({ left: x, behavior: "smooth" });
      }, 4500);
    });
  }
})();
