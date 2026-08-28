import { NextResponse } from "next/server";

type AuthResult = { ok: true } | { ok: false; response: NextResponse };

/** Secured pipeline access — CRON_SECRET bearer only (no admin sessions). */
export function requirePipelineSecret(req: Request): AuthResult {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV !== "production") {
      return { ok: true };
    }
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Pipeline unavailable — CRON_SECRET is not configured." },
        { status: 503 },
      ),
    };
  }

  const auth = req.headers.get("authorization") ?? "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (bearer === secret) return { ok: true };

  return {
    ok: false,
    response: NextResponse.json(
      { error: "Unauthorized — provide Authorization: Bearer CRON_SECRET." },
      { status: 401 },
    ),
  };
}

/** Cron GET may also accept ?secret= for Vercel scheduler compatibility. */
export function requirePipelineSecretOrQuery(req: Request): AuthResult {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV !== "production") {
      return { ok: true };
    }
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Pipeline unavailable — CRON_SECRET is not configured." },
        { status: 503 },
      ),
    };
  }

  const auth = req.headers.get("authorization") ?? "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const url = new URL(req.url);
  const qSecret = url.searchParams.get("secret");
  if (bearer === secret || qSecret === secret) return { ok: true };

  return {
    ok: false,
    response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
  };
}
