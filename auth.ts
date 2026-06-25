import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { loginExpoUser } from "@/src/lib/server/strapi-admin";
import { verifyAttendeeOtp } from "@/src/lib/server/attendee-otp";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    Credentials({
      id: "attendee-otp",
      name: "Attendee OTP",
      credentials: {
        email: { label: "Email", type: "email" },
        otp: { label: "OTP", type: "text" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "")
          .trim()
          .toLowerCase();
        const otp = String(credentials?.otp ?? "").trim();

        if (!email || !otp) {
          return null;
        }

        const attendee = await verifyAttendeeOtp(email, otp);

        if (!attendee) {
          return null;
        }

        return {
          id: attendee.documentId,
          email: attendee.email,
          name: `${attendee.firstName} ${attendee.lastName}`.trim(),
          registrationReference: attendee.registrationReference,
        };
      },
    }),
    Credentials({
      id: "strapi-admin",
      name: "Strapi Admin",
      credentials: {
        identifier: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const identifier = String(credentials?.identifier ?? "").trim();
        const password = String(credentials?.password ?? "");

        if (!identifier || !password) {
          return null;
        }

        try {
          const result = await loginExpoUser(identifier, password);

          return {
            id: result.id,
            email: result.email,
            name: result.name,
            role: result.expoAccess,
            authProvider: result.authProvider,
            strapiRoleName: result.strapiRoleName,
            strapiRoleType: result.strapiRoleType,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.authProvider =
          user.role === "attendee"
            ? "attendee-otp"
            : ((user as { authProvider?: "strapi-admin" }).authProvider ?? "strapi-admin");

        if (user.role === "admin" || user.role === "staff") {
          token.adminId = user.id;
          token.adminName = user.name;
          token.expoAccess = user.role;
          token.strapiRoleName = (user as { strapiRoleName?: string }).strapiRoleName;
          token.strapiRoleType = (user as { strapiRoleType?: string }).strapiRoleType;
          delete token.attendeeId;
          delete token.registrationReference;
        } else {
          token.attendeeId = user.id;
          token.registrationReference = (user as { registrationReference?: string }).registrationReference;
          delete token.adminId;
          delete token.adminName;
          delete token.expoAccess;
          delete token.strapiRoleName;
          delete token.strapiRoleType;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.attendeeId ?? token.adminId ?? "");
        session.user.registrationReference = String(token.registrationReference ?? "");
        session.user.role =
          token.authProvider === "attendee-otp"
            ? "attendee"
            : (String(token.expoAccess ?? "staff") as "admin" | "staff" | "attendee");
        session.user.strapiJwt = "";
        session.user.strapiRoleName =
          token.authProvider === "attendee-otp" ? "" : String(token.strapiRoleName ?? "");
        session.user.strapiRoleType =
          token.authProvider === "attendee-otp" ? "" : String(token.strapiRoleType ?? "");
      }

      return session;
    },
  },
};
