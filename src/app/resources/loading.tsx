export default function ResourcesLoading() {
  return (
    <div className="site-shell py-10 md:py-14" role="status" aria-live="polite">
      <div className="skeleton-block h-4 w-28" aria-hidden />
      <div className="skeleton-block mt-4 h-10 w-72 max-w-full" aria-hidden />
      <div className="mt-10 grid gap-3 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card p-5">
            <div className="skeleton-block h-4 w-24" aria-hidden />
            <div className="skeleton-block mt-3 h-6 w-48" aria-hidden />
          </div>
        ))}
      </div>
      <p className="mt-6 text-sm text-[var(--muted)]">Loading resources…</p>
    </div>
  );
}
