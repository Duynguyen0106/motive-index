import type { ReactNode } from "react";

export function PageHeader({
  label,
  title,
  description,
  children,
  narrow,
}: {
  label?: string;
  title: string;
  description?: string;
  children?: ReactNode;
  narrow?: boolean;
}) {
  return (
    <header className={narrow ? "site-shell-narrow" : "site-shell"}>
      {label ? <p className="label">{label}</p> : null}
      <h1 className="display mt-2 text-[clamp(2rem,5vw,3.25rem)] text-[var(--ink)]">
        {title}
      </h1>
      {description ? <p className="lede mt-4">{description}</p> : null}
      {children}
    </header>
  );
}
