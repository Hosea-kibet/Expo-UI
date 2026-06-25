import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      registrationReference: string;
      role: "attendee" | "staff" | "admin";
      strapiJwt: string;
      strapiRoleName: string;
      strapiRoleType: string;
    };
  }

  interface User {
    registrationReference?: string;
    role?: "attendee" | "staff" | "admin";
    authProvider?: "strapi-admin" | "strapi-staff";
    strapiJwt?: string;
    strapiRoleName?: string;
    strapiRoleType?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    authProvider?: "attendee-otp" | "strapi-admin" | "strapi-staff";
    attendeeId?: string;
    registrationReference?: string;
    adminId?: string;
    adminName?: string | null;
    strapiJwt?: string;
    expoAccess?: "staff" | "admin";
    strapiRoleName?: string;
    strapiRoleType?: string;
  }
}
