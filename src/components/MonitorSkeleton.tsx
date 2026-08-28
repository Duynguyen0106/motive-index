export function MonitorSkeleton() {
  return (
    <div className="monitor-dashboard monitor-skeleton" aria-hidden>
      <div className="monitor-top">
        <div className="skeleton-block monitor-hero h-32" />
        <div className="monitor-stats mt-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton-block h-20" />
          ))}
        </div>
      </div>
      <div className="monitor-workspace mt-4">
        <div className="monitor-layout">
          <div className="skeleton-block min-h-[420px]" />
          <div className="skeleton-block min-h-[420px]" />
        </div>
      </div>
    </div>
  );
}
