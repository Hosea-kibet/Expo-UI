import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { AdminAttendeesClient } from "@/src/components/admin-attendees-client";
import { getAdminSession } from "@/src/lib/server/admin-session";
import {
  listAttendees,
  type AttendeeListResult,
  type AttendeeRecord,
} from "@/src/lib/server/strapi-admin";

export const metadata: Metadata = { title: "Attendee Admin - Agri Africa" };

export default async function AdminPage() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  let attendees: AttendeeRecord[] = [];
  let pagination: AttendeeListResult["pagination"] = {
    page: 1,
    pageSize: 10,
    pageCount: 1,
    total: 0,
  };
  let initialSearch = "";
  let initialError = "";

  try {
    const result = await listAttendees(session.user.strapiJwt, {
      page: 1,
      pageSize: 10,
      search: "",
    });
    attendees = result.attendees;
    pagination = result.pagination;
    initialSearch = result.search;
  } catch (error) {
    initialError =
      error instanceof Error
        ? error.message
        : "Unable to load attendees. Check the Strapi user permissions for attendee access.";
  }

  return (
    <AdminAttendeesClient
      initialAttendees={attendees}
      initialPagination={pagination}
      initialSearch={initialSearch}
      isAuthenticated
      adminName={session.user.name ?? ""}
      initialError={initialError}
    />
  );
}
