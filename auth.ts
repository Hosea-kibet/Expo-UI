import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
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
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.attendeeId = user.id;
        token.registrationReference = (user as { registrationReference?: string }).registrationReference;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.attendeeId ?? "");
        session.user.registrationReference = String(token.registrationReference ?? "");
      }

      return session;
    },
  },
};
