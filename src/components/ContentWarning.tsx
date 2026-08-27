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
      className={`card border-l-4 px-4 py-3 text-sm ${
        level === "restricted"
          ? "border-l-[var(--maroon)]"
          : "border-l-[var(--accent)]"
      }`}
      role="note"
    >
      <p className="font-semibold text-[var(--ink)]">Content warning</p>
      <p className="mt-1 text-[var(--ink-soft)]">{text}</p>
      {level === "restricted" ? (
        <p className="mt-2 text-[var(--maroon)]">
          Restricted educational material — intended for adult / academic use.
          See <Link href="/about#access" className="underline">access policy</Link>.
        </p>
      ) : null}
    </div>
  );
}

export function DistressResources() {
  return (
    <div className="card bg-[var(--bg-subtle)] p-4 text-sm text-[var(--ink-soft)]">
      <p className="font-semibold text-[var(--ink)]">If this material is distressing</p>
      <p className="mt-1">
        Consider taking a break. For urgent support in the U.S., call or text{" "}
        <span className="font-medium text-[var(--ink)]">988</span> (Suicide &amp;
        Crisis Lifeline). Outside the U.S., consult local emergency services or
        trusted clinical resources.
      </p>
    </div>
  );
}
