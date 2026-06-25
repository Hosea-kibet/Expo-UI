import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { loginStrapiUser } from "@/src/lib/server/strapi-admin";
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
          const result = await loginStrapiUser(identifier, password);

          if (result.user.blocked) {
            return null;
          }

          return {
            id: `strapi-user-${result.user.id}`,
            email: result.user.email,
            name: result.user.username,
            role: "admin",
            strapiJwt: result.jwt,
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
        token.authProvider = user.role === "admin" ? "strapi-admin" : "attendee-otp";

        if (user.role === "admin") {
          token.adminId = user.id;
          token.adminName = user.name;
          token.strapiJwt = (user as { strapiJwt?: string }).strapiJwt;
          delete token.attendeeId;
          delete token.registrationReference;
        } else {
          token.attendeeId = user.id;
          token.registrationReference = (user as { registrationReference?: string }).registrationReference;
          delete token.adminId;
          delete token.adminName;
          delete token.strapiJwt;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.attendeeId ?? token.adminId ?? "");
        session.user.registrationReference = String(token.registrationReference ?? "");
        session.user.role = token.authProvider === "strapi-admin" ? "admin" : "attendee";
        session.user.strapiJwt = token.authProvider === "strapi-admin" ? String(token.strapiJwt ?? "") : "";
      }

      return session;
    },
  },
};
