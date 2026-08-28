import { NextResponse } from "next/server";
import { getModerationQueue } from "@/lib/data";
import { getPublishReadiness } from "@/lib/moderationPublish";
import { getRecentJobs } from "@/lib/pipeline/ingestWorker";
import { requirePipelineSecretOrQuery } from "@/lib/pipelineAuth";

export const dynamic = "force-dynamic";

/** Pipeline observability — queue blockers, recent jobs, LLM availability. */
export async function GET(req: Request) {
  const auth = requirePipelineSecretOrQuery(req);
  if (!auth.ok) return auth.response;

  const queue = getModerationQueue().map((c) => {
    const readiness = getPublishReadiness(c);
    return {
      slug: c.slug,
      name: c.name,
      tags: c.tags,
      analysisStatus: c.analysis.status,
      narrativeSource: c.narrative?.source ?? null,
      analysisModel: c.analysis.modelVersion,
      signalCount: c.signals.length,
      referenceCount: (c.references ?? []).length,
      ready: readiness.ready,
      blockers: readiness.blockers,
      warnings: readiness.warnings,
    };
  });

  return NextResponse.json({
    ok: true,
    openaiConfigured: Boolean(process.env.OPENAI_API_KEY),
    queueLength: queue.length,
    queue,
    recentJobs: getRecentJobs(10),
  });
}
