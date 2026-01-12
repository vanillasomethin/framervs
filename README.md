# framervs

## Canonical domain

Preferred domain: `https://www.vanillasometh.in`.

* **Redirects:** Netlify-style redirects live in `public/_redirects` and force all `http` and non-`www` requests to the preferred domain with 301s.
* **Canonical tags:** Static HTML pages in `public/` contain `<link rel="canonical">` tags that point to the preferred domain plus the current path.
