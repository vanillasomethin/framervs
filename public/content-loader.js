(() => {
  // Maps the live URL path to a page key inside content.json -> pages{}.
  const PAGE_MAP = {
    "/": "index.html",
    "/index.html": "index.html",
    "/contact": "contact/index.html",
    "/contact/": "contact/index.html",
    "/contact/index.html": "contact/index.html",
    "/estimator": "estimator/index.html",
    "/estimator/": "estimator/index.html",
    "/estimator/index.html": "estimator/index.html",
    "/project-showcase": "project-showcase/index.html",
    "/project-showcase/": "project-showcase/index.html",
    "/project-showcase/index.html": "project-showcase/index.html",
    "/team.html": "team.html",
  };

  // Returns the content.json page key, or null for any path we don't manage
  // (e.g. individual project detail pages) so we never apply the wrong page.
  const pageKeyForPath = (path) =>
    PAGE_MAP[path] ?? (path.endsWith("/") ? PAGE_MAP[path.slice(0, -1)] ?? null : null);

  // Collect every visible text node, in document order, using the exact same
  // filter the admin editor uses so array indices line up 1:1.
  const collectTextNodes = () => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => {
        if (!node.parentElement) return NodeFilter.FILTER_REJECT;
        const tag = node.parentElement.tagName;
        if (tag === "SCRIPT" || tag === "STYLE") return NodeFilter.FILTER_REJECT;
        return node.textContent && node.textContent.trim()
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT;
      },
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    return nodes;
  };

  // Apply the stored text/links/images for this page onto the live DOM.
  const applyPage = (page) => {
    if (!page) return;

    const textNodes = collectTextNodes();
    (page.texts || []).forEach((value, i) => {
      if (textNodes[i] && value != null && textNodes[i].textContent !== value) {
        textNodes[i].textContent = value;
      }
    });

    const links = Array.from(document.querySelectorAll("a[href]"));
    (page.links || []).forEach((value, i) => {
      if (links[i] && value != null && links[i].getAttribute("href") !== value) {
        links[i].setAttribute("href", value);
      }
    });

    const imgs = Array.from(document.querySelectorAll("img"));
    (page.images || []).forEach((value, i) => {
      const img = imgs[i];
      if (!img || !value) return;
      if (value.src && img.getAttribute("src") !== value.src) img.setAttribute("src", value.src);
      if (value.srcset !== undefined && img.getAttribute("srcset") !== value.srcset)
        img.setAttribute("srcset", value.srcset);
      if (value.alt !== undefined && img.getAttribute("alt") !== value.alt)
        img.setAttribute("alt", value.alt);
    });
  };

  // Add brand-new project cards that don't exist in the static export by
  // cloning the last existing card on the page. Off by default: only runs
  // when content.json carries extraProjects for this page key.
  const appendExtraProjects = (pageKey, extras) => {
    if (!Array.isArray(extras) || extras.length === 0) return;

    // Find the repeating card: the anchors that point at a project detail page.
    const anchors = Array.from(
      document.querySelectorAll('a[href*="project-showcase/"]')
    ).filter((a) => /project-showcase\/[a-z0-9-]+\/?$/i.test(a.getAttribute("href") || ""));
    if (anchors.length === 0) return;

    // Each project usually renders as a few responsive variants (desktop /
    // mobile). Clone the whole repeating wrapper of the LAST card so layout,
    // hover states and variants come along for free.
    const lastAnchor = anchors[anchors.length - 1];
    const template = lastAnchor.closest('[data-framer-name="Card Wrap"]') ||
      lastAnchor.closest('[class*="framer-"]')?.parentElement ||
      lastAnchor.parentElement;
    if (!template || !template.parentElement) return;

    extras.forEach((proj) => {
      try {
        const clone = template.cloneNode(true);

        clone.querySelectorAll('a[href*="project-showcase/"]').forEach((a) => {
          if (proj.url) a.setAttribute("href", proj.url);
        });
        clone.querySelectorAll("img").forEach((img) => {
          if (proj.image?.src) img.setAttribute("src", proj.image.src);
          if (proj.image?.srcset) img.setAttribute("srcset", proj.image.srcset);
          if (proj.image?.alt !== undefined) img.setAttribute("alt", proj.image.alt);
        });
        // Title is the first heading-ish text; client + category fill the
        // smaller label lines in card order.
        const heads = clone.querySelectorAll("h1,h2,h3,h4,h5");
        heads.forEach((h) => {
          if (proj.title) h.textContent = proj.title;
        });
        const labels = clone.querySelectorAll('p[data-styles-preset="mbtNsEJPb"]');
        labels.forEach((p, i) => {
          const v = i % 2 === 0 ? proj.client : proj.category;
          if (v) p.textContent = v;
        });

        clone.setAttribute("data-cms-extra", "1");
        template.parentElement.appendChild(clone);
      } catch (err) {
        /* never let one bad card break the page */
      }
    });
  };

  let lastData = null;

  const applyAll = () => {
    if (!lastData) return;
    const pageKey = pageKeyForPath(window.location.pathname);
    if (!pageKey) return;
    applyPage(lastData.pages?.[pageKey]);
    // Only append cards we haven't already appended.
    if (!document.querySelector('[data-cms-extra="1"]')) {
      appendExtraProjects(pageKey, lastData.extraProjects?.[pageKey]);
    }
  };

  const load = async () => {
    try {
      const res = await fetch("/content.json", { cache: "no-store" });
      if (!res.ok) return;
      lastData = await res.json();
    } catch (err) {
      return;
    }

    applyAll();

    // Framer rehydrates client-side after our first pass and can overwrite the
    // text we just set. Re-apply on load and for a short window afterwards,
    // debounced, then stop so we never fight the runtime indefinitely.
    window.addEventListener("load", applyAll);

    let scheduled = false;
    const observer = new MutationObserver(() => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        applyPage(lastData.pages?.[pageKeyForPath(window.location.pathname)]);
      });
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    setTimeout(() => observer.disconnect(), 4000);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", load);
  } else {
    load();
  }
})();
