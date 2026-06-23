(() => {
  "use strict";

  const ADMIN_PASSWORD = "Somethin@22";
  const LOGIN_KEY = "cmsAdminLoggedIn";
  const SETTINGS_KEY = "cmsPublishSettings";

  // Editable pages. `src` is the live static page we render as a skeleton;
  // `key` is the matching entry in content.json -> pages{}.
  const PAGES = [
    { id: "home", label: "Home", src: "/index.html", base: "/", key: "index.html", projects: true },
    { id: "showcase", label: "Projects", src: "/project-showcase/index.html", base: "/project-showcase/", key: "project-showcase/index.html", projects: true },
    { id: "contact", label: "Contact", src: "/contact/index.html", base: "/contact/", key: "contact/index.html", projects: false },
    { id: "team", label: "Team", src: "/team.html", base: "/", key: "team.html", projects: false },
  ];

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  const state = {
    raw: null,        // full content.json object
    activePage: PAGES[0],
    selection: null,  // { type, idx }
    dirty: false,
    settings: { owner: "", repo: "", branch: "main", token: "" },
  };

  /* ---------- status + dirty tracking ---------- */
  const setStatus = (msg, kind = "") => {
    const el = $("#save-status");
    el.textContent = msg;
    el.className = "status " + kind;
  };
  const markDirty = () => {
    state.dirty = true;
    $("#dirty-dot").classList.remove("hidden");
  };
  const clearDirty = () => {
    state.dirty = false;
    $("#dirty-dot").classList.add("hidden");
  };

  /* ---------- content.json helpers ---------- */
  const pageData = () => {
    const key = state.activePage.key;
    state.raw.pages = state.raw.pages || {};
    state.raw.pages[key] = state.raw.pages[key] || { texts: [], links: [], images: [] };
    return state.raw.pages[key];
  };
  const extraForPage = () => {
    const key = state.activePage.key;
    state.raw.extraProjects = state.raw.extraProjects || {};
    state.raw.extraProjects[key] = state.raw.extraProjects[key] || [];
    return state.raw.extraProjects[key];
  };

  /* ---------- iframe skeleton building ---------- */
  // Same accept rule as content-loader.js so indices line up exactly.
  const acceptTextNode = (node) => {
    if (!node.parentElement) return false;
    const tag = node.parentElement.tagName;
    if (tag === "SCRIPT" || tag === "STYLE") return false;
    return !!(node.textContent && node.textContent.trim());
  };

  const buildSkeletonHTML = async (page) => {
    const res = await fetch(page.src, { cache: "no-store" });
    if (!res.ok) throw new Error(`Could not load ${page.src} (${res.status})`);
    let html = await res.text();

    // Drop every script so the Framer runtime can't re-render and fight us.
    html = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
    html = html.replace(/<script\b[^>]*\/>/gi, "");

    const origin = window.location.origin;
    const baseTag = `<base href="${origin}${page.base}">`;
    // Reveal anything Framer would have animated in via JS, and add edit chrome.
    const revealCSS = `<style id="cms-editor-style">
      [data-framer-appear-animation]{opacity:1!important;transform:none!important;}
      [data-cms-text-idx],[data-cms-img-idx]{outline:1px dashed rgba(242,29,47,.45);outline-offset:1px;cursor:pointer;transition:outline-color .12s;}
      [data-cms-text-idx]:hover,[data-cms-img-idx]:hover{outline:2px solid #f21d2f;}
      [data-cms-sel="1"]{outline:2px solid #f21d2f!important;background:rgba(242,29,47,.08);}
    </style>`;

    if (/<head[^>]*>/i.test(html)) {
      html = html.replace(/<head([^>]*)>/i, `<head$1>${baseTag}${revealCSS}`);
    } else {
      html = baseTag + revealCSS + html;
    }
    return html;
  };

  const tagFrameNodes = (doc) => {
    // Text nodes (collect first, then wrap, to preserve indices).
    const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (acceptTextNode(n) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT),
    });
    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);
    textNodes.forEach((node, i) => {
      const span = doc.createElement("span");
      span.setAttribute("data-cms-text-idx", String(i));
      node.parentNode.insertBefore(span, node);
      span.appendChild(node);
    });

    Array.from(doc.querySelectorAll("img")).forEach((img, i) => {
      img.setAttribute("data-cms-img-idx", String(i));
    });
    Array.from(doc.querySelectorAll("a[href]")).forEach((a, i) => {
      a.setAttribute("data-cms-link-idx", String(i));
    });
  };

  const applyStoredToFrame = (doc) => {
    const page = pageData();
    const texts = doc.querySelectorAll("[data-cms-text-idx]");
    (page.texts || []).forEach((v, i) => {
      const el = doc.querySelector(`[data-cms-text-idx="${i}"]`);
      if (el && v != null) el.textContent = v;
    });
    (page.images || []).forEach((v, i) => {
      const el = doc.querySelector(`[data-cms-img-idx="${i}"]`);
      if (el && v) {
        if (v.src) el.setAttribute("src", v.src);
        if (v.srcset !== undefined) el.setAttribute("srcset", v.srcset);
        if (v.alt !== undefined) el.setAttribute("alt", v.alt);
      }
    });
    void texts;
  };

  const wireFrameClicks = (doc) => {
    doc.addEventListener(
      "click",
      (e) => {
        const link = e.target.closest && e.target.closest("a");
        if (link) e.preventDefault();
        const img = e.target.closest && e.target.closest("[data-cms-img-idx]");
        if (img) {
          selectNode(doc, "img", parseInt(img.getAttribute("data-cms-img-idx"), 10));
          return;
        }
        const textEl = e.target.closest && e.target.closest("[data-cms-text-idx]");
        if (textEl) {
          selectNode(doc, "text", parseInt(textEl.getAttribute("data-cms-text-idx"), 10));
        }
      },
      true
    );
  };

  const frameDoc = () => {
    const fr = $("#stage-frame");
    return fr.contentDocument || fr.contentWindow.document;
  };

  const loadFrame = async () => {
    setStatus("Loading preview…");
    const page = state.activePage;
    let html;
    try {
      html = await buildSkeletonHTML(page);
    } catch (err) {
      setStatus(err.message, "err");
      return;
    }
    const fr = $("#stage-frame");
    fr.onload = () => {
      try {
        const doc = frameDoc();
        tagFrameNodes(doc);
        applyStoredToFrame(doc);
        wireFrameClicks(doc);
        setStatus("Ready", "ok");
      } catch (err) {
        setStatus("Preview error: " + err.message, "err");
      }
    };
    fr.srcdoc = html;
    showDefaultPanel();
    renderProjects();
  };

  /* ---------- selection + inline editing ---------- */
  const showPanel = (which) => {
    $("#default-panel").classList.toggle("hidden", which !== "default");
    $("#edit-panel").classList.toggle("hidden", which !== "edit");
    $("#projects-panel").classList.toggle("hidden", which !== "projects");
  };
  const showDefaultPanel = () => {
    if (state.activePage.projects) showPanel("projects");
    else showPanel("default");
    clearFrameSelection();
  };

  const clearFrameSelection = () => {
    const doc = frameDoc();
    if (!doc) return;
    const prev = doc.querySelector('[data-cms-sel="1"]');
    if (prev) prev.removeAttribute("data-cms-sel");
  };

  const selectNode = (doc, type, idx) => {
    clearFrameSelection();
    const selector = type === "img" ? `[data-cms-img-idx="${idx}"]` : `[data-cms-text-idx="${idx}"]`;
    const el = doc.querySelector(selector);
    if (el) el.setAttribute("data-cms-sel", "1");
    state.selection = { type, idx, el };

    showPanel("edit");
    $("#edit-text-field").classList.toggle("hidden", type !== "text");
    $("#edit-img-field").classList.toggle("hidden", type !== "img");
    $("#edit-link-field").classList.add("hidden");

    if (type === "text") {
      $("#edit-title").textContent = "Edit text";
      $("#edit-text").value = el ? el.textContent : "";
      $("#edit-text").focus();
    } else {
      $("#edit-title").textContent = "Edit image";
      $("#edit-img-src").value = el ? el.getAttribute("src") || "" : "";
      $("#edit-img-alt").value = el ? el.getAttribute("alt") || "" : "";
    }
  };

  const applyEdit = () => {
    const sel = state.selection;
    if (!sel) return;
    const page = pageData();
    if (sel.type === "text") {
      const v = $("#edit-text").value;
      if (sel.el) sel.el.textContent = v;
      page.texts = page.texts || [];
      page.texts[sel.idx] = v;
    } else {
      const src = $("#edit-img-src").value.trim();
      const alt = $("#edit-img-alt").value;
      if (sel.el) {
        if (src) sel.el.setAttribute("src", src);
        sel.el.setAttribute("alt", alt);
      }
      page.images = page.images || [];
      const existing = page.images[sel.idx] || {};
      page.images[sel.idx] = { ...existing, src: src || existing.src, alt };
    }
    markDirty();
    setStatus("Edited (not yet published)");
  };

  const revertEdit = () => {
    // Reset the field to what the live static page originally had.
    const sel = state.selection;
    if (!sel || !sel.el) return;
    if (sel.type === "text") $("#edit-text").value = sel.el.textContent;
    else {
      $("#edit-img-src").value = sel.el.getAttribute("src") || "";
      $("#edit-img-alt").value = sel.el.getAttribute("alt") || "";
    }
  };

  /* ---------- projects manager (net-new cards) ---------- */
  const renderProjects = () => {
    if (!state.activePage.projects) return;
    const list = $("#proj-list");
    list.innerHTML = "";
    const extras = extraForPage();
    if (extras.length === 0) {
      const p = document.createElement("p");
      p.className = "muted";
      p.textContent = "No new projects added yet.";
      list.appendChild(p);
    }
    extras.forEach((proj, index) => {
      const card = document.createElement("div");
      card.className = "proj-card";
      card.innerHTML = `
        <div class="row">
          <div><label>Title</label><input data-k="title" value="${esc(proj.title)}"></div>
          <div><label>Client</label><input data-k="client" value="${esc(proj.client)}"></div>
          <div><label>Category</label><input data-k="category" value="${esc(proj.category)}"></div>
          <div><label>Detail page URL</label><input data-k="url" value="${esc(proj.url)}"></div>
          <div><label>Image URL</label><input data-k="imgsrc" value="${esc(proj.image?.src)}"></div>
        </div>
        <button class="rm secondary">Remove</button>`;
      card.querySelectorAll("input").forEach((inp) => {
        inp.addEventListener("input", () => {
          const k = inp.getAttribute("data-k");
          if (k === "imgsrc") proj.image = { ...(proj.image || {}), src: inp.value };
          else proj[k] = inp.value;
          markDirty();
        });
      });
      card.querySelector(".rm").addEventListener("click", () => {
        extras.splice(index, 1);
        markDirty();
        renderProjects();
      });
      list.appendChild(card);
    });
  };

  const esc = (v) => String(v == null ? "" : v).replace(/"/g, "&quot;");

  const addProject = () => {
    extraForPage().push({ title: "New Project", client: "", category: "", url: "./project-showcase/", image: { src: "", alt: "" } });
    markDirty();
    renderProjects();
  };

  /* ---------- publish ---------- */
  const buildOutput = () => JSON.stringify(state.raw, null, 2);

  const publish = async () => {
    const s = state.settings;
    if (!s.owner || !s.repo || !s.token) {
      openSettings();
      setStatus("Add your GitHub token first", "err");
      return;
    }
    setStatus("Publishing…");
    const branch = s.branch || "main";
    const path = "public/content.json";
    const api = `https://api.github.com/repos/${s.owner}/${s.repo}/contents/${path}`;
    const headers = {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${s.token}`,
      "X-GitHub-Api-Version": "2022-11-28",
    };
    try {
      const cur = await fetch(`${api}?ref=${encodeURIComponent(branch)}`, { headers, cache: "no-store" });
      if (!cur.ok) throw new Error("Could not read current content.json from GitHub.");
      const curData = await cur.json();
      const encoded = btoa(unescape(encodeURIComponent(buildOutput())));
      const put = await fetch(api, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          message: "Update site content via Visual CMS",
          content: encoded,
          sha: curData.sha,
          branch,
        }),
      });
      if (!put.ok) {
        const t = await put.text();
        throw new Error("GitHub commit failed: " + t.slice(0, 120));
      }
      clearDirty();
      setStatus("Published ✓", "ok");
    } catch (err) {
      setStatus(err.message, "err");
    }
  };

  /* ---------- settings dialog ---------- */
  const loadSettings = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
      state.settings = { branch: "main", owner: "", repo: "", token: "", ...saved };
    } catch (_) {}
  };
  const openSettings = () => {
    $("#repo-owner").value = state.settings.owner || "";
    $("#repo-name").value = state.settings.repo || "";
    $("#repo-branch").value = state.settings.branch || "main";
    $("#github-token").value = state.settings.token || "";
    $("#settings-dialog").showModal();
  };
  const saveSettings = () => {
    state.settings = {
      owner: $("#repo-owner").value.trim(),
      repo: $("#repo-name").value.trim(),
      branch: $("#repo-branch").value.trim() || "main",
      token: $("#github-token").value.trim(),
    };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));
    $("#settings-dialog").close();
    setStatus("Settings saved", "ok");
  };

  /* ---------- tabs ---------- */
  const renderTabs = () => {
    const wrap = $("#page-tabs");
    wrap.innerHTML = "";
    PAGES.forEach((p) => {
      const btn = document.createElement("button");
      btn.className = "tab" + (p.id === state.activePage.id ? " active" : "");
      btn.textContent = p.label;
      btn.addEventListener("click", async () => {
        if (state.dirty && !confirm("Switch page? Unpublished edits stay saved in this session.")) return;
        state.activePage = p;
        renderTabs();
        await loadFrame();
      });
      wrap.appendChild(btn);
    });
  };

  /* ---------- boot ---------- */
  const startApp = async () => {
    $("#login-card").classList.add("hidden");
    $("#app").classList.remove("hidden");
    loadSettings();
    setStatus("Loading content…");
    try {
      const res = await fetch("/content.json", { cache: "no-store" });
      state.raw = res.ok ? await res.json() : {};
    } catch (_) {
      state.raw = {};
    }
    state.raw.pages = state.raw.pages || {};
    renderTabs();
    await loadFrame();

    $("#apply-edit").addEventListener("click", applyEdit);
    $("#revert-edit").addEventListener("click", revertEdit);
    $("#add-project").addEventListener("click", addProject);
    $("#publish-btn").addEventListener("click", publish);
    $("#settings-btn").addEventListener("click", openSettings);
    $("#settings-save").addEventListener("click", saveSettings);
    $("#settings-close").addEventListener("click", () => $("#settings-dialog").close());
    window.addEventListener("beforeunload", (e) => {
      if (state.dirty) { e.preventDefault(); e.returnValue = ""; }
    });
  };

  const setupLogin = () => {
    const unlock = () => {
      if ($("#admin-password").value.trim() !== ADMIN_PASSWORD) {
        $("#login-error").textContent = "Incorrect password";
        return;
      }
      localStorage.setItem(LOGIN_KEY, "true");
      startApp();
    };
    $("#login-button").addEventListener("click", unlock);
    $("#admin-password").addEventListener("keydown", (e) => { if (e.key === "Enter") unlock(); });
    if (localStorage.getItem(LOGIN_KEY) === "true") startApp();
  };

  setupLogin();
})();
