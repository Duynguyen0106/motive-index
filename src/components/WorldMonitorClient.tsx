"use client";

import dynamic from "next/dynamic";
import { MonitorSkeleton } from "@/components/MonitorSkeleton";
import type { MonitorPayload } from "@/lib/monitor";

const WorldMonitor = dynamic(
  () => import("@/components/WorldMonitor").then((m) => m.WorldMonitor),
  { loading: () => <MonitorSkeleton />, ssr: false },
);

type Props = { initial: MonitorPayload; syncKey: string };

/** Code-splits Leaflet and monitor UI for faster first paint on home. */
export function WorldMonitorClient({ initial, syncKey }: Props) {
  return <WorldMonitor key={syncKey} initial={initial} />;
}
