// Private report endpoint for the admin; the API key is never returned.
const { connectLambda, getStore } = require("@netlify/blobs");
const { json, isAuthorized } = require("./lib/auth");

exports.handler = async (event) => {
  if (event.httpMethod !== "GET") return json(405, { error: "Method not allowed." });
  if (!isAuthorized(event)) return json(401, { error: "Please log in to the admin first." });
  try {
    connectLambda(event);
    const store = getStore({ name: "pagespeed" });
    const [latest, history] = await Promise.all([
      store.get("latest", { type: "json" }),
      store.get("history", { type: "json" }),
    ]);
    return json(200, { configured: Boolean(process.env.PAGESPEED_API_KEY), latest: latest || null, history: history || [] });
  } catch (error) {
    console.error("PageSpeed report error:", error.message);
    return json(500, { error: "Could not load PageSpeed reports." });
  }
};
