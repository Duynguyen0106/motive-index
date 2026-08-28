export default function DocumentsLoading() {
  return (
    <div className="site-shell py-12 md:py-14" role="status" aria-live="polite">
      <div className="skeleton-block h-4 w-24" aria-hidden />
      <div className="skeleton-block mt-4 h-12 w-72 max-w-full" aria-hidden />
      <div className="skeleton-block mt-4 h-16 w-full max-w-2xl" aria-hidden />
      <div className="card mt-8 grid gap-4 p-5 md:grid-cols-3">
        <div className="skeleton-block h-10 md:col-span-2" aria-hidden />
        <div className="skeleton-block h-10" aria-hidden />
      </div>
      <ul className="mt-6 space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <li key={i} className="card p-4">
            <div className="skeleton-block h-3 w-20" aria-hidden />
            <div className="skeleton-block mt-2 h-5 w-3/4 max-w-md" aria-hidden />
            <div className="skeleton-block mt-2 h-4 w-full" aria-hidden />
          </li>
        ))}
      </ul>
      <p className="mt-6 text-sm text-[var(--muted)]">Loading document library…</p>
    </div>
  );
}
