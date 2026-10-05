import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { AdminSmsClient } from "@/src/components/admin-sms-client";
import { getAdminSession } from "@/src/lib/server/admin-session";

export const metadata: Metadata = { title: "Admin SMS - Agri Africa" };

export default async function AdminSmsPage() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  return <AdminSmsClient adminName={session.user.name ?? ""} />;
}
