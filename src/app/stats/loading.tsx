export default function StatsLoading() {
  return (
    <div className="site-shell py-10 md:py-14" role="status" aria-live="polite">
      <div className="skeleton-block h-4 w-28" aria-hidden />
      <div className="skeleton-block mt-4 h-10 w-64 max-w-full" aria-hidden />
      <div className="skeleton-block mt-8 h-16 w-full" aria-hidden />
      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card p-6">
            <div className="skeleton-block h-5 w-40" aria-hidden />
            <div className="skeleton-block mt-4 h-32 w-full" aria-hidden />
          </div>
        ))}
      </div>
      <p className="mt-6 text-sm text-[var(--muted)]">Loading archive statistics…</p>
    </div>
  );
}
