import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { AdminSmsClient } from "@/src/components/admin-sms-client";
import { getAdminSession } from "@/src/lib/server/admin-session";
import { listAllAttendees, type AttendeeRecord } from "@/src/lib/server/strapi-admin";

export const metadata: Metadata = { title: "Admin SMS - Agri Africa" };

export default async function AdminSmsPage() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  let attendees: AttendeeRecord[] = [];
  let totalAttendees = 0;
  let initialError = "";

  try {
    attendees = await listAllAttendees(session.user.strapiJwt);
    totalAttendees = attendees.length;
  } catch (error) {
    initialError =
      error instanceof Error
        ? error.message
        : "Unable to load attendees for SMS.";
  }

  return (
    <AdminSmsClient
      initialAttendees={attendees}
      totalAttendees={totalAttendees}
      adminName={session.user.name ?? ""}
      initialError={initialError}
    />
  );
}
