(function () {
  "use strict";

  var mount = document.getElementById("vs-quote-compare");
  if (!mount) return;

  var KEY = "vs-quote-compare-v1";
  var MIN_Q = 2;
  var MAX_Q = 3;

  var ITEMS = [
    ["basis", "Measurement basis"], ["foundation", "Foundation and excavation assumptions"],
    ["structure", "Structural steel and concrete grade"], ["masonry", "Masonry and plastering"],
    ["waterproofing", "Waterproofing"], ["flooring", "Flooring and skirting"],
    ["doors", "Doors and windows"], ["electrical", "Electrical points, wiring and fittings"],
    ["plumbing", "Plumbing and sanitaryware"], ["painting", "Painting"],
    ["kitchen", "Kitchen platform and utility"], ["compound", "Compound wall and gate"],
    ["water", "Sump, septic tank or STP, borewell"], ["site", "Site development and drainage"],
    ["approvals", "Approvals, utility connections and fees"], ["tax", "Taxes (GST) and payment schedule"]
  ];
  var STATUS = [["", "Not marked"], ["in", "Included"], ["out", "Excluded"], ["unclear", "Unclear"]];
  var BASES = ["Built-up area", "Plinth area", "Carpet area", "Not stated"];
  var NUMBER_FIELDS = [["Rate per sq ft (₹)", "rate"], ["Area in sq ft", "area"], ["Quoted total in ₹ (optional)", "total"]];

  var CSS = [
    ".vqc{color:var(--fg);font:inherit}.vqc-bar{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 16px}",
    ".vqc-btn{min-height:40px;padding:8px 14px;border:1px solid var(--line);border-radius:6px;background:transparent;color:var(--fg);font:inherit;cursor:pointer}",
    ".vqc-btn:hover{border-color:var(--accent);color:var(--accent)}.vqc-btn:disabled{opacity:.45;cursor:not-allowed}",
    ".vqc-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin:0 0 20px}",
    ".vqc-card{border:1px solid var(--line);border-radius:8px;padding:12px;display:flex;flex-direction:column;gap:8px}",
    ".vqc-head{display:flex;justify-content:space-between;align-items:center;gap:8px}.vqc-head h3{margin:0;font-size:1rem;color:var(--fg)}",
    ".vqc-field{display:flex;flex-direction:column;gap:4px;font-size:.875rem;color:var(--muted)}",
    ".vqc-in{background:transparent;border:1px solid var(--line);border-radius:6px;color:var(--fg);font:inherit;min-height:40px;padding:6px 10px;box-sizing:border-box;width:100%}",
    ".vqc-in:focus{outline:2px solid var(--accent);outline-offset:1px}textarea.vqc-in{min-height:72px;resize:vertical}",
    ".vqc-scroll{overflow-x:auto;margin:0 0 20px;border:1px solid var(--line);border-radius:8px}",
    ".vqc-table{border-collapse:collapse;width:100%;min-width:560px}",
    ".vqc-table th,.vqc-table td{border-bottom:1px solid var(--line);padding:8px 10px;text-align:left;vertical-align:middle}",
    ".vqc-table thead th{color:var(--muted);font-size:.875rem}.vqc-table tbody th{font-weight:400;color:var(--fg);min-width:200px}",
    ".vqc-sticky{position:sticky;left:0;background:var(--bg);z-index:1}.vqc-sum th,.vqc-sum td{font-size:.9rem}",
    ".vqc-insights{border:1px solid var(--line);border-left:3px solid var(--accent);border-radius:6px;padding:12px 16px;margin:0 0 16px}",
    ".vqc-insights p{margin:0 0 6px}.vqc-insights p:last-child{margin-bottom:0}.vqc-note{font-size:.875rem;color:var(--muted);margin:12px 0 0}",
    "@media print{.vqc-bar,.vqc-btn,.vqc-head .vqc-btn{display:none!important}",
    ".vqc,.vqc *{background:#fff!important;color:#000!important}.vqc-in,.vqc-scroll{border-color:#000!important}",
    ".vqc-scroll{overflow:visible}.vqc-table{min-width:0}.vqc-sticky{position:static}.vqc-card{break-inside:avoid}}"
  ].join("\n");

  var state = null;
  var saveTimer = null;
  var ui = {};
  function emptyQuote(name) {
    var items = {};
    ITEMS.forEach(function (it) { items[it[0]] = ""; });
    return { name: name, rate: "", area: "", basis: "Not stated", total: "", items: items, notes: "" };
  }
  function freshState() {
    return { v: 1, quotes: [emptyQuote("Quotation A"), emptyQuote("Quotation B")] };
  }
  function isQuote(q) {
    if (!q || typeof q.name !== "string" || typeof q.notes !== "string" || !q.items) return false;
    if (BASES.indexOf(q.basis) === -1) return false;
    return ITEMS.every(function (it) {
      var v = q.items[it[0]];
      return v === "" || v === "in" || v === "out" || v === "unclear";
    });
  }
  function loadState() {
    try {
      var s = JSON.parse(window.localStorage.getItem(KEY));
      if (!s || s.v !== 1 || !Array.isArray(s.quotes)) return freshState();
      if (s.quotes.length < MIN_Q || s.quotes.length > MAX_Q || !s.quotes.every(isQuote)) return freshState();
      s.quotes.forEach(function (q) {
        ["rate", "area", "total"].forEach(function (k) { q[k] = q[k] == null ? "" : String(q[k]); });
      });
      return s;
    } catch (e) {
      return freshState();
    }
  }
  function schedulePersist() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      try { window.localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* keep in memory */ }
    }, 300);
  }
  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function button(text, onClick) {
    var b = el("button", "vqc-btn", text);
    b.type = "button";
    b.addEventListener("click", onClick);
    return b;
  }
  function field(labelText, control) {
    var wrap = el("label", "vqc-field");
    wrap.appendChild(el("span", null, labelText));
    wrap.appendChild(control);
    return wrap;
  }
  function select(options, value, onChange, ariaLabel) {
    var sel = el("select", "vqc-in");
    if (ariaLabel) sel.setAttribute("aria-label", ariaLabel);
    options.forEach(function (o) {
      var opt = el("option", null, o[1]);
      opt.value = o[0];
      opt.selected = o[0] === value;
      sel.appendChild(opt);
    });
    sel.addEventListener("change", function () { onChange(sel.value); });
    return sel;
  }
  function numberInput(value, onInput) {
    var c = el("input", "vqc-in");
    c.type = "number";
    c.min = "0";
    c.step = "any";
    c.setAttribute("inputmode", "decimal");
    c.value = value;
    c.addEventListener("input", function () { onInput(c.value); });
    return c;
  }
  function toNumber(v) {
    if (v === "" || v == null) return null;
    var n = Number(v);
    return isFinite(n) ? n : null;
  }
  function formatTotal(q) {
    var quoted = toNumber(q.total);
    if (quoted !== null) return "₹" + quoted.toLocaleString("en-IN");
    var rate = toNumber(q.rate);
    var area = toNumber(q.area);
    if (rate !== null && area !== null) {
      return "Computed total: ₹" + Math.round(rate * area).toLocaleString("en-IN");
    }
    return "Not entered";
  }
  function countItems(q, value) {
    return ITEMS.filter(function (it) { return q.items[it[0]] === value; }).length;
  }
  function started(q) {
    if (q.rate !== "" || q.area !== "" || q.total !== "") return true;
    return ITEMS.some(function (it) { return q.items[it[0]] !== ""; });
  }
  function renderCards() {
    ui.cards.textContent = "";
    state.quotes.forEach(function (q, i) {
      var card = el("section", "vqc-card");
      var head = el("div", "vqc-head");
      var title = el("h3", null, q.name);
      head.appendChild(title);
      var rm = null;
      if (i >= MIN_Q) {
        rm = button("Remove", function () { removeQuote(i); });
        rm.setAttribute("aria-label", "Remove " + q.name);
        head.appendChild(rm);
      }
      card.appendChild(head);

      var nameIn = el("input", "vqc-in");
      nameIn.type = "text";
      nameIn.value = q.name;
      nameIn.addEventListener("input", function () {
        q.name = nameIn.value;
        title.textContent = q.name;
        if (rm) rm.setAttribute("aria-label", "Remove " + q.name);
        update();
      });
      card.appendChild(field("Contractor name", nameIn));

      NUMBER_FIELDS.forEach(function (f) {
        card.appendChild(field(f[0], numberInput(q[f[1]], function (v) {
          q[f[1]] = v;
          update();
        })));
      });

      var bases = BASES.map(function (b) { return [b, b]; });
      card.appendChild(field("Area basis", select(bases, q.basis, function (v) {
        q.basis = v;
        update();
      })));

      var notes = el("textarea", "vqc-in");
      notes.value = q.notes;
      notes.addEventListener("input", function () {
        q.notes = notes.value;
        schedulePersist();
      });
      card.appendChild(field("Notes", notes));

      ui.cards.appendChild(card);
    });
  }
  function cell(tag, cls, text, scope) {
    var node = el(tag, cls, text);
    if (scope) node.scope = scope;
    return node;
  }
  function renderTable() {
    ui.table.textContent = "";

    var headRow = el("tr");
    headRow.appendChild(cell("th", "vqc-sticky", "Item", "col"));
    state.quotes.forEach(function (q) { headRow.appendChild(cell("th", null, q.name, "col")); });
    ui.table.appendChild(el("thead")).appendChild(headRow);

    var tbody = el("tbody");
    ITEMS.forEach(function (it) {
      var row = el("tr");
      row.appendChild(cell("th", "vqc-sticky", it[1], "row"));
      state.quotes.forEach(function (q) {
        var td = el("td");
        td.appendChild(select(STATUS, q.items[it[0]], function (v) {
          q.items[it[0]] = v;
          update();
        }, it[1] + " for " + q.name));
        row.appendChild(td);
      });
      tbody.appendChild(row);
    });

    var summaries = [
      ["Included (count)", function (q) { return countItems(q, "in"); }],
      ["Excluded (count)", function (q) { return countItems(q, "out"); }],
      ["Unclear (count)", function (q) { return countItems(q, "unclear"); }],
      ["Not marked (count)", function (q) { return countItems(q, ""); }],
      ["Quoted total", formatTotal],
      ["Rate per sq ft", function (q) { return toNumber(q.rate) === null ? "Not entered" : "₹" + toNumber(q.rate).toLocaleString("en-IN"); }]
    ];
    summaries.forEach(function (s) {
      var row = el("tr", "vqc-sum");
      row.appendChild(cell("th", "vqc-sticky", s[0], "row"));
      state.quotes.forEach(function (q) {
        row.appendChild(el("td", null, String(s[1](q))));
      });
      tbody.appendChild(row);
    });
    ui.table.appendChild(tbody);
  }
  function computeInsights() {
    var quotes = state.quotes;
    var out = [];
    var bases = [];

    quotes.forEach(function (q) {
      if (q.basis !== "Not stated" && bases.indexOf(q.basis) === -1) bases.push(q.basis);
      if (q.basis === "Not stated" && started(q)) out.push(q.name + " does not state its area basis.");
    });
    if (bases.length > 1) {
      out.unshift("The quotations use different area bases. Convert them to the same basis before comparing rates.");
    }

    var differing = [];
    ITEMS.forEach(function (it) {
      var id = it[0];
      var inList = quotes.filter(function (q) { return q.items[id] === "in"; });
      var notList = quotes.filter(function (q) { return q.items[id] === "out" || q.items[id] === "unclear"; });
      if (inList.length && notList.length) {
        differing.push(it[1] + ": included by " + inList.map(function (q) { return q.name; }).join(", ") +
          ", not clearly included by " + notList.map(function (q) { return q.name; }).join(", ") + ".");
      }
    });
    out = out.concat(differing.slice(0, 4));
    if (differing.length > 4) out.push("and " + (differing.length - 4) + " more items differ.");

    quotes.forEach(function (q) {
      var n = countItems(q, "unclear");
      if (n >= 3) out.push(q.name + " has " + n + " unclear items. Ask for these in writing before comparing price.");
    });

    if (out.length === 0) {
      out.push("Mark each item as included, excluded or unclear to see where the quotations differ.");
    }
    return out.slice(0, 6);
  }
  function update() {
    renderTable();
    ui.insights.textContent = "";
    computeInsights().forEach(function (s) {
      ui.insights.appendChild(el("p", null, s));
    });
    ui.addBtn.disabled = state.quotes.length >= MAX_Q;
    schedulePersist();
  }
  function addQuote() {
    if (state.quotes.length >= MAX_Q) return;
    state.quotes.push(emptyQuote("Quotation " + String.fromCharCode(65 + state.quotes.length)));
    renderCards();
    update();
  }
  function removeQuote(index) {
    if (index < MIN_Q || index >= state.quotes.length) return;
    state.quotes.splice(index, 1);
    renderCards();
    update();
  }
  function clearAll() {
    if (!window.confirm("Clear all quotations and start again?")) return;
    clearTimeout(saveTimer);
    state = freshState();
    try { window.localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
    renderCards();
    update();
  }
  function buildShell() {
    if (!document.getElementById("vqc-style")) {
      var style = el("style");
      style.id = "vqc-style";
      style.textContent = CSS;
      document.head.appendChild(style);
    }

    mount.textContent = "";
    mount.className = "vqc";
    var bar = el("div", "vqc-bar");
    ui.addBtn = button("Add quotation", addQuote);
    bar.appendChild(ui.addBtn);
    bar.appendChild(button("Print or save as PDF", function () { window.print(); }));
    bar.appendChild(button("Clear all", clearAll));

    ui.cards = el("div", "vqc-cards");
    ui.insights = el("div", "vqc-insights");
    ui.insights.setAttribute("role", "status");
    ui.insights.setAttribute("aria-live", "polite");
    var scroll = el("div", "vqc-scroll");
    ui.table = el("table", "vqc-table");
    scroll.appendChild(ui.table);

    mount.appendChild(bar);
    mount.appendChild(ui.cards);
    mount.appendChild(ui.insights);
    mount.appendChild(scroll);
    mount.appendChild(el("p", "vqc-note", "Your entries are stored only in this browser. Nothing is uploaded."));
  }

  state = loadState();
  buildShell();
  renderCards();
  update();
})();
