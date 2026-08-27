import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const AUTH_COOKIE = "motive_admin_session";

async function hasValidLocalSession(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    const secret = process.env.AUTH_SECRET || "dev-motive-index-secret-change-me";
    await jwtVerify(token, new TextEncoder().encode(secret));
    return true;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const localOk = await hasValidLocalSession(req.cookies.get(AUTH_COOKIE)?.value);
  const supabaseOk = Boolean(req.cookies.get("sb-access-token")?.value);

  if (localOk || supabaseOk) {
    return NextResponse.next();
  }

  const login = new URL("/login", req.url);
  login.searchParams.set("next", pathname);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/admin/:path*"],
};
