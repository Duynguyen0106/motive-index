export default function ContributeLoading() {
  return (
    <div className="site-shell py-10 md:py-14" role="status" aria-live="polite">
      <div className="skeleton-block h-4 w-32" aria-hidden />
      <div className="skeleton-block mt-4 h-10 w-80 max-w-full" aria-hidden />
      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div className="card p-6">
          <div className="skeleton-block h-48 w-full" aria-hidden />
        </div>
        <div className="card p-6">
          <div className="skeleton-block h-32 w-full" aria-hidden />
        </div>
      </div>
      <p className="mt-6 text-sm text-[var(--muted)]">Loading contribute page…</p>
    </div>
  );
}
