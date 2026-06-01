"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Invalid password");
      }
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <header>
          <h1 className="text-2xl font-semibold">Admin Login</h1>
          <p className="text-slate-400 text-sm mt-1">Enter your admin password to continue.</p>
        </header>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md bg-slate-900 border border-slate-800 px-3 py-2 text-sm"
            autoFocus
          />
          <button
            type="submit"
            disabled={loading || !password}
            className="w-full rounded-md bg-slate-100 text-slate-900 px-4 py-2 text-sm font-medium hover:bg-white disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
        {error && (
          <p className="text-sm text-red-300 border border-red-400/40 bg-red-950/30 rounded-md px-3 py-2">
            {error}
          </p>
        )}
      </div>
    </main>
  );
}
