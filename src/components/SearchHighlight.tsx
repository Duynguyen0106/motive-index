"use client";

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function SearchHighlight({ text, query = "" }: { text: string; query?: string }) {
  const term = query.trim();
  if (!term) return <>{text}</>;

  const parts = text.split(new RegExp(`(${escapeRegex(term)})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === term.toLowerCase() ? (
          <mark key={i} className="search-highlight">
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}
