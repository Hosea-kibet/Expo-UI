import type { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/auth";

export async function getAdminSession() {
  const session = await getServerSession(authOptions);

  if (!session?.user || (session.user.role !== "admin" && session.user.role !== "staff")) {
    return null;
  }

  return session;
}

export async function getAdminTokenFromRequest(request: NextRequest) {
  const token = await getToken({
    req: request,
  });

  if (!token?.authProvider || token.authProvider === "attendee-otp") {
    return null;
  }

  return {
    adminId: String(token.adminId ?? ""),
    expoAccess: token.expoAccess === "admin" ? "admin" : "staff",
    authProvider: token.authProvider,
  };
}
