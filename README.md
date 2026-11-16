# framervs

## Canonical domain

Preferred domain: `https://www.vanillasometh.in`.

* **Redirects:** Netlify-style redirects live in `public/_redirects` and force all `http` and non-`www` requests to the preferred domain with 301s.
* **Canonical tags:** Static HTML pages in `public/` contain `<link rel="canonical">` tags that point to the preferred domain plus the current path.

## Admin (`/admin`)

One private admin for the whole studio: **project management, client onboarding, site management and the website**.

### Studio (private)
| Area | What it does |
|---|---|
| **Dashboard** | Today's focus, upcoming dates, project health, onboarding funnel, team workload, activity, website status |
| **Projects** | Board by stage (drag to move), table, and a page per project: stage stepper, KPIs, milestones, tasks, site, links, activity. Can copy a project to the website portfolio as a draft (public-safe facts only) |
| **Tasks** | One set of tasks as a Board, List or Calendar, with quick add, filters and checklists |
| **Clients** | Onboarding pipeline (Enquiry → Kick-off), a checklist per client, and a **private brief-form link** (`/onboard/?t=…`) the client fills in themselves, then one click to create a project from the brief |
| **Site management** | Visit logs with photos, planned visits, snag lists, and an overview that flags live sites nobody has visited lately |
| **Settings** | Team, onboarding checklist, visit reminder threshold, JSON backup / restore, sample data |

`Ctrl/Cmd + K` opens a quick search and command palette.

Studio data (clients, fees, site photos…) is stored in **Netlify Blobs**, never in this repository. `public/content.json` is public, so nothing private goes there. Saves are conflict-safe (ETag compare-and-set), and other devices pick up changes when the tab regains focus. Download a backup from Settings now and then; site photos are not included in backups.

### Website (public)
**Journal** (`/blog`), **Portfolio** (`/projects`) and **Updates** (`/updates`) are generated at build time from `public/content.json`. Edits stay in the browser until **Publish**, which commits the content and any new photos to GitHub in one commit; Netlify then deploys (about 1–2 minutes). **Website controls** shows live page health checks and a Rebuild button.

* Photos are resized in the browser and stored under `public/uploads/`.
* The shared renderer `public/cms/render.mjs` is used by both the build and the admin's live preview.
* The Framer pages (home, showcase, team, contact) are not edited here.

### Setup — Netlify → Site configuration → Environment variables

| Variable | Needed for | Value |
|---|---|---|
| `ADMIN_PASSWORD` | Everything | The admin password |
| `GITHUB_TOKEN` | Publishing website content | GitHub fine-grained token with **Contents: Read and write** on `vanillasomethin/framervs` |
| `NETLIFY_BUILD_HOOK` | "Rebuild website" button (optional) | A Netlify build hook URL (Build & deploy → Build hooks) |

Optional: `GITHUB_REPO` (default `vanillasomethin/framervs`), `GITHUB_BRANCH` (default `main`), `SESSION_SECRET`, `SITE_URL` (for health checks). The studio works with only `ADMIN_PASSWORD`; add `GITHUB_TOKEN` when you want to publish website content. Redeploy after adding variables.

Functions: `netlify/functions/cms.js` (login + website publishing), `studio.js` (private studio API), `onboard.js` (public brief form endpoint). Their only dependency, `@netlify/blobs`, is listed in `netlify/functions/package.json`.

### Tests
`node scripts/test-studio-api.cjs` checks the studio and onboarding functions (auth, conflict-safe saves, photos, brief links, backup/restore) with no network.
