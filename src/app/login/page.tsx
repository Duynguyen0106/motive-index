"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useCallback, useState } from "react";

function LoginForm() {
  const params = useSearchParams();
  const next = params.get("next") || "/admin/moderation";
  const [email, setEmail] = useState("admin@motiveindex.local");
  const [password, setPassword] = useState("motive-admin");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const signIn = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }
      window.location.href = next;
    } catch {
      setError("Network error");
      setLoading(false);
    }
  }, [email, password, next]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await signIn();
  }

  return (
    <form onSubmit={onSubmit} className="card mx-auto mt-8 max-w-md space-y-4 p-6">
      <h1 className="display text-3xl">Admin login</h1>
      <p className="text-sm text-[var(--ink-soft)]">
        Email/password authentication protects admin pages. With Supabase env
        vars set, Supabase Auth is used; otherwise local admin credentials apply.
      </p>
      <label className="block text-sm">
        <span className="font-medium">Email</span>
        <input
          type="email"
          name="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded border border-[var(--line)] px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        <span className="font-medium">Password</span>
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded border border-[var(--line)] px-3 py-2"
        />
      </label>
      {error ? <p className="text-sm text-[var(--maroon)]">{error}</p> : null}
      <button
        type="button"
        disabled={loading}
        onClick={() => void signIn()}
        className="w-full rounded bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {loading ? "Signing in…" : "Sign in"}
      </button>
      <p className="text-xs text-[var(--muted)]">
        Default local login: admin@motiveindex.local / motive-admin
      </p>
      <Link href="/" className="block text-sm text-[var(--accent)] hover:underline">
        ← Back to archive
      </Link>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="site-shell py-12">
      <Suspense fallback={<p className="text-center text-[var(--muted)]">Loading…</p>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
