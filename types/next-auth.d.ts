import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      registrationReference: string;
    };
  }

  interface User {
    registrationReference?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    attendeeId?: string;
    registrationReference?: string;
  }
}
