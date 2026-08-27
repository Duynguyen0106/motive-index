import { Suspense } from "react";
import type { Metadata } from "next";
import { WorldMonitor } from "@/components/WorldMonitor";
import { buildMonitorPayload } from "@/lib/monitor";

export const metadata: Metadata = {
  title: "World crime monitor",
  description:
    "Live world map of forensic psychology cases — filter by country, crime type, and period.",
};

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function MonitorPage({ searchParams }: Props) {
  const raw = await searchParams;
  const initial = buildMonitorPayload(raw);

  return (
    <div className="monitor-page">
      <Suspense fallback={<p className="site-shell py-12 text-[var(--muted)]">Loading monitor…</p>}>
        <WorldMonitor initial={initial} />
      </Suspense>
    </div>
  );
}
