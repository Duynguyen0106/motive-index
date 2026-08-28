import { Suspense } from "react";
import type { Metadata } from "next";
import { MonitorSkeleton } from "@/components/MonitorSkeleton";
import { WorldMonitorClient } from "@/components/WorldMonitorClient";
import { buildMonitorPayload } from "@/lib/monitor";

export const metadata: Metadata = {
  title: "World crime monitor",
  description:
    "Live world map of forensic psychology cases and global crime news — filter by country, crime type, and period.",
};

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function HomePage({ searchParams }: Props) {
  const raw = await searchParams;
  const initial = await buildMonitorPayload(raw);
  const syncKey = new URLSearchParams(
    Object.entries(raw).flatMap(([k, v]) =>
      typeof v === "string" ? [[k, v]] : Array.isArray(v) ? v.map((item) => [k, item]) : [],
    ) as [string, string][],
  ).toString();

  return (
    <div className="monitor-page">
      <Suspense fallback={<MonitorSkeleton />}>
        <WorldMonitorClient initial={initial} syncKey={`${syncKey}|${initial.generatedAt}`} />
      </Suspense>
    </div>
  );
}
