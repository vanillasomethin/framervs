# Moving to React + Framer components (unframer)

This is the path to **pixel- and motion-exact** parity with the Framer site:
instead of reconstructing animations by hand, we run the *actual* compiled
Framer component code inside a React (Next.js) app, using
[unframer](https://github.com/remorses/unframer).

The repo is already scaffolded for this (Next.js 15 + React 19). What remains
is the part only you can do — it needs your logged-in Framer account — plus
wiring the exported components into pages.

---

## Why some steps are yours

unframer does **not** scrape the published website. It reads the component
JavaScript modules that Framer compiles, and it only learns which modules to
fetch after you:

1. install Framer's **React Export** plugin in the project, and
2. **Publish** the site (Framer only refreshes those modules on publish).

So I can't trigger the export from here — but everything downstream (rendering,
routing, build, deploy) is set up and waiting.

> ⚠️ unframer exports **components, not whole pages**. To get a full page, the
> cleanest approach in Framer is to wrap each page's content in a **Component**
> (or one component per major section — Hero, Works, Services, FAQ, Footer…),
> then select those for export. We then compose them into pages in `app/`.

---

## One-time setup (in Framer — you)

1. Open the project in the Framer editor.
2. **Plugins → Marketplace →** search **"React Export"** (by unframer) and
   install it.
3. Run the plugin. It shows your **project ID** and lets you **select the
   components** to export. Select the page/section components you want.
4. Click **Publish** (top-right) so Framer refreshes the compiled modules.
5. Copy the **project ID** the plugin shows (it looks like a short
   alphanumeric string, e.g. `AbCdEf123`).

> Headless alternative: the plugin step can be replaced with an API key via
> `npx unframer mcp login` (choose "server API mode"). If you'd rather give me a
> Framer API key as a repo secret, I can drive the export from CI instead — tell
> me and I'll wire it up. Treat the key like a password.

## Export the components (either of us)

From the repo root:

```bash
npm install
FRAMER_PROJECT_ID=<your-project-id> npm run framer:export
```

This writes the React components and `styles.css` into `src/framer/`. Re-run it
(or `npm run framer:watch`) whenever you publish changes in Framer.

## Wire components into pages (me)

Once `src/framer/` is populated, I will:

- uncomment the `import "../src/framer/styles.css"` line in `app/layout.tsx`,
- replace the placeholder in `app/page.tsx` (and add `app/contact`,
  `app/estimator`, `app/project-showcase/...`) to render the exported
  components, e.g. `import Home from "../src/framer/home"; <Home.Responsive />`,
- carry over SEO metadata, redirects, and the sitemap.

Send me the contents of `src/framer/` (or just push them) and I'll finish the
wiring and verify each page in a browser.

---

## Local preview & deploy

```bash
npm run dev      # http://localhost:3000
npm run build    # production build
```

**Deploy cutover:** the site currently deploys as the static `public/` folder
(see `netlify.toml`). When the React pages are ready we flip Netlify to a
Next.js build — install `@netlify/plugin-nextjs` and set:

```toml
[build]
  command = "next build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

Until then `netlify.toml` keeps serving the existing static site so nothing
breaks while you do the Framer-side export.
