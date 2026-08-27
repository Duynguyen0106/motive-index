import { NextResponse } from "next/server";
import { runLiveUpdatePipeline } from "@/lib/pipeline/ingestWorker";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Scheduled live-update trigger.
 * Secure with CRON_SECRET header: Authorization: Bearer <CRON_SECRET>
 * Also allows admin session cookie for manual runs.
 */
export async function POST(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization") ?? "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const isCron = Boolean(cronSecret && bearer === cronSecret);

  // Manual trigger without cron secret only in non-production
  const allowDev = process.env.NODE_ENV !== "production" && !cronSecret;

  if (!isCron && !allowDev) {
    // fall through to cookie admin check
    const { getAdminSession } = await import("@/lib/auth");
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const body = await req.json().catch(() => ({}));
  const result = await runLiveUpdatePipeline({
    limit: typeof body.limit === "number" ? body.limit : undefined,
    analyze: body.analyze !== false,
  });

  return NextResponse.json({
    ok: true,
    triggeredAt: new Date().toISOString(),
    result,
  });
}

export async function GET(req: Request) {
  // Vercel cron often uses GET — require secret in production
  const cronSecret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization") ?? "";
  const url = new URL(req.url);
  const qSecret = url.searchParams.get("secret");
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const ok =
    (cronSecret && (bearer === cronSecret || qSecret === cronSecret)) ||
    (process.env.NODE_ENV !== "production" && !cronSecret);

  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runLiveUpdatePipeline({ limit: 5 });
  return NextResponse.json({ ok: true, result });
}
