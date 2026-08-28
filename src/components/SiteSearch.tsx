"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SiteSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const query = q.trim();
    router.push(query ? `/search?q=${encodeURIComponent(query)}` : "/search");
  }

  return (
    <form className="site-search" onSubmit={submit} role="search">
      <label className="sr-only" htmlFor="site-search-input">
        Search dossiers
      </label>
      <input
        id="site-search-input"
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search cases…"
        className="site-search-input field"
        autoComplete="off"
      />
      <button type="submit" className="site-search-btn" aria-label="Search">
        ⌕
      </button>
    </form>
  );
}
