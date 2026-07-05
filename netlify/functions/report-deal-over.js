const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS_HEADERS, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  let dealId;
  try {
    const body = JSON.parse(event.body || "{}");
    dealId = body.dealId;
  } catch {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Invalid JSON body" }),
    };
  }

  if (!dealId) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Missing required field: dealId" }),
    };
  }

  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.REPO_OWNER;
  const repo = process.env.REPO_NAME;
  const branch = process.env.REPO_BRANCH || "main";
  const filePath = process.env.CONTENT_FILE_PATH || "public/content.json";

  if (!token || !owner || !repo) {
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Server misconfiguration: missing GitHub env vars" }),
    };
  }

  const apiBase = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
  const headers = {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
  };

  // Fetch current content.json from GitHub
  let fileData;
  try {
    const res = await fetch(`${apiBase}?ref=${encodeURIComponent(branch)}`, { headers });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`GitHub fetch failed (${res.status}): ${text}`);
    }
    fileData = await res.json();
  } catch (err) {
    return {
      statusCode: 502,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Failed to read content from GitHub", detail: err.message }),
    };
  }

  // Decode content
  let content;
  try {
    const decoded = Buffer.from(fileData.content, "base64").toString("utf8");
    content = JSON.parse(decoded);
  } catch (err) {
    return {
      statusCode: 502,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Failed to parse content.json", detail: err.message }),
    };
  }

  // Find the deal
  const deals = content.cms?.deals || [];
  const dealIndex = deals.findIndex((d) => d.id === dealId);

  if (dealIndex === -1) {
    return {
      statusCode: 404,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Deal not found", dealId }),
    };
  }

  // Increment dealOverCount
  const deal = deals[dealIndex];
  deal.dealOverCount = (deal.dealOverCount || 0) + 1;
  content.cms.deals[dealIndex] = deal;

  // Determine status
  const count = deal.dealOverCount;
  let status;
  if (deal.dealOver === true || count >= 10) {
    status = "over";
  } else if (count >= 5) {
    status = "maybe_over";
  } else {
    status = "active";
  }

  // Write back to GitHub
  const encoded = Buffer.from(JSON.stringify(content, null, 2)).toString("base64");
  try {
    const updateRes = await fetch(apiBase, {
      method: "PUT",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `Report deal over: ${dealId}`,
        content: encoded,
        sha: fileData.sha,
        branch,
      }),
    });

    if (!updateRes.ok) {
      const text = await updateRes.text();
      throw new Error(`GitHub write failed (${updateRes.status}): ${text}`);
    }
  } catch (err) {
    return {
      statusCode: 502,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Failed to write content to GitHub", detail: err.message }),
    };
  }

  return {
    statusCode: 200,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    body: JSON.stringify({ ok: true, dealId, dealOverCount: deal.dealOverCount, status }),
  };
};
