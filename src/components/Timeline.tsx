import type { TimelineEvent } from "@/lib/types";

export function Timeline({ events }: { events: TimelineEvent[] }) {
  return (
    <ol className="relative space-y-4">
      {events.map((e) => (
        <li key={e.id} className="card relative p-5 md:p-6">
          <p className="text-xs font-medium tracking-[0.14em] text-[var(--muted)] uppercase">
            {e.date}
          </p>
          <h3 className="display mt-1 text-xl text-[var(--ink)]">{e.label}</h3>
          <p className="body-copy mt-2 text-[var(--ink-soft)]">{e.detail}</p>
          {e.behavioralNote ? (
            <p className="mt-3 border-t border-[var(--line)] pt-3 text-sm text-[var(--accent)]">
              Behavioral note: {e.behavioralNote}
            </p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
