import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/src/lib/server/admin-session";
import { AdminResendClient } from "@/src/components/admin-resend-client";

export const metadata: Metadata = { title: "Resend Visitor Pass - Agri Africa" };

export default async function AdminResendPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return <AdminResendClient adminName={session.user.name ?? ""} />;
}
