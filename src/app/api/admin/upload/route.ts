import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import fs from "node:fs";
import path from "node:path";
import { getAdminSession } from "@/lib/auth";
import { getAllCases } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabaseClient";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import type { CaseDocument, DocumentType } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const caseId = String(form.get("caseId") ?? "");
  const title = String(form.get("title") ?? "");
  const type = String(form.get("type") ?? "newspaper") as DocumentType;
  const summary = String(form.get("summary") ?? "");
  const psychRelevance = String(form.get("psychRelevance") ?? "");
  const contentWarning = String(form.get("contentWarning") ?? "");
  const publicDomain = form.get("publicDomain") === "true";
  const file = form.get("file");

  if (!caseId || !title || !(file instanceof File)) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const crimeCase = getAllCases().find((c) => c.id === caseId);
  if (!crimeCase) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `${crimeCase.id}/${Date.now()}-${safeName}`;
  const docId = `doc-${randomUUID()}`;

  let url: string | undefined;
  let hosted = true;
  let storage = "local";

  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseServerClient();
      const { error } = await supabase.storage
        .from("case-documents")
        .upload(storagePath, bytes, {
          contentType: file.type || "application/octet-stream",
          upsert: false,
        });
      if (error) throw error;

      const { error: insertError } = await supabase.from("documents").insert({
        id: docId,
        case_id: crimeCase.id,
        case_slug: crimeCase.slug,
        title,
        type,
        source: "Admin upload",
        public_domain: publicDomain,
        summary,
        psych_relevance: psychRelevance,
        content_warning: contentWarning,
        storage_path: storagePath,
        hosted: true,
      });
      if (insertError) throw insertError;
      storage = "supabase";
    } catch (err) {
      return NextResponse.json(
        {
          error:
            err instanceof Error
              ? `Supabase upload failed: ${err.message}`
              : "Supabase upload failed",
        },
        { status: 500 },
      );
    }
  } else {
    const dir = path.join(process.cwd(), ".data", "uploads", crimeCase.id);
    await mkdir(dir, { recursive: true });
    const localPath = path.join(dir, `${Date.now()}-${safeName}`);
    await writeFile(localPath, bytes);
    url = undefined;
  }

  const document: CaseDocument = {
    id: docId,
    caseSlug: crimeCase.slug,
    title,
    type,
    source: "Admin upload",
    publicDomain,
    summary,
    psychRelevance,
    contentWarning,
    url,
    hosted,
  };

  const storePath = path.join(process.cwd(), ".data", "store.json");
  if (!fs.existsSync(storePath)) getAllCases();
  const store = JSON.parse(fs.readFileSync(storePath, "utf8"));
  store.documents = [document, ...(store.documents ?? [])];
  const idx = (store.cases as Array<{ id: string; documentIds: string[] }>).findIndex(
    (c) => c.id === crimeCase.id,
  );
  if (idx >= 0) {
    store.cases[idx].documentIds = [docId, ...(store.cases[idx].documentIds ?? [])];
  }
  fs.writeFileSync(storePath, JSON.stringify(store, null, 2));
  const g = globalThis as unknown as { __motiveIndexStore?: unknown };
  g.__motiveIndexStore = undefined;

  return NextResponse.json({ document, storage, storagePath });
}
