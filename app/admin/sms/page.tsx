import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { AdminSmsClient } from "@/src/components/admin-sms-client";
import { getAdminSession } from "@/src/lib/server/admin-session";
import { listAttendees, type AttendeeRecord } from "@/src/lib/server/strapi-admin";

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
    const result = await listAttendees(session.user.strapiJwt, {
      page: 1,
      pageSize: 20,
      search: "",
    });

    attendees = result.attendees;
    totalAttendees = result.pagination.total;
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
