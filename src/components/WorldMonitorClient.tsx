"use client";

import dynamic from "next/dynamic";
import { MonitorSkeleton } from "@/components/MonitorSkeleton";
import type { MonitorPayload } from "@/lib/monitor";

const WorldMonitor = dynamic(
  () => import("@/components/WorldMonitor").then((m) => m.WorldMonitor),
  { loading: () => <MonitorSkeleton />, ssr: false },
);

type Props = { initial: MonitorPayload };

/** Code-splits Leaflet and monitor UI for faster first paint on home. */
export function WorldMonitorClient({ initial }: Props) {
  return <WorldMonitor initial={initial} />;
}
