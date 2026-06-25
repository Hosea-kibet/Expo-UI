import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { AdminAttendeesClient } from "@/src/components/admin-attendees-client";
import { getAdminSession } from "@/src/lib/server/admin-session";

export const metadata: Metadata = { title: "Admin Login - Agri Africa" };

export default async function AdminLoginPage() {
  const session = await getAdminSession();

  if (session) {
    redirect("/admin");
  }

  return (
    <AdminAttendeesClient
      initialAttendees={[]}
      initialPagination={{
        page: 1,
        pageSize: 25,
        pageCount: 1,
        total: 0,
      }}
      initialSearch=""
      isAuthenticated={false}
      adminName=""
      initialError=""
    />
  );
}
