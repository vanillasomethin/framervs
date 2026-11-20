// Scheduled Google PageSpeed Insights monitoring.
// PAGESPEED_API_KEY stays server-side and is never included in saved reports.
// Optional PAGESPEED_URLS: comma-separated HTTPS URLs on vanillasometh.in.

const { connectLambda, getStore } = require("@netlify/blobs");
const DEFAULT_URLS = ["https://www.vanillasometh.in/"];
const DEVICES = ["mobile", "desktop"];
const HISTORY_LIMIT = 90;
const AUDIT_IDS = [
  "largest-contentful-paint", "first-contentful-paint", "speed-index",
  "total-blocking-time", "cumulative-layout-shift", "interaction-to-next-paint",
  "largest-contentful-paint-element", "render-blocking-resources", "unused-javascript",
  "uses-optimized-images", "uses-responsive-images", "total-byte-weight", "server-response-time",
];

function configuredUrls() {
  const raw = process.env.PAGESPEED_URLS;
  const urls = raw ? raw.split(",").map((v) => v.trim()).filter(Boolean) : DEFAULT_URLS;
  return [...new Set(urls)].map((value) => {
    const url = new URL(value);
    if (url.protocol !== "https:" || !["vanillasometh.in", "www.vanillasometh.in"].includes(url.hostname)) {
      throw new Error("PAGESPEED_URLS may contain only HTTPS URLs on vanillasometh.in.");
    }
    return url.toString();
  });
}

function auditValue(audit) {
  if (!audit) return null;
  return {
    title: audit.title || "",
    displayValue: audit.displayValue || "",
    numericValue: Number.isFinite(audit.numericValue) ? audit.numericValue : null,
    score: Number.isFinite(audit.score) ? audit.score : null,
    details: audit.details && Array.isArray(audit.details.items)
      ? audit.details.items.slice(0, 5).map((item) => ({
          node: item.node && item.node.nodeLabel ? item.node.nodeLabel : undefined,
          url: item.url || (item.source && item.source.url) || undefined,
          totalBytes: Number.isFinite(item.totalBytes) ? item.totalBytes : undefined,
          wastedBytes: Number.isFinite(item.wastedBytes) ? item.wastedBytes : undefined,
        }))
      : undefined,
  };
}

async function runPage(url, strategy, apiKey) {
  const endpoint = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
  endpoint.searchParams.set("url", url);
  endpoint.searchParams.set("strategy", strategy);
  endpoint.searchParams.set("key", apiKey);
  for (const category of ["performance", "accessibility", "best-practices", "seo"]) {
    endpoint.searchParams.append("category", category);
  }
  const response = await fetch(endpoint, { signal: AbortSignal.timeout(50000) });
  if (!response.ok) throw new Error("PageSpeed API returned HTTP " + response.status + " for " + strategy + ".");
  const payload = await response.json();
  const lighthouse = payload.lighthouseResult || {};
  const categories = lighthouse.categories || {};
  const audits = lighthouse.audits || {};
  const score = (name) => Number.isFinite(categories[name] && categories[name].score)
    ? Math.round(categories[name].score * 100) : null;
  const selectedAudits = {};
  for (const id of AUDIT_IDS) selectedAudits[id] = auditValue(audits[id]);
  return {
    url, device: strategy, fetchedAt: new Date().toISOString(),
    scores: {
      performance: score("performance"), accessibility: score("accessibility"),
      bestPractices: score("best-practices"), seo: score("seo"),
    },
    metrics: {
      lcp: auditValue(audits["largest-contentful-paint"]),
      fcp: auditValue(audits["first-contentful-paint"]),
      tbt: auditValue(audits["total-blocking-time"]),
      cls: auditValue(audits["cumulative-layout-shift"]),
      inp: auditValue(audits["interaction-to-next-paint"]),
      speedIndex: auditValue(audits["speed-index"]),
    },
    audits: selectedAudits,
    finalUrl: lighthouse.finalDisplayedUrl || url,
    lighthouseVersion: lighthouse.lighthouseVersion || null,
  };
}

exports.handler = async (event) => {
  const apiKey = process.env.PAGESPEED_API_KEY;
  if (!apiKey) {
    console.error("PageSpeed monitor: PAGESPEED_API_KEY is not configured.");
    return { statusCode: 503, body: "PageSpeed API key is not configured." };
  }
  try {
    const urls = configuredUrls();
    connectLambda(event);
    const store = getStore({ name: "pagespeed" });
    const checks = await Promise.all(urls.flatMap((url) => DEVICES.map(async (device) => {
      try {
        return await runPage(url, device, apiKey);
      } catch (error) {
        return {
          url, device, fetchedAt: new Date().toISOString(),
          error: error.name === "TimeoutError" ? "PageSpeed request timed out." : error.message,
        };
      }
    })));
    const report = {
      id: new Date().toISOString().replace(/[:.]/g, "-"),
      checkedAt: new Date().toISOString(),
      source: "Google PageSpeed Insights API",
      checks,
      failedChecks: checks.filter((check) => check.error).length,
    };
    const previous = await store.getWithMetadata("history", { type: "json" });
    const history = [report, ...((previous && previous.data) || [])].slice(0, HISTORY_LIMIT);
    await Promise.all([store.setJSON("latest", report), store.setJSON("history", history)]);
    console.log("PageSpeed monitor finished: " + (checks.length - report.failedChecks) + "/" + checks.length + " checks succeeded.");
    return {
      statusCode: report.failedChecks === checks.length ? 502 : 200,
      body: JSON.stringify({ ok: report.failedChecks < checks.length, checkedAt: report.checkedAt, checks: checks.length, failedChecks: report.failedChecks }),
    };
  } catch (error) {
    console.error("PageSpeed monitor failed:", error.message);
    return { statusCode: 500, body: "PageSpeed monitoring failed. Check Netlify function logs." };
  }
};
