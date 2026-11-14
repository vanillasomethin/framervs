# Local SEO implementation notes — Vanilla & Somethin'

## Objective
Build qualified organic visibility for architecture and interior design enquiries in Mangalore / Dakshina Kannada, Kasaragod and other genuinely served areas of coastal Karnataka and Kerala. No implementation can guarantee position one.

## What this branch changes
- Adds an NRI home-design landing page focused on overseas Indian families planning residential projects in the studio’s practical service area. Copy explains remote briefing and clearly limits site supervision / construction management claims.
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
- https://github.com/AgriciDaniel/claude-seo — technical, content, schema, local/map, backlink, visibility audit concepts.
- https://github.com/every-app/open-seo — keyword research, competitors, rank tracking, backlinks and site audit workflow.
- https://github.com/i365dev/awesome-seo — Search Console, Google Search Essentials, structured data, crawlability and measurement.
