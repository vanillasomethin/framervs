// Private studio data (clients, projects, tasks, site logs, photos).
//
// Lives in Netlify Blobs, NOT in the repository: content.json is public, this
// must never be. Every collection is one JSON document { rev, items } that is
// updated with optimistic concurrency (ETag), so two people saving at the same
// moment can't silently overwrite each other.
//
// For local development and tests, set STUDIO_LOCAL_DIR to keep the same data
// in plain files instead.

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const fileStore = (dir) => {
  fs.mkdirSync(dir, { recursive: true });
  const file = (key) => path.join(dir, `${encodeURIComponent(key)}.json`);
  const etag = (text) => crypto.createHash("md5").update(text).digest("hex");
  return {
    async getWithMetadata(key) {
      try {
        const text = fs.readFileSync(file(key), "utf8");
        return { data: JSON.parse(text), etag: etag(text) };
      } catch {
        return null;
      }
    },
    async setJSON(key, value, options = {}) {
      let current = null;
      try {
        current = fs.readFileSync(file(key), "utf8");
      } catch {
        /* new key */
      }
      if (options.onlyIfNew && current !== null) return { modified: false };
      if (options.onlyIfMatch && (current === null || etag(current) !== options.onlyIfMatch)) return { modified: false };
      const text = JSON.stringify(value);
      fs.writeFileSync(file(key), text);
      return { modified: true, etag: etag(text) };
    },
    async delete(key) {
      try {
        fs.unlinkSync(file(key));
      } catch {
        /* already gone */
      }
    },
  };
};

const getStudioStore = (event) => {
  if (process.env.STUDIO_LOCAL_DIR) return fileStore(process.env.STUDIO_LOCAL_DIR);
  const { getStore, connectLambda } = require("@netlify/blobs");
  if (event) connectLambda(event);
  // Strong consistency currently requires Netlify to inject an uncached edge URL,
  // which is not available in this Lambda-compatible function runtime. Use the
  // default eventual-consistency path so the Studio API remains operational.
  // Conditional ETag writes still protect updates from overwriting a newer value.
  return getStore({ name: "studio" });
};

const readDoc = async (store, key) => {
  const current = await store.getWithMetadata(key, { type: "json" });
  return current ? current.data : null;
};

// Read-modify-write with retry. fn receives the current document (or null) and
// returns the new one, or undefined to leave it untouched.
const mutate = async (store, key, fn, tries = 6) => {
  for (let attempt = 0; attempt < tries; attempt += 1) {
    const current = await store.getWithMetadata(key, { type: "json" });
    const next = await fn(current ? current.data : null);
    if (next === undefined) return current ? current.data : null;
    const result = await store.setJSON(key, next, current ? { onlyIfMatch: current.etag } : { onlyIfNew: true });
    if (result.modified) return next;
    await new Promise((resolve) => setTimeout(resolve, 40 * (attempt + 1) + Math.random() * 60));
  }
  throw new Error("The studio data was busy. Please try again.");
};

module.exports = { getStudioStore, readDoc, mutate };
