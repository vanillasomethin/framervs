# Google Search Console integration

This adds a server-side OAuth flow and reporting proxy for the private /admin area. Business Profile API access is deliberately not included.

## Existing Google Cloud configuration

Use the existing OAuth web client and the read-only scope:
`https://www.googleapis.com/auth/webmasters.readonly`

The exact authorised redirect URI must be:
`https://www.vanillasometh.in/.netlify/functions/google-oauth-callback`

## Netlify environment variables

Keep the existing `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`. Add:

| Variable | Value |
|---|---|
| `GOOGLE_REDIRECT_URI` | `https://www.vanillasometh.in/.netlify/functions/google-oauth-callback` |
| `GOOGLE_REFRESH_TOKEN` | Added after completing the one-time OAuth flow |

Do not put any of these values in public files, GitHub, CMS content, or browser localStorage. Redeploy after changing environment variables.

## One-time connection

1. Log in at `/admin`.
2. Start the Google Search Console connection from the admin interface (once the UI control is enabled).
3. Google returns to the callback and displays the refresh token once.
4. Copy it directly into Netlify as `GOOGLE_REFRESH_TOKEN`, save, and redeploy.
5. In Google Cloud OAuth consent screen, the app is currently External / Testing. Refresh tokens for a testing app can expire after 7 days; expect to reconnect when that happens. Publishing/verification requirements depend on the app's final use and scopes.

## API

- `google-oauth-start`: admin-session protected; creates a short-lived signed state cookie and PKCE verifier.
- `google-oauth-callback`: validates state and PKCE, exchanges the code, and displays the refresh token once for manual transfer to Netlify.
- `search-console`: admin-session protected; refreshes Google access tokens server-side and exposes only Search Console property names and analytics rows.
- Supported query dimensions: date, query, page, country and device (up to two dimensions per request).

No Business Profile data is fetched or represented as connected.
