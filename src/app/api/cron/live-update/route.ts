import { NextResponse } from "next/server";
import { runLiveUpdatePipeline, runWorldNewsPipeline } from "@/lib/pipeline/ingestWorker";

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

  try {
    const [result, worldNews] = await Promise.all([
      runLiveUpdatePipeline({
        limit: typeof body.limit === "number" ? body.limit : undefined,
        analyze: body.analyze !== false,
        generateNarrative: body.generateNarrative !== false,
        llmNarrative: false,
      }),
      runWorldNewsPipeline(8),
    ]);

    return NextResponse.json({
      ok: true,
      triggeredAt: new Date().toISOString(),
      result,
      worldNews,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Pipeline failed",
      },
      { status: 500 },
    );
  }
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

  try {
    const [result, worldNews] = await Promise.all([
      runLiveUpdatePipeline({ limit: 5, llmNarrative: false }),
      runWorldNewsPipeline(6),
    ]);
    return NextResponse.json({ ok: true, result, worldNews });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Pipeline failed" },
      { status: 500 },
    );
  }
}
