import { ProjectEstimate, ComponentOption } from "@/types/estimator";

// ─────────────────────────────────────────────────────────────────────────────
// ⚠️ TODO(vanillasomethin): paste these from your Zoho CRM Web-to-Lead form
// (Zoho CRM → Setup → Developer Space → APIs → Web-to-Lead Form, or copy them
//  from the hidden <input> fields inside the generated form HTML).
//
//   - xnQsjsdp : the form identifier   → ZOHO_XNQSJSDP below
//   - xmIwtLD  : the form auth token    → ZOHO_XMIWTLD below
//
// Until both are filled, submitLead() will console.warn and resolve gracefully
// (so the site keeps working). Leads will NOT reach Zoho until you paste them.
// ─────────────────────────────────────────────────────────────────────────────
const ZOHO_WEBTOLEAD_ACTION = "https://crm.zoho.com/crm/WebToLeadForm";
const ZOHO_XNQSJSDP = "PASTE_xnQsjsdp_VALUE"; // form identifier
const ZOHO_XMIWTLD = "PASTE_xmIwtLD_VALUE"; // form auth token

// actionType "Leads" base64-encoded — constant for all Web-to-Lead Lead forms.
const ZOHO_ACTION_TYPE = "TGVhZHM=";
// Where Zoho redirects after submit. Irrelevant for no-cors fetch, but required
// by the Web-to-Lead spec.
const ZOHO_RETURN_URL = "https://www.vanillasometh.in";

const PLACEHOLDER_TOKENS = ["PASTE_xnQsjsdp_VALUE", "PASTE_xmIwtLD_VALUE"];

export interface LeadEstimateSnapshot {
  totalCost: number;
  projectType: string;
  workTypes?: string[];
  city: string;
  state: string;
  area: number;
  areaUnit: string;
  categoryBreakdown: ProjectEstimate["categoryBreakdown"];
  timeline: ProjectEstimate["timeline"];
  /** Optional selected components map (name → quality level). */
  selectedComponents?: Array<{ name: string; level: ComponentOption }>;
}

export interface LeadPayload {
  name: string;
  email: string;
  phone: string;
  preferredContact?: "phone" | "email" | "whatsapp";
  preferredTime?: string;
  message?: string;
  /** Full estimate snapshot embedded as text into the lead Description. */
  estimate: LeadEstimateSnapshot;
}

export interface LeadPayloadWithPdf extends LeadPayload {
  /** Base64-encoded PDF bytes (no data-URI prefix), if available. */
  pdfBase64?: string;
  fileName?: string;
}

const formatINR = (amount: number): string =>
  `Rs. ${Math.round(amount).toLocaleString("en-IN")}`;

/** Build a complete multi-line Description text containing every detail. */
const buildDescription = (payload: LeadPayload): string => {
  const { estimate } = payload;
  const lines: string[] = [];

  lines.push("=== CONTACT ===");
  lines.push(`Name: ${payload.name}`);
  lines.push(`Email: ${payload.email}`);
  lines.push(`Phone: ${payload.phone}`);
  if (payload.preferredContact) lines.push(`Preferred contact: ${payload.preferredContact}`);
  if (payload.preferredTime) lines.push(`Preferred time: ${payload.preferredTime}`);
  if (payload.message) lines.push(`Message: ${payload.message}`);

  lines.push("");
  lines.push("=== ESTIMATE ===");
  lines.push(`Total cost (incl. GST): ${formatINR(estimate.totalCost)}`);
  lines.push(`Project type: ${estimate.projectType}`);
  if (estimate.workTypes && estimate.workTypes.length > 0) {
    lines.push(`Type of work: ${estimate.workTypes.join(", ")}`);
  }
  lines.push(`Location: ${estimate.city}, ${estimate.state}`);
  lines.push(`Area: ${estimate.area.toLocaleString("en-IN")} ${estimate.areaUnit}`);

  lines.push("");
  lines.push("=== COST BREAKDOWN ===");
  lines.push(`Base Construction: ${formatINR(estimate.categoryBreakdown.construction)}`);
  lines.push(`Core Components (MEP): ${formatINR(estimate.categoryBreakdown.core)}`);
  lines.push(`Finishes & Surfaces: ${formatINR(estimate.categoryBreakdown.finishes)}`);
  lines.push(`Interiors & Furnishings: ${formatINR(estimate.categoryBreakdown.interiors)}`);

  lines.push("");
  lines.push("=== TIMELINE ===");
  lines.push(`Total: ${estimate.timeline.totalMonths} months`);
  lines.push(`  Planning & Design: ${estimate.timeline.phases.planning} months`);
  lines.push(`  Construction: ${estimate.timeline.phases.construction} months`);
  lines.push(`  Interiors & Finishing: ${estimate.timeline.phases.interiors} months`);

  if (estimate.selectedComponents && estimate.selectedComponents.length > 0) {
    lines.push("");
    lines.push("=== SELECTED COMPONENTS ===");
    estimate.selectedComponents
      .filter((c) => c.level && c.level !== "none")
      .forEach((c) => lines.push(`${c.name}: ${c.level}`));
  }

  lines.push("");
  lines.push("(Note: PDF estimate generated client-side; full breakdown above.)");

  return lines.join("\n");
};

