import Link from "next/link";
import type { ReactNode } from "react";

type Action = { href: string; label: string; primary?: boolean };

export function EmptyState({
  title,
  description,
  actions = [],
}: {
  title: string;
  description?: string;
  actions?: Action[];
}) {
  return (
    <div className="empty-state">
      <p className="empty-state-icon" aria-hidden>
        ◌
      </p>
      <h3 className="display text-xl text-[var(--ink)]">{title}</h3>
      {description ? <p className="mt-2 text-sm text-[var(--ink-soft)]">{description}</p> : null}
      {actions.length ? (
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {actions.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className={a.primary ? "btn btn-primary text-sm" : "btn btn-ghost text-sm"}
            >
              {a.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function StatBar({
  items,
}: {
  items: { label: string; value: string | number; highlight?: boolean }[];
}) {
  return (
    <div className="stat-bar" role="list">
      {items.map((item) => (
        <div
          key={item.label}
          className={`stat-bar-item ${item.highlight ? "is-highlight" : ""}`}
          role="listitem"
        >
          <span className="stat-bar-value">{item.value}</span>
          <span className="stat-bar-label">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

export function QuickLinks({
  links,
  className = "",
}: {
  links: { href: string; label: string }[];
  className?: string;
}) {
  return (
    <nav className={`quick-links ${className}`.trim()} aria-label="Quick navigation">
      {links.map((l) => (
        <Link key={l.href} href={l.href} className="quick-link">
          {l.label}
        </Link>
      ))}
    </nav>
  );
}

export function CaseStatusBadge({ status }: { status: string }) {
  return (
    <span className={`status-badge status-${status}`} role="status">
      {status}
    </span>
  );
}
