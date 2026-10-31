// Backend for the /admin content manager.
//
// Keeps the admin password and GitHub token on the server (the old admin had
// the password in public JS and asked for a GitHub token in the browser).
// Every "Publish" becomes ONE commit to the repo (content.json + any new
// images), which triggers a single Netlify deploy; scripts/build-cms.mjs then
// regenerates the blog/projects/updates pages from content.json.
//
// Required Netlify environment variables (Site configuration -> Environment variables):
//   ADMIN_PASSWORD  - password for /admin
//   GITHUB_TOKEN    - fine-grained token with "Contents: Read and write" on the repo
// Optional:
//   GITHUB_REPO     - owner/name, defaults to vanillasomethin/framervs
//   GITHUB_BRANCH   - defaults to main
//   SESSION_SECRET  - signs login sessions; defaults to a value derived from the two secrets above

const crypto = require("crypto");

const REPO = process.env.GITHUB_REPO || "vanillasomethin/framervs";
const BRANCH = process.env.GITHUB_BRANCH || "main";
const CONTENT_PATH = "public/content.json";
const UPLOAD_DIR = "public/uploads";
const SESSION_DAYS = 7;
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
const ALLOWED_TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "image/avif": "avif" };

const json = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  body: JSON.stringify(body),
});

const missingConfig = () => ["ADMIN_PASSWORD", "GITHUB_TOKEN"].filter((key) => !process.env[key]);

const sessionSecret = () =>
  process.env.SESSION_SECRET ||
  crypto.createHash("sha256").update(`${process.env.ADMIN_PASSWORD}::${process.env.GITHUB_TOKEN}`).digest("hex");

const sign = (payload) => crypto.createHmac("sha256", sessionSecret()).update(payload).digest("base64url");

const createSession = () => {
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + SESSION_DAYS * 86400000 })).toString("base64url");
  return `${payload}.${sign(payload)}`;
};

const safeEqual = (a, b) => {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
};

const isAuthorized = (event) => {
  const header = event.headers.authorization || event.headers.Authorization || "";
  const token = header.replace(/^Bearer\s+/i, "");
  const [payload, signature] = token.split(".");
  if (!payload || !signature || !safeEqual(signature, sign(payload))) return false;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString()).exp > Date.now();
  } catch {
    return false;
  }
};

