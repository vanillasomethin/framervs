# Zoho CRM lead integration — setup

There are two separate paths leads can reach Zoho CRM through. Both are already
wired into the code; each just needs its own credentials filled in.

## Path 1 — Web-to-Lead (text only, no attachments)

Used as the automatic fallback if the serverless function below isn't
configured or fails. No server, no OAuth — a plain form POST from the
browser.

1. In Zoho CRM: **Setup → Developer Space → Web Forms** → create a new
   Web-to-Lead form for the **Leads** module (any field selection is fine —
   the code only relies on `Last Name`, `Email`, `Phone`, `Company`,
   `Lead Source`, `Description`).
2. Zoho generates an HTML snippet. From it, copy the two hidden input values:
   - `xnQsjsdp`
   - `xmIwtLD`
3. Paste them into `src/utils/leads.ts`:
   ```ts
   const ZOHO_XNQSJSDP = "...";
   const ZOHO_XMIWTLD = "...";
   ```

## Path 2 — Authenticated API + PDF attachment

Used first, when configured. Runs server-side as a Netlify Function
(`netlify/functions/submit-lead.js`) because attaching a file to a Zoho
record requires an OAuth access token — something that can't be exposed in
client-side JS.

### 1. Create a Self Client in the Zoho API Console

1. Go to <https://api-console.zoho.com/> (or the matching console for your
   data center, e.g. `.in`) and sign in with the CRM account.
2. **Add Client → Self Client**.
3. Under the **Generate Code** tab, set:
   - **Scope**: `ZohoCRM.modules.leads.ALL,ZohoCRM.modules.attachments.ALL`
   - **Time Duration**: 10 minutes (you only need it once)
4. Click **Create**, copy the generated **grant token**.

### 2. Exchange the grant token for a refresh token (one-time)

Run this within the grant token's validity window (replace the bracketed
values, and swap `.com` for your data center's domain if different):

```bash
curl -X POST "https://accounts.zoho.in/oauth/v2/token" \
  -d "code=[GRANT_TOKEN]" \
  -d "client_id=[CLIENT_ID]" \
  -d "client_secret=[CLIENT_SECRET]" \
  -d "redirect_uri=https://www.vanillasometh.in" \
  -d "grant_type=authorization_code"
```

The response includes a `refresh_token` — this does not expire (unless
revoked), so this step only needs to be done once.

### 3. Set Netlify environment variables

In the Netlify dashboard → Site configuration → Environment variables, add:

| Variable | Value |
|---|---|
| `ZOHO_CLIENT_ID` | from the Self Client in step 1 |
| `ZOHO_CLIENT_SECRET` | from the Self Client in step 1 |
| `ZOHO_REFRESH_TOKEN` | from step 2 |
| `ZOHO_ACCOUNTS_DOMAIN` | `https://accounts.zoho.in` (match your CRM's data center — check the domain in your CRM login URL; use `.com` if your org is on the global/US DC) |
| `ZOHO_API_DOMAIN` | `https://www.zohoapis.in` (same data center as above) |

Redeploy the site after adding these — Netlify Functions only pick up new
environment variables on the next build/deploy.

### How it behaves once configured

- `submitLeadWithPdf()` (used by the PDF-download lead gate and the contact
  form) POSTs to `/.netlify/functions/submit-lead`, which creates the Lead via
  Zoho's authenticated REST API and uploads the generated PDF as an
  attachment on that Lead record.
- If the function call fails for any reason (not yet deployed, missing
  credentials, Zoho API error), it automatically falls back to the
  Web-to-Lead path above, so the lead's contact info and estimate details
  still reach Zoho as text — just without the PDF file attached.
