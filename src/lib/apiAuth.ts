import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";

type AuthResult = { ok: true } | { ok: false; response: NextResponse };

/**
 * Gates ingest, analyze, and extract APIs — admin session or CRON_SECRET bearer.
 * Prevents unauthenticated writes of AI-generated dossier content.
 */
export async function requirePrivilegedApiAccess(req: Request): Promise<AuthResult> {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get("authorization");
    if (auth === `Bearer ${cronSecret}`) return { ok: true };
  }

  const session = await getAdminSession();
  if (session) return { ok: true };

  return {
    ok: false,
    response: NextResponse.json(
      {
        error:
          "Unauthorized — sign in as admin or provide Authorization: Bearer CRON_SECRET for automated ingest.",
      },
      { status: 401 },
    ),
  };
}
