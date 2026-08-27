import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { isSupabaseConfigured, getSupabaseClient } from "@/lib/supabaseClient";

export const AUTH_COOKIE = "motive_admin_session";

function secretKey() {
  const secret = process.env.AUTH_SECRET || "dev-motive-index-secret-change-me";
  return new TextEncoder().encode(secret);
}

export async function createLocalSessionToken(email: string): Promise<string> {
  return new SignJWT({ email, role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey());
}

export async function verifyLocalSessionToken(
  token: string,
): Promise<{ email: string; role: string } | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (typeof payload.email !== "string") return null;
    return { email: payload.email, role: String(payload.role ?? "admin") };
  } catch {
    return null;
  }
}

export async function getAdminSession(): Promise<{ email: string } | null> {
  const jar = await cookies();

  if (isSupabaseConfigured()) {
    const access = jar.get("sb-access-token")?.value;
    if (access) {
      try {
        const supabase = getSupabaseClient();
        const { data } = await supabase.auth.getUser(access);
        if (data.user?.email) return { email: data.user.email };
      } catch {
        /* fall through to local cookie */
      }
    }
  }

  const local = jar.get(AUTH_COOKIE)?.value;
  if (!local) return null;
  const session = await verifyLocalSessionToken(local);
  return session ? { email: session.email } : null;
}

export function getLocalAdminCredentials() {
  return {
    email: process.env.ADMIN_EMAIL || "admin@motiveindex.local",
    password: process.env.ADMIN_PASSWORD || "motive-admin",
  };
}
