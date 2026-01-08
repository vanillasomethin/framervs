"use client";

import { useEffect, useState } from "react";

const DEFAULT_MESSAGE = "Update content.json from admin panel";

export default function AdminPage() {
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("Idle");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState(DEFAULT_MESSAGE);

  useEffect(() => {
    const loadContent = async () => {
      setStatus("Loading content.json...");
      try {
        const response = await fetch("/content.json", { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Failed to load content.json (${response.status})`);
        }
        const data = await response.json();
        setContent(JSON.stringify(data, null, 2));
        setStatus("Ready");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setStatus("Error");
      }
    };

    loadContent();
  }, []);

  const handleSave = async () => {
    setStatus("Saving to GitHub...");
    setError(null);

    try {
      const response = await fetch("/api/content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content, message }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || `Save failed (${response.status})`);
      }

      setStatus("Saved to GitHub ✅");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setStatus("Error");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold">Content Admin</h1>
          <p className="text-slate-300">
            Edit <code className="bg-slate-900 px-2 py-1 rounded">content.json</code> and
            push changes directly to GitHub.
          </p>
        </header>

        <section className="space-y-2">
          <label className="block text-sm font-medium text-slate-300">
            Commit message
          </label>
          <input
            className="w-full rounded-md bg-slate-900 border border-slate-800 px-3 py-2 text-sm"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
          />
        </section>

        <section className="space-y-2">
          <label className="block text-sm font-medium text-slate-300">
            JSON content
          </label>
          <textarea
            className="w-full min-h-[520px] rounded-md bg-slate-900 border border-slate-800 p-4 font-mono text-xs"
            value={content}
            onChange={(event) => setContent(event.target.value)}
          />
        </section>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleSave}
            className="rounded-md bg-slate-100 text-slate-900 px-4 py-2 text-sm font-medium hover:bg-white"
          >
            Save to GitHub
          </button>
          <span className="text-sm text-slate-400">{status}</span>
        </div>

        {error && (
          <div className="rounded-md border border-red-400/50 bg-red-950/40 p-4 text-sm text-red-200">
            {error}
          </div>
        )}

        <section className="rounded-md border border-slate-800 bg-slate-900/40 p-4 text-sm text-slate-300">
          <p className="font-semibold text-slate-100">Setup notes</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Set <code>GITHUB_TOKEN</code> with repo write access.</li>
            <li>Set <code>GITHUB_REPO</code> as <code>owner/repo</code>.</li>
            <li>Optional: <code>GITHUB_BRANCH</code> (defaults to <code>main</code>).</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
