import type { ReactNode } from "react";

export function PageHeader({
  label,
  title,
  description,
  children,
  className = "",
}: {
  label?: string;
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <header className={`page-header ${className}`.trim()}>
      {label ? <p className="label">{label}</p> : null}
      <h1 className="display mt-2 text-[clamp(2rem,5vw,3.25rem)] text-[var(--ink)]">
        {title}
      </h1>
      {description ? <p className="lede mt-4">{description}</p> : null}
      {children}
    </header>
  );
}
