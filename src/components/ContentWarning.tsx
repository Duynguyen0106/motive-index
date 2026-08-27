import Link from "next/link";

export function ContentWarning({
  text,
  level = "standard",
}: {
  text: string;
  level?: "standard" | "restricted";
}) {
  return (
    <div
      className={`note text-sm ${level === "restricted" ? "note-warn" : ""}`}
      role="note"
    >
      <p className="label mb-1">Content warning</p>
      <p className="text-[var(--ink-soft)]">{text}</p>
      {level === "restricted" ? (
        <p className="mt-2 text-[var(--maroon)]">
          Restricted material — adult / academic use. See{" "}
          <Link href="/about#access" className="text-link">
            access policy
          </Link>
          .
        </p>
      ) : null}
    </div>
  );
}

export function DistressResources() {
  return (
    <div className="note text-sm text-[var(--ink-soft)]">
      <p className="font-medium text-[var(--ink)]">If this material is distressing</p>
      <p className="mt-2">
        Consider stepping away. In the U.S., call or text{" "}
        <span className="font-medium text-[var(--ink)]">988</span>. Elsewhere, use
        local crisis services.
      </p>
    </div>
  );
}
