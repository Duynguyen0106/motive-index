import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createLocalSessionToken,
  getLocalAdminCredentials,
  AUTH_COOKIE,
} from "@/lib/auth";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid credentials payload" }, { status: 400 });
  }

  const { email, password } = parsed.data;

  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !data.session) {
        return NextResponse.json({ error: error?.message ?? "Login failed" }, { status: 401 });
      }
      const res = NextResponse.json({ ok: true, provider: "supabase", email });
      res.cookies.set("sb-access-token", data.session.access_token, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7,
      });
      if (data.session.refresh_token) {
        res.cookies.set("sb-refresh-token", data.session.refresh_token, {
          httpOnly: true,
          sameSite: "lax",
          path: "/",
          secure: process.env.NODE_ENV === "production",
          maxAge: 60 * 60 * 24 * 30,
        });
      }
      return res;
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Supabase auth error" },
        { status: 500 },
      );
    }
  }

  const local = getLocalAdminCredentials();
  if (email !== local.email || password !== local.password) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const token = await createLocalSessionToken(email);
  const res = NextResponse.json({ ok: true, provider: "local", email });
  res.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
