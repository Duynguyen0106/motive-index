export default function SearchLoading() {
  return (
    <div className="site-shell py-12 md:py-14" role="status" aria-live="polite">
      <div className="skeleton-block h-4 w-24" aria-hidden />
      <div className="skeleton-block mt-4 h-12 w-80 max-w-full" aria-hidden />
      <div className="skeleton-block mt-4 h-16 w-full max-w-2xl" aria-hidden />
      <div className="card mt-8 grid gap-4 p-5 md:grid-cols-2">
        <div className="skeleton-block h-10 md:col-span-2" aria-hidden />
        <div className="skeleton-block h-10" aria-hidden />
        <div className="skeleton-block h-10" aria-hidden />
        <div className="skeleton-block h-10" aria-hidden />
      </div>
      <p className="mt-6 text-sm text-[var(--muted)]">Loading search…</p>
    </div>
  );
}
