import { NextResponse } from "next/server";
import { runLiveUpdatePipeline, runWorldNewsPipeline } from "@/lib/pipeline/ingestWorker";
import { autoPublishReadyDrafts } from "@/lib/pipeline/autoPublish";
import { requirePipelineSecretOrQuery } from "@/lib/pipelineAuth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Scheduled live-update trigger.
 * Secure with CRON_SECRET: Authorization: Bearer <CRON_SECRET> or ?secret=
 */
export async function POST(req: Request) {
  const auth = requirePipelineSecretOrQuery(req);
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => ({}));

  try {
    const [result, worldNews, publishRetry] = await Promise.all([
      runLiveUpdatePipeline({
        limit: typeof body.limit === "number" ? body.limit : undefined,
        useLlm: body.useLlm,
      }),
      runWorldNewsPipeline(8),
      body.retryDrafts !== false ? autoPublishReadyDrafts() : Promise.resolve(null),
    ]);

    return NextResponse.json({
      ok: true,
      triggeredAt: new Date().toISOString(),
      result,
      worldNews,
      publishRetry,
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
  const auth = requirePipelineSecretOrQuery(req);
  if (!auth.ok) return auth.response;

  try {
    const [result, worldNews, publishRetry] = await Promise.all([
      runLiveUpdatePipeline({ limit: 5 }),
      runWorldNewsPipeline(6),
      autoPublishReadyDrafts(),
    ]);
    return NextResponse.json({ ok: true, result, worldNews, publishRetry });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Pipeline failed" },
      { status: 500 },
    );
  }
}
