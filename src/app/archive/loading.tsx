export default function ArchiveLoading() {
  return (
    <div role="status" aria-live="polite">
      <div className="site-shell py-10 md:py-12">
        <div className="skeleton-block h-4 w-32" aria-hidden />
        <div className="skeleton-block mt-4 h-10 w-72 max-w-full" aria-hidden />
        <div className="skeleton-block mt-4 h-14 w-full max-w-2xl" aria-hidden />
      </div>
      <div className="site-shell py-10">
        <div className="card p-5">
          <div className="skeleton-block h-10 w-full" aria-hidden />
          <div className="skeleton-block mt-4 h-48 w-full" aria-hidden />
        </div>
        <p className="mt-4 text-sm text-[var(--muted)]">Loading case index…</p>
      </div>
    </div>
  );
}
