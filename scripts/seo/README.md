# Free SEO operations

This folder contains zero-paid-API workflows for Vanilla & Somethin'. It builds on the existing static HTML, CMS renderer, Search Console OAuth proxy and SEO audit. It does not modify the public design.

## Commands

- `node scripts/seo/audit.mjs`: crawl the configured site (default `https://www.vanillasometh.in`) and write JSON + Markdown reports to `reports/seo/`.
- `node scripts/seo/gsc-report.mjs path/to/search-console.csv`: summarize a Search Console CSV export by query and page, with no Google credentials or paid API.
- `node scripts/seo/content-brief.mjs "keyword phrase"`: print a research-first brief for ChatGPT or Claude. It never publishes generated content.
- `node scripts/seo/schema-check.mjs`: validate JSON-LD in local static HTML files.
- `node scripts/seo/geo-check.mjs`: validate discoverability basics: llms.txt, robots.txt and sitemap.

## Keyword workflow

Export Search Console Performance → Search results → Queries to CSV, then run the GSC report. Update keyword-seed.csv only for terms that map to a real service or genuinely useful article. No fabricated volume or rank figures: this uses first-party Search Console data, not scraped Google SERPs.

## AI content workflow

Generate a brief, then give it to ChatGPT or Claude with verified project facts, source URLs and approved imagery. Cost guides must include date checked, geography, measurement basis, inclusions, exclusions and sourced assumptions. Human review is mandatory. No LLM API key is needed because generation happens in ChatGPT/Claude's existing interface.

## GEO / AI discoverability

Checks validate crawl access and machine-readable navigation. They do not promise inclusion or ranking in ChatGPT, Claude, Gemini or other answer engines. Keep llms.txt accurate and aligned with canonical pages. Do not add blanket AI-crawler allow rules without considering content and licensing preferences.
