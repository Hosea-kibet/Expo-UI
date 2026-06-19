import type { Metadata } from "next";
import { MembersPortalClient } from "@/src/components/members-portal-client";

export const metadata: Metadata = { title: "Members Portal - Agri Africa" };

export default async function MembersPortalPage({
  searchParams,
}: {
  searchParams: Promise<{ company?: string }>;
}) {
  const { company } = await searchParams;
  return <MembersPortalClient company={company} />;
}
