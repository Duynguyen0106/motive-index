import { NextResponse } from "next/server";
import { getUpdates, getUpdatesTotal } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 50));
  return NextResponse.json({
    updates: getUpdates(limit),
    total: getUpdatesTotal(),
  });
}
