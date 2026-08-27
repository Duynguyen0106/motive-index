import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { runLiveUpdatePipeline } from "@/lib/pipeline/ingestWorker";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Admin-only live update (browser button). Uses fast heuristic narratives by default. */
export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized — sign in at /login" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const limit = typeof body.limit === "number" ? Math.min(body.limit, 5) : 3;
  const llmNarrative = body.llmNarrative === true;

  try {
    const result = await runLiveUpdatePipeline({
      limit,
      analyze: body.analyze !== false,
      generateNarrative: body.generateNarrative !== false,
      llmNarrative,
    });

    return NextResponse.json({
      ok: true,
      triggeredAt: new Date().toISOString(),
      triggeredBy: session.email,
      result,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Live update pipeline failed",
      },
      { status: 500 },
    );
  }
}