const github = async (path, options = {}) => {
  const response = await fetch(`https://api.github.com/repos/${REPO}${path}`, {
    ...options,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      "User-Agent": "vanillasometh.in-admin",
    },
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  if (!response.ok) {
    const error = new Error(data.message || `GitHub request failed (${response.status})`);
    error.status = response.status;
    throw error;
  }
  return data;
};

const loadContent = async () => {
  const file = await github(`/contents/${CONTENT_PATH}?ref=${encodeURIComponent(BRANCH)}`);
  // The contents API omits the body for files over 1 MB; fall back to the blob API
  const base64 = file.content || (await github(`/git/blobs/${file.sha}`)).content;
  return { content: JSON.parse(Buffer.from(base64, "base64").toString("utf8")), sha: file.sha };
};

const uploadPath = (name, type) => {
  const now = new Date();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const base =
    String(name || "image")
      .replace(/\.[^.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50) || "image";
  return `${UPLOAD_DIR}/${now.getUTCFullYear()}/${month}/${base}-${crypto.randomBytes(3).toString("hex")}.${ALLOWED_TYPES[type]}`;
};

// Stores the image as a git blob only. It's committed together with the next
// save, so uploading many photos doesn't trigger many deploys.
const handleUpload = async ({ name, type, data }) => {
  if (!ALLOWED_TYPES[type]) return json(400, { error: "Only JPG, PNG, WebP, GIF or AVIF images can be uploaded." });
  const bytes = Buffer.from(String(data || ""), "base64");
  if (!bytes.length) return json(400, { error: "The image was empty." });
  if (bytes.length > MAX_UPLOAD_BYTES) return json(413, { error: "Image is larger than 4 MB after compression." });
  const blob = await github("/git/blobs", { method: "POST", body: JSON.stringify({ content: data, encoding: "base64" }) });
  const path = uploadPath(name, type);
  return json(200, { path, sha: blob.sha, url: `/${path.replace(/^public\//, "")}` });
};

const handleSave = async ({ content, baseSha, message, uploads = [] }) => {
  if (!content || typeof content !== "object" || !content.cms) return json(400, { error: "Invalid content." });

  // Refuse to overwrite edits made elsewhere since this admin loaded the content
  const current = await github(`/contents/${CONTENT_PATH}?ref=${encodeURIComponent(BRANCH)}`);
  if (baseSha && current.sha !== baseSha) {
    return json(409, { error: "The content was changed somewhere else since you opened the admin. Reload to get the latest version, then redo your edit." });
  }

  const validUploads = uploads.filter(
    (u) => u && /^[0-9a-f]{40}$/.test(u.sha) && typeof u.path === "string" && u.path.startsWith(`${UPLOAD_DIR}/`) && !u.path.includes("..")
  );
  const serialized = `${JSON.stringify(content, null, 2)}\n`;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const ref = await github(`/git/ref/heads/${encodeURIComponent(BRANCH)}`);
    const head = await github(`/git/commits/${ref.object.sha}`);
    const tree = await github("/git/trees", {
      method: "POST",
      body: JSON.stringify({
        base_tree: head.tree.sha,
        tree: [
          { path: CONTENT_PATH, mode: "100644", type: "blob", content: serialized },
          ...validUploads.map((u) => ({ path: u.path, mode: "100644", type: "blob", sha: u.sha })),
        ],
      }),
    });
    const commit = await github("/git/commits", {
      method: "POST",
      body: JSON.stringify({
        message: String(message || "Update site content from admin").slice(0, 200),
        tree: tree.sha,
        parents: [ref.object.sha],
      }),
    });
    try {
      await github(`/git/refs/heads/${encodeURIComponent(BRANCH)}`, {
        method: "PATCH",
        body: JSON.stringify({ sha: commit.sha, force: false }),
      });
      const saved = await github(`/contents/${CONTENT_PATH}?ref=${commit.sha}`);
      return json(200, { ok: true, commit: commit.sha, sha: saved.sha });
    } catch (error) {
      // Someone else pushed between reading and updating the branch: retry once on the new head
      if (error.status !== 422 || attempt === 1) throw error;
    }
  }
  return json(500, { error: "Could not save." });
};

exports.handler = async (event) => {
  if (event.httpMethod === "GET") {
    return json(200, { configured: missingConfig().length === 0, missing: missingConfig(), repo: REPO, branch: BRANCH });
  }
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  const missing = missingConfig();
  if (missing.length) {
    return json(503, { error: `The admin isn't set up yet. Add ${missing.join(" and ")} in Netlify environment variables.`, missing });
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "Invalid request." });
  }

  try {
    if (body.action === "login") {
      if (!safeEqual(body.password || "", process.env.ADMIN_PASSWORD)) {
        await new Promise((resolve) => setTimeout(resolve, 800)); // slow down guessing
        return json(401, { error: "Incorrect password." });
      }
      return json(200, { token: createSession(), expiresInDays: SESSION_DAYS });
    }

    if (!isAuthorized(event)) return json(401, { error: "Your session has expired. Please log in again." });

    switch (body.action) {
      case "load":
        return json(200, await loadContent());
      case "upload":
        return await handleUpload(body);
      case "save":
        return await handleSave(body);
      default:
        return json(400, { error: "Unknown action." });
    }
  } catch (error) {
    console.error("cms function error", error);
    const hint =
      error.status === 401 || error.status === 403 || error.status === 404
        ? " Check that GITHUB_TOKEN is valid and has Contents read/write access to the repository."
        : "";
    return json(502, { error: `${error.message}.${hint}` });
  }
};
