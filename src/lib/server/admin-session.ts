import type { Session } from "next-auth";
import type { NextRequest } from "next/server";
import { cookies, headers } from "next/headers";
import { getToken, type JWT } from "next-auth/jwt";

function getAdminFromToken(token: JWT | null) {
  if (
    token?.authProvider !== "strapi-admin" ||
    (token.expoAccess !== "admin" && token.expoAccess !== "staff") ||
    typeof token.adminId !== "string" ||
    !token.adminId
  ) {
    return null;
  }

  return {
    adminId: token.adminId,
    adminName: typeof token.adminName === "string" ? token.adminName : "",
    expoAccess: token.expoAccess,
    authProvider: token.authProvider,
    strapiRoleName: typeof token.strapiRoleName === "string" ? token.strapiRoleName : "",
    strapiRoleType: typeof token.strapiRoleType === "string" ? token.strapiRoleType : "",
  };
}

export async function getAdminSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const token = await getToken({
    req: {
      cookies: cookieStore,
      headers: headerStore,
    } as unknown as NextRequest,
  });
  const admin = getAdminFromToken(token);

  if (!admin) {
    return null;
  }

  return {
    expires: "",
    user: {
      id: admin.adminId,
      name: admin.adminName,
      email: null,
      registrationReference: "",
      role: admin.expoAccess,
      strapiJwt: "",
      strapiRoleName: admin.strapiRoleName,
      strapiRoleType: admin.strapiRoleType,
    },
  };
}

export async function getAdminTokenFromRequest(request: NextRequest) {
  const token = await getToken({
    req: request,
  });
  const admin = getAdminFromToken(token);

  if (!admin) {
    return null;
  }

  return {
    adminId: admin.adminId,
    expoAccess: admin.expoAccess,
    authProvider: admin.authProvider,
  };
}
