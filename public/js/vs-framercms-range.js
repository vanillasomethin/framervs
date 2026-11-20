// Framer's CMS files are read in byte ranges (?range=a-b), which Framer's CDN
// answers and an ordinary static host does not. This slices the range out of the
// whole file in the browser, so the CMS-driven pages work on any host.
(() => {
  const nativeFetch = window.fetch.bind(window);
  const files = new Map();
  window.fetch = async (input, init) => {
    try {
      const url = new URL(typeof input === "string" ? input : input.url || String(input), location.href);
      if (url.pathname.endsWith(".framercms") && url.searchParams.has("range")) {
        const ranges = url.searchParams.get("range").split(",").map((r) => r.trim().split("-").map(Number));
        url.search = "";
        if (!files.has(url.pathname)) files.set(url.pathname, nativeFetch(url.href).then((r) => r.arrayBuffer()));
        const whole = await files.get(url.pathname);
        const out = new Uint8Array(ranges.reduce((n, [s, e]) => n + (e - s + 1), 0));
        let offset = 0;
        for (const [s, e] of ranges) { out.set(new Uint8Array(whole, s, e - s + 1), offset); offset += e - s + 1; }
        return new Response(out.buffer, { status: 200 });
      }
    } catch (error) { /* fall through to the real fetch */ }
    return nativeFetch(input, init);
  };
})();
