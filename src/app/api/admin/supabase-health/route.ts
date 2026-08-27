import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { getAllCases } from "@/lib/data";
import { syncCaseToSupabase } from "@/lib/repository";
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
    const cases = await supabase.from("cases").select("id").limit(1);
    const bucket = await supabase.storage.getBucket("case-documents");
    return NextResponse.json({
      configured: true,
      tablesReady: !cases.error,
      tablesError: cases.error?.message ?? null,
      bucketReady: !bucket.error && Boolean(bucket.data),
      bucketError: bucket.error?.message ?? null,
      urlHost: process.env.NEXT_PUBLIC_SUPABASE_URL,
    });
  } catch (err) {
    return NextResponse.json({
      configured: true,
      tablesReady: false,
      error: err instanceof Error ? err.message : "health check failed",
    });
  }
}

/** Seed/sync local cases into Supabase once tables exist. */
export async function POST() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  // Ensure bucket exists
  const existing = await supabase.storage.getBucket("case-documents");
  if (existing.error) {
    await supabase.storage.createBucket("case-documents", { public: false });
  }

  const local = getAllCases();
  const results = [];
  for (const c of local) {
    results.push({ id: c.id, ...(await syncCaseToSupabase(c)) });
  }

  const ok = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok);
  return NextResponse.json({
    synced: ok,
    failed,
    total: local.length,
  });
}
