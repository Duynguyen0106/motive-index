import { NextResponse } from "next/server";
import { parseSearchParams } from "@/lib/search";
import { buildWorldNewsPayload } from "@/lib/worldNewsService";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const params = Object.fromEntries(url.searchParams.entries());
  const filters = parseSearchParams(params);
  const limit = Number(url.searchParams.get("limit") ?? 30);

  const payload = await buildWorldNewsPayload({
    limit: Math.min(limit, 50),
    country: filters.country ?? "",
    live: url.searchParams.get("live") !== "false",
  });

  return NextResponse.json(payload);
}
