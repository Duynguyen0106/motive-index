"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/admin/upload";
  const [email, setEmail] = useState("admin@motiveindex.local");
  const [password, setPassword] = useState("motive-admin");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }
      router.push(next);
      router.refresh();
    } catch {
      setError("Network error");
      setLoading(false);
    }
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
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded border border-[var(--line)] px-3 py-2"
        />
      </label>
      {error ? <p className="text-sm text-[var(--maroon)]">{error}</p> : null}
      <button
        type="submit"
        disabled={loading}
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
