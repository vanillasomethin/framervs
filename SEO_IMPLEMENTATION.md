# Local SEO implementation notes ,  Vanilla & Somethin'

## Objective
Build qualified organic visibility for architecture and interior design enquiries in Mangalore / Dakshina Kannada, Kasaragod and other genuinely served areas of coastal Karnataka and Kerala. No implementation can guarantee position one.

## What this branch changes
- Adds an NRI home-design landing page focused on overseas Indian families planning residential projects in the studio’s practical service area.
- Adds/strengthens a dedicated commercial architecture and interiors landing page for commercial buildings, cafes, restaurants, kiosks, showrooms, retail stores, supermarkets, offices and workplaces; links it from the main service page and sitemap.
- Improves the project estimator search entry point: metadata describes its residential, commercial and mixed-use estimate use cases, and service pages explain its preliminary budget-planning role and limitations. Copy explains remote briefing and clearly limits site supervision / construction management claims.
- Replaces the placeholder `/seo` SEO explainer with a public, crawlable studio service landing page.
- Adds distinct location-intent landing pages for Mangalore, Kasaragod, coastal Karnataka and Kerala; each has unique copy, self-canonical, Open Graph, internal links, and truthful LocalBusiness/ProfessionalService schema without invented street addresses, map coordinates, hours, ratings or office locations.
- Replaces the stale sitemap with a sitemap index and separate service, location and portfolio sitemaps.
- Removes the stale `/canonical-url` entry and old hard-coded modification dates.
- Improves `llms.txt` as supplementary machine-readable navigation, not a Google ranking signal.
- Adds a repeatable static audit script for sitemap validity, unique canonical URLs, title/description presence, JSON-LD parseability and required internal pages.
- Keeps the static-export / Netlify build architecture; no client-only metadata injection.

## Important SEO risks identified
- CMS project records include real project-location fields (e.g. Nord Terra House in Kozhikode, Kerala; BNB House in Kadri, Karnataka). Project detail metadata currently contains generic titles and a mismatched generic ArchitecturalBusiness schema block copied across case-study pages. Fix project metadata from CMS records at build time in a follow-up or through a controlled source-export update; do not bulk-rewrite 370 KB Framer pages without exact field mapping.
- Existing business structured data contains unverified address, postal code, coordinates, phone, opening hours, logo URL and a potentially misleading office/service-area representation. This branch deliberately omits those values pending owner verification.
- The business contact details differ in the source: CMS contact phone is +91 7411 32 4448, while exported contact page shows +91 7411349833 and old SEO snippet uses +91 74113 49844. Confirm the public primary number before adding phone schema.
- The practice must verify service coverage in each target region. Avoid implying a staffed branch / office where there is none.
- Ensure every location page is substantial, accurate and useful before indexing; do not create thin doorway pages for every town.

## Recommended launch checklist
1. Verify the official public phone number, business email, Mangalore address, service boundaries and whether Kasaragod is currently serviced.
2. Add project-specific case-study titles, descriptive meta descriptions and Project/CreativeWork schema generated from the actual CMS collection fields. Preserve project URLs.
3. Improve the homepage's single primary H1 and service/location language in Framer itself; exported page currently has multiple visually duplicated H1 tags.
4. Confirm that every link in sitemap returns HTTP 200 and canonical points to itself; remove stale /canonical-url URL and non-www sitemap URLs.
5. Submit sitemap index in Google Search Console and Bing Webmaster Tools; inspect index coverage and query performance.
6. Complete and verify Google Business Profile; keep name, address, phone and categories consistent. Request authentic reviews from actual clients; never fabricate reviews or use review schema for self-serving testimonials.
7. Publish project stories with real location, building type, design brief, constraints, process, original photography and outcomes.
8. Track local-intent queries separately for Mangalore, Kasaragod, coastal Karnataka and Kerala; revise based on Search Console and qualified enquiries.

## Reference projects consulted
- https://github.com/AgriciDaniel/claude-seo ,  technical, content, schema, local/map, backlink, visibility audit concepts.
- https://github.com/every-app/open-seo ,  keyword research, competitors, rank tracking, backlinks and site audit workflow.
- https://github.com/i365dev/awesome-seo ,  Search Console, Google Search Essentials, structured data, crawlability and measurement.


## NRI search strategy
- Dedicated landing page: `/nri-home-design/`, linked from the studio service page, sitemap and `llms.txt`.
- Target intent: NRI / overseas Indian families planning a home or renovation in Mangalore, Dakshina Kannada, Kasaragod and Kerala while based in the GCC, UK, Europe, North America or Australia.
- Page explains online briefing, required site information, design review milestones, nominated local family contact, and the limits of remote delivery. It does not promise construction management, continuous supervision or site visits unless separately agreed.
- Follow-up content should be built around genuine NRI project case studies, documented remote design workflows, project-specific FAQs and actual delivery arrangements. Avoid generic country doorway pages (e.g. one near-identical page per GCC country).

