// Creates a Zoho CRM Lead via the authenticated REST API and attaches the
// generated estimate PDF to it. Zoho's no-auth Web-to-Lead form (used by
// vs-calculator/src/utils/leads.ts as the client-side path) can't carry file
// attachments — this function is what gets the actual PDF into Zoho.
//
// Required Netlify environment variables (Site configuration -> Environment variables):
//   ZOHO_CLIENT_ID       - from a Self Client / Server-based app in the Zoho API Console
//   ZOHO_CLIENT_SECRET   - from the same API Console app
//   ZOHO_REFRESH_TOKEN   - generated once via the OAuth consent flow (doesn't expire until revoked)
//   ZOHO_ACCOUNTS_DOMAIN - optional, defaults to https://accounts.zoho.in
//   ZOHO_API_DOMAIN      - optional, defaults to https://www.zohoapis.in
//
// Match the two domains to your CRM's actual data center (check the domain
// your Zoho CRM login URL uses — .com, .in, .eu, etc). See
// vs-calculator/ZOHO_LEAD_SETUP.md for the full credential setup walkthrough.

const ZOHO_ACCOUNTS_DOMAIN = process.env.ZOHO_ACCOUNTS_DOMAIN || "https://accounts.zoho.in";
const ZOHO_API_DOMAIN = process.env.ZOHO_API_DOMAIN || "https://www.zohoapis.in";

async function getAccessToken() {
  const { ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REFRESH_TOKEN } = process.env;
  if (!ZOHO_CLIENT_ID || !ZOHO_CLIENT_SECRET || !ZOHO_REFRESH_TOKEN) {
    throw new Error("Zoho OAuth credentials are not configured on this Netlify site.");
  }

  const params = new URLSearchParams({
    refresh_token: ZOHO_REFRESH_TOKEN,
    client_id: ZOHO_CLIENT_ID,
    client_secret: ZOHO_CLIENT_SECRET,
    grant_type: "refresh_token",
  });

  const res = await fetch(`${ZOHO_ACCOUNTS_DOMAIN}/oauth/v2/token?${params.toString()}`, {
    method: "POST",
  });
  const data = await res.json();
  if (!data.access_token) {
    throw new Error(`Zoho token refresh failed: ${JSON.stringify(data)}`);
  }
  return data.access_token;
}

function buildDescription(payload) {
  const { estimate, message } = payload;
  const lines = [];
  if (estimate) {
    lines.push(`Project type: ${estimate.projectType || "-"}`);
    lines.push(`Work types: ${(estimate.workTypes || []).join(", ") || "-"}`);
    lines.push(`Location: ${estimate.city || "-"}, ${estimate.state || "-"}`);
    lines.push(`Area: ${estimate.area || "-"} ${estimate.areaUnit || ""}`);
    lines.push(`Estimated total: Rs. ${Math.round(estimate.totalCost || 0).toLocaleString("en-IN")}`);
    if (estimate.categoryBreakdown) {
      const c = estimate.categoryBreakdown;
      lines.push(
        `Breakdown: Construction Rs.${c.construction || 0}, Core Rs.${c.core || 0}, ` +
          `Finishes Rs.${c.finishes || 0}, Interiors Rs.${c.interiors || 0}, Fees & Tax Rs.${c.fees || 0}`
      );
    }
    if (estimate.timeline) {
      lines.push(`Estimated timeline: ${estimate.timeline.totalMonths || "-"} months`);
    }
  }
  if (message) lines.push(`Message: ${message}`);
  return lines.join("\n");
}

async function createLead(accessToken, payload) {
  const { name, email, phone } = payload;
  const trimmedName = (name || "Website Lead").trim();
  const parts = trimmedName.split(" ");
  const firstName = parts.length > 1 ? parts.slice(0, -1).join(" ") : undefined;
  const lastName = parts.length > 1 ? parts[parts.length - 1] : trimmedName;

  const body = {
    data: [
      {
        Last_Name: lastName,
        ...(firstName ? { First_Name: firstName } : {}),
        Email: email,
        Phone: phone,
        Company: "Estimator Lead",
        Lead_Source: "Website Estimator",
        Description: buildDescription(payload),
      },
    ],
  };

  const res = await fetch(`${ZOHO_API_DOMAIN}/crm/v2/Leads`, {
    method: "POST",
    headers: {
      Authorization: `Zoho-oauthtoken ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  const result = data && data.data && data.data[0];
  if (!result || result.status !== "success") {
    throw new Error(`Zoho lead creation failed: ${JSON.stringify(data)}`);
  }
  return result.details.id;
}

async function attachPdf(accessToken, leadId, pdfBase64, fileName) {
  const buffer = Buffer.from(pdfBase64, "base64");
  const form = new FormData();
  form.append("file", new Blob([buffer], { type: "application/pdf" }), fileName || "estimate.pdf");

  const res = await fetch(`${ZOHO_API_DOMAIN}/crm/v2/Leads/${leadId}/Attachments`, {
    method: "POST",
    headers: {
      Authorization: `Zoho-oauthtoken ${accessToken}`,
    },
    body: form,
  });

  const data = await res.json();
  const result = data && data.data && data.data[0];
  if (!result || result.code !== "SUCCESS") {
    throw new Error(`Zoho attachment upload failed: ${JSON.stringify(data)}`);
  }
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, body: "Invalid JSON" };
  }

  if (!payload.email && !payload.phone) {
    return { statusCode: 400, body: "email or phone is required" };
  }

  try {
    const accessToken = await getAccessToken();
    const leadId = await createLead(accessToken, payload);

    if (payload.pdfBase64) {
      await attachPdf(accessToken, leadId, payload.pdfBase64, payload.fileName);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, leadId }),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 502,
      body: JSON.stringify({ ok: false, error: err.message }),
    };
  }
};
