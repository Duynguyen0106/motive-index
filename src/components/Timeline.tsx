import type { TimelineEvent } from "@/lib/types";

export function Timeline({ events }: { events: TimelineEvent[] }) {
  return (
    <ol className="relative space-y-8 border-l border-[var(--line)] pl-6">
      {events.map((e) => (
        <li key={e.id} className="relative">
          <span className="absolute top-1.5 -left-[1.91rem] h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
          <p className="text-xs tracking-[0.14em] text-[var(--muted)] uppercase">
            {e.date}
          </p>
          <h3 className="mt-1 text-xl font-semibold tracking-tight">{e.label}</h3>
          <p className="mt-2 serif text-[var(--ink-soft)]">{e.detail}</p>
          {e.behavioralNote ? (
            <p className="mt-2 text-sm text-[var(--accent)]">
              Behavioral note: {e.behavioralNote}
            </p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