## Competitor benchmark: The Architecture Corporation
Publicly visible signals reviewed in November 2026:
- Official website presents architecture, interior design and featured project/sector content: https://thearchitecturecorporation.com/
- Its LinkedIn company profile describes an Mangaluru practice, founded 2023, with India/UAE service positioning and location entries for Mangaluru and Dubai: https://in.linkedin.com/company/the-architecture-corporation
- Public LinkedIn posts directly address clients living abroad who want to build or renovate in Mangalore, and describe remote coordination and site updates.
- Third-party discovery surfaces include Houzz and Magicpin listings. These are evidence of off-site brand presence, not proof that a particular listing caused a Google ranking.
- The competitor's apparent ranking position and exact SEO tactics cannot be established from a website inspection or search snippets alone. No claims are made about their private Search Console data, paid campaigns, backlink strategy or ranking causality.

### What Vanilla & Somethin' should learn (without copying)
1. Own the NRI intent explicitly with a clear service page and real project proof.
2. Publish a strong case study for each actual NRI commission, stating the client's country only with consent and the project location, scope, process, milestones and delivered outputs.
3. Build accurate business profiles and relevant local/industry citations; keep name, address and phone consistent.
4. Publish useful project stories around Mangalore's climate, materials, planning and local building conditions.
5. Make remote-work promises operationally true: specify communication channels, time-zone meeting windows, approval records, site-visit frequency, responsible parties and exclusions in proposals.
6. Track NRI and local-intent queries separately in Search Console and qualified enquiry records.


## Commercial design and project estimator SEO
- Dedicated commercial landing page: `/commercial-design/`, covering commercial buildings, cafes, restaurants, kiosks, showrooms, retail stores, supermarkets, offices and workplaces.
- The main architecture/interior design page links to commercial design and the estimator; the commercial page links directly to the estimator.
- The estimator app is served under `/estimator/`. It supports residential, commercial and mixed-use project categories, construction/interiors/landscape work scopes, location and area inputs, specification selections, a preliminary cost breakdown, and a separate architect-fee calculator.
- Position estimator outputs as indicative early-stage planning references only, not contractor quotations, BOQs, tender prices or guarantees. Actual costs depend on site conditions, drawings, specifications, consultant scope, equipment and exclusions.
- Keep the estimator's commercial category and supported inputs accurate; do not claim it separately prices every cafe kitchen system, specialist equipment, fire/MEP package, statutory fee or fit-out item unless the calculation engine explicitly models it.
- Add real commercial case studies for hospitality, retail, office and kiosk work as source material becomes available. Each should identify the project type, location, scope, design constraints, delivered services and original imagery with client permission.


## Landscape design, Marian collaboration and digital project delivery
- Added a dedicated `/landscape-design/` service page for gardens, courtyards, terraces, rooftop spaces, planting, hardscape, outdoor lighting and site-responsive landscape concepts.
- Added a `/project-management/` page describing AI-assisted workflows and in-house project dashboards. The copy limits AI to supporting tasks and keeps design judgement, technical review and approvals with the project team.
- Dashboard copy describes project milestones, task ownership, progress updates, review comments, approvals, budget allocations and revisions. It does not claim automatic live tracking; project data reflects updates entered by the team.
- Added a homepage collaboration panel using the Marian logo image hosted on the official Marian Projects website. Public brand naming on the official site is Marian Projects Private Limited. Confirm the exact partnership wording and logo-use permission before production publication.
- Removed the unsupported satisfaction percentage and replaced it with a qualitative client-relationship statement. Keep client satisfaction metrics off the site unless supported by a documented survey method and actual results.
- Remove em dashes from the public homepage and service copy. Preserve a no-em-dash check in the static SEO audit.


