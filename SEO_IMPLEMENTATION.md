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
