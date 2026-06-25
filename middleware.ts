import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken, type JWT } from "next-auth/jwt";

function isAuthorizedAdminToken(token: JWT | null) {
  return token?.authProvider === "strapi-admin" && (token.expoAccess === "admin" || token.expoAccess === "staff");
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminApiRoute = pathname.startsWith("/api/admin/");
  const isAdminLoginRoute = pathname === "/admin/login";
  const token = await getToken({ req: request });

  if (isAdminLoginRoute) {
    if (isAuthorizedAdminToken(token)) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    return NextResponse.next();
  }

  if (isAuthorizedAdminToken(token)) {
    return NextResponse.next();
  }

  if (isAdminApiRoute) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const loginUrl = new URL("/admin/login", request.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
