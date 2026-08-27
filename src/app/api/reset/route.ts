import { NextResponse } from "next/server";
import { resetStore, getAllCases, getContributions, getUpdates } from "@/lib/data";

export const dynamic = "force-dynamic";

/** Dev/test helper: restore seed data. Disabled in production builds. */
export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }
  resetStore();
  return NextResponse.json({
    ok: true,
    cases: getAllCases().length,
    updates: getUpdates().length,
    contributions: getContributions().length,
  });
}
