import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      registrationReference: string;
      role: "attendee" | "admin";
      strapiJwt: string;
    };
  }

  interface User {
    registrationReference?: string;
    role?: "attendee" | "admin";
    strapiJwt?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    authProvider?: "attendee-otp" | "strapi-admin";
    attendeeId?: string;
    registrationReference?: string;
    adminId?: string;
    adminName?: string | null;
    strapiJwt?: string;
  }
}
