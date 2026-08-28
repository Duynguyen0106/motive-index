import Link from "next/link";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  if (!items.length) return null;

  return (
    <nav aria-label="Breadcrumb" className="breadcrumbs">
      <ol className="breadcrumbs-list flex items-center gap-x-1.5 text-sm text-[var(--muted)]">
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
            {index > 0 ? (
              <span aria-hidden className="select-none text-[var(--line-strong)]">
                /
              </span>
            ) : null}
            {item.href ? (
              <Link href={item.href} className="text-link breadcrumbs-link">
                {item.label}
              </Link>
            ) : (
              <span className="breadcrumbs-current text-[var(--ink-soft)]" aria-current="page">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
