import type { Metadata } from "next";
import { MembersPortalClient } from "@/src/components/members-portal-client";
import { getHomepageSnapshot } from "@/src/lib/homepage-cms";

export const metadata: Metadata = { title: "Members Portal - Agri Africa" };

export default async function MembersPortalPage({
  searchParams,
}: {
  searchParams: Promise<{ company?: string }>;
}) {
  const [{ company }, homepage] = await Promise.all([
    searchParams,
    getHomepageSnapshot(),
  ]);

  return <MembersPortalClient company={company} contactEmail={homepage.email} />;
}
