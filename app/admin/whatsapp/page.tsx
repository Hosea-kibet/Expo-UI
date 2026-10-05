import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { AdminWhatsAppClient } from "@/src/components/admin-sms-client";
import { getAdminSession } from "@/src/lib/server/admin-session";

export const metadata: Metadata = { title: "Admin WhatsApp - Agri Africa" };

export default async function AdminWhatsAppPage() {
  const session = await getAdminSession();

  if (!session) redirect("/admin/login");

  return <AdminWhatsAppClient adminName={session.user.name ?? ""} />;
}
