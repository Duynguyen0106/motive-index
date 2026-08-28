export default function LiveLoading() {
  return (
    <div className="site-shell page-intro py-10 md:py-12" role="status" aria-live="polite">
      <p className="label">Live intelligence</p>
      <div className="skeleton-block mt-3 h-10 w-64 max-w-full" aria-hidden />
      <div className="skeleton-block mt-4 h-16 w-full max-w-2xl" aria-hidden />
      <p className="mt-6 text-sm text-[var(--muted)]">Loading world crime news…</p>
      <div className="mt-10 card p-5">
        <div className="skeleton-block h-4 w-32" aria-hidden />
        <ul className="mt-4 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <li key={i}>
              <div className="skeleton-block h-3 w-24" aria-hidden />
              <div className="skeleton-block mt-2 h-5 w-full" aria-hidden />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
