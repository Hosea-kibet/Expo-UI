import type { Metadata } from "next";
import { AdminAttendeesClient } from "@/src/components/admin-attendees-client";
import { getAdminSession } from "@/src/lib/server/admin-session";
import { listAttendees, type AttendeeRecord } from "@/src/lib/server/strapi-admin";

export const metadata: Metadata = { title: "Attendee Admin - Agri Africa" };

export default async function AdminPage() {
  const session = await getAdminSession();
  let attendees: AttendeeRecord[] = [];
  let initialError = "";

  if (session) {
    try {
      attendees = await listAttendees(session.user.strapiJwt);
    } catch (error) {
      initialError =
        error instanceof Error
          ? error.message
          : "Unable to load attendees. Check the Strapi user permissions for attendee access.";
    }
  }

  return (
    <AdminAttendeesClient
      initialAttendees={attendees}
      isAuthenticated={Boolean(session)}
      adminName={session?.user?.name ?? ""}
      initialError={initialError}
    />
  );
}
