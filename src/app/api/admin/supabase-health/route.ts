import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { getStoreSnapshot } from "@/lib/data";
import { syncFullStoreToSupabase } from "@/lib/repository";
import { isSupabaseConfigured } from "@/lib/supabaseClient";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET() {
  const configured = isSupabaseConfigured();
  if (!configured) {
    return NextResponse.json({
      configured: false,
      tablesReady: false,
      bucketReady: false,
    });
  }

  try {
    const supabase = getSupabaseServerClient();
    const [cases, updates, contributions, bucket] = await Promise.all([
      supabase.from("cases").select("id", { count: "exact", head: true }),
      supabase.from("live_updates").select("id", { count: "exact", head: true }),
      supabase.from("contributions").select("id", { count: "exact", head: true }),
      supabase.storage.getBucket("case-documents"),
    ]);

    return NextResponse.json({
      configured: true,
      tablesReady: !cases.error,
      tablesError: cases.error?.message ?? null,
      liveUpdatesReady: !updates.error,
      contributionsReady: !contributions.error,
      caseCount: cases.count ?? 0,
      updateCount: updates.count ?? 0,
      contributionCount: contributions.count ?? 0,
      bucketReady: !bucket.error && Boolean(bucket.data),
      bucketError: bucket.error?.message ?? null,
      urlHost: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseReadEnabled: process.env.MOTIVE_INDEX_SUPABASE_READ === "1",
    });
  } catch (err) {
    return NextResponse.json({
      configured: true,
      tablesReady: false,
      error: err instanceof Error ? err.message : "health check failed",
    });
  }
}

/** Seed/sync local store into Supabase once tables exist. */
export async function POST() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  const existing = await supabase.storage.getBucket("case-documents");
  if (existing.error) {
    await supabase.storage.createBucket("case-documents", { public: false });
  }

  const store = getStoreSnapshot();
  const result = await syncFullStoreToSupabase(store);

  return NextResponse.json({
    synced: result,
    total: {
      cases: store.cases.length,
      documents: store.documents.length,
      updates: store.updates.length,
      contributions: store.contributions.length,
    },
  });
}
