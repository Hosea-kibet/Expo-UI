import type { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/auth";

export async function getAdminSession() {
  const session = await getServerSession(authOptions);

  if (session?.user?.role !== "admin" || !session.user.strapiJwt) {
    return null;
  }

  return session;
}

export async function getAdminTokenFromRequest(request: NextRequest) {
  const token = await getToken({
    req: request,
  });

  if (token?.authProvider !== "strapi-admin" || !token.strapiJwt) {
    return null;
  }

  return {
    strapiJwt: String(token.strapiJwt),
    adminId: String(token.adminId ?? ""),
  };
}