## New portfolio and niche search opportunities (November 2026)
- Added draft CMS project records for King Abdullah Park (Riyadh), Aestra Clinic (Riyadh) and Mezze Cafe (Khobar). They remain drafts until the team supplies approved photographs, drawings, accurate project scope, dates, client attribution and publication permission.
- King Abdullah Park's record preserves the known MUGA Court and Football Court shop-drawing/design-coordination appointment for ARSA Contracting Company. The landscape work should be described from the actual package and drawings before publication.
- Expanded the project editor media gallery to support multiple photos, 3D renders, plans, technical drawings and PDF documents. Each asset has a media category and caption/alt text. PDFs are limited to 4 MB and are stored in the site's uploads directory.
- Project pages group media into photography, visualisations, plans, technical drawings and documents. The CMS project record includes search description and project keywords.
- Added service landing pages for home renovation and short-stay accommodation design, plus building permit documentation and licensing coordination.
- Niche targets include whole-home renovation, extensions, apartment renovation, NRI renovation, Airbnb/holiday homes, homestays, serviced villas, clinic design, cafe/restaurant fit-outs, landscape/public realm, building permit drawings, K-SMART building permissions and commercial fit-out documentation.
- Regulatory language is intentionally limited to design documentation and coordination. The studio does not claim to issue licences, certify compliance or guarantee statutory approvals. K-SMART, Karnataka local-authority processes, Kerala Tourism and Saudi Balady/Tourism are authority-led processes whose requirements depend on location and activity.
- Fixed the CMS sitemap generation to create `sitemap-cms.xml` and register it in the sitemap index. The SEO workflow now runs the CMS build before auditing the generated pages and sitemap.


## Free SEO automation system (November 2026)
No paid SEO subscriptions. Everything runs on GitHub Actions, Netlify Functions, Google Search Console and Lighthouse.

### Page metadata (no Framer since November 2026)
The home, showcase, case-study, team and contact pages are built from `site/` (Next.js, static HTML). Their title, description, canonical, Open Graph, JSON-LD and analytics are in `site/seo/<page>.html` and are written into each built page by `scripts/build-site.mjs`. There is no client-side runtime rewriting titles any more, so the static `<head>` is what Google renders. (Before, the Framer runtime replaced titles after hydration and `public/seo-meta.js` had to put them back.)

### Checks
| Check | Where | When |
| --- | --- | --- |
| Static audit: single title/canonical per page, canonical = served URL (trailing slash) and present in a sitemap, unique titles, broken internal links, robots.txt, GA present, JSON-LD validity | `scripts/audit-seo.mjs` | Every PR / push to main |
| Rendered audit: every sitemap URL rendered in Chromium; fails on generic or duplicate titles, missing descriptions, canonical mismatch, redirects, noindex, invalid JSON-LD | `scripts/seo/audit-rendered.mjs` | Every PR (local build), weekly (live site) |
| Lighthouse CI: SEO >= 90 is blocking; performance, accessibility, LCP, CLS, TBT budgets warn | `lighthouserc.json` | Every PR |
| Lighthouse mobile + desktop on key live pages | `scripts/seo/lighthouse-report.mjs` | Weekly |

The weekly workflow (`.github/workflows/seo-monitor.yml`, Mondays 07:47 IST, or run manually) stores `latest.json` and a 52-week `history.json` on the `seo-reports` branch. Netlify does not build that branch.

### Admin > SEO
- **Site health:** latest weekly report: rendered SEO errors to fix first, Lighthouse by page, weekly trend, "Run monitor now" (needs the GitHub token to have *Actions: Read and write*; otherwise run it from the Actions tab).
- **Keyword opportunities:** from Search Console (existing Google connection). Striking-distance queries (position 4 to 20) and page-one results with CTR under half the expected rate, with a suggested action, local/NRI intent filter and CSV export.

### Other fixes in this pass
- Canonicals and `og:url` on Framer pages pointed at slashless URLs that Netlify 301s; now the 200 URL. `/seo` sitemap entry fixed.
- Case-study pages: unique titles and descriptions (five had photography-template placeholder text), `CreativeWork` + `BreadcrumbList` schema, `og:type=article`.
- Removed the legacy Framer head snippet (duplicate tags plus unverified phone/postcode/hours/coordinates that conflicted with the contact page). Add LocalBusiness schema back only with verified NAP that matches Google Business Profile.
- Team page email links were Cloudflare-obfuscated `/cdn-cgi/` URLs that 404 on Netlify; restored to `mailto:`.
- `/canonical-url` (copy of Google's docs, off-topic) removed and 301'd to home.
- Google Analytics added to the 14 SEO landing pages that had none; gtag now loads after first interaction or 3.5 s after page load to reduce main-thread blocking.

### Known content issues (visible copy is in `site/src/components/sites/vanillasomethin/`)
- Case-study body copy still contains photography-template placeholder text: BNB House intro and "Behind the design" (volcanic rock, glaciers, golden hour), Coco Meltdown / Koan / MAK / Pipe Nova intros, Fair-Fly "Bold streetwear" item.
- Mobile LCP on the showcase (9.6 s) and case studies (about 7 s) is caused by 2048 px images served to phones and a 4 MB autoplay hero video on the home page. Lower image sizes and compress the hero video to under 1.5 MB (or use a poster on mobile).
