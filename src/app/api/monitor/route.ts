import { NextResponse } from "next/server";
import { buildMonitorPayload } from "@/lib/monitor";

export const dynamic = "force-dynamic";

/** Geo-enriched monitor data for map dashboard (polls every ~30s from client). */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const params: Record<string, string> = {};
  url.searchParams.forEach((v, k) => {
    params[k] = v;
  });

  const payload = buildMonitorPayload(params);
  return NextResponse.json(payload);
}