/**
 * Submits a lead to Zoho CRM via the Web-to-Lead form endpoint.
 *
 * Static-site friendly: posts application/x-www-form-urlencoded with mode:"no-cors"
 * (Zoho does not return CORS headers, so the response is opaque). A non-thrown
 * fetch is treated as success.
 *
 * NOTE: Zoho Web-to-Lead does NOT support file attachments — the PDF file itself
 * cannot be pushed this way. The complete estimate breakdown is embedded as text
 * in the lead Description instead. Attaching the actual PDF would require a
 * server-side OAuth flow (out of scope for a static site).
 */
export async function submitLead(payload: LeadPayload): Promise<void> {
  if (PLACEHOLDER_TOKENS.includes(ZOHO_XNQSJSDP) || PLACEHOLDER_TOKENS.includes(ZOHO_XMIWTLD)) {
    console.warn(
      "[submitLead] Zoho Web-to-Lead tokens not configured (xnQsjsdp / xmIwtLD still placeholders). " +
        "Lead was NOT sent. Fill the CONFIG block in src/utils/leads.ts."
    );
    return;
  }

  const params = new URLSearchParams();
  // Hidden auth / control fields required by Zoho Web-to-Lead.
  params.set("xnQsjsdp", ZOHO_XNQSJSDP);
  params.set("xmIwtLD", ZOHO_XMIWTLD);
  params.set("actionType", ZOHO_ACTION_TYPE);
  params.set("returnURL", ZOHO_RETURN_URL);

  // Named lead fields (Zoho expects display-name keys).
  params.set("Last Name", payload.name || "Website Visitor");
  params.set("Email", payload.email);
  params.set("Phone", payload.phone);
  params.set("Company", "Estimator Lead");
  params.set("Lead Source", "Website Estimator");
  params.set("Description", buildDescription(payload));

  await fetch(ZOHO_WEBTOLEAD_ACTION, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  // Opaque response under no-cors — reaching here without throwing == success.
}

/**
 * Submits a lead AND attaches the actual PDF file via the Netlify serverless
 * function (netlify/functions/submit-lead.js), which creates the lead through
 * Zoho's authenticated REST API rather than the attachment-less Web-to-Lead
 * form. Requires ZOHO_CLIENT_ID / ZOHO_CLIENT_SECRET / ZOHO_REFRESH_TOKEN to
 * be configured as Netlify environment variables (see ZOHO_LEAD_SETUP.md).
 *
 * If the function isn't configured yet (not deployed, or missing
 * credentials), falls back to the text-only Web-to-Lead path so the lead
 * still reaches Zoho — just without the PDF attached.
 */
export async function submitLeadWithPdf(payload: LeadPayloadWithPdf): Promise<void> {
  try {
    const res = await fetch("/.netlify/functions/submit-lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) return;
    console.warn(`[submitLeadWithPdf] serverless function returned ${res.status}; falling back to Web-to-Lead.`);
  } catch (err) {
    console.warn("[submitLeadWithPdf] serverless function unreachable; falling back to Web-to-Lead.", err);
  }

  await submitLead(payload);
}
