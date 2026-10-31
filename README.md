# framervs

## Canonical domain

Preferred domain: `https://www.vanillasometh.in`.

* **Redirects:** Netlify-style redirects live in `public/_redirects` and force all `http` and non-`www` requests to the preferred domain with 301s.
* **Canonical tags:** Static HTML pages in `public/` contain `<link rel="canonical">` tags that point to the preferred domain plus the current path.

## Admin (`/admin`)

`https://www.vanillasometh.in/admin` manages the **Journal** (`/blog`), **Projects** (`/projects`) and **Updates** (`/updates`) pages, plus the contact details shown on them.

* Edits are kept in the browser until **Publish**, which commits `public/content.json` and any new photos to GitHub in one commit. That triggers a Netlify deploy, and `scripts/build-cms.mjs` regenerates the pages (about 1–2 minutes).
* Photos are resized in the browser and stored under `public/uploads/`.
* The shared renderer `public/cms/render.mjs` is used by both the build and the admin's live preview.
* The Framer pages (home, showcase, team, contact) are not edited here.

**One-time setup** — in Netlify → Site configuration → Environment variables, add:

| Variable | Value |
|---|---|
| `ADMIN_PASSWORD` | The admin password |
| `GITHUB_TOKEN` | A GitHub fine-grained token with **Contents: Read and write** on `vanillasomethin/framervs` |

Optional: `GITHUB_REPO` (default `vanillasomethin/framervs`), `GITHUB_BRANCH` (default `main`), `SESSION_SECRET`. Redeploy after adding them.
