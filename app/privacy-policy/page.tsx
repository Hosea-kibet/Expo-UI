import type { Metadata } from "next";
import { LegalPage } from "@/src/components/legal-page";
import { getPrivacyPolicySnapshot } from "@/src/lib/legal-cms";
import { getHomepageSnapshot } from "@/src/lib/homepage-cms";

export const metadata: Metadata = { title: "Privacy Policy - Agri Africa" };

export default async function PrivacyPolicyPage() {
  const [homepage, policy] = await Promise.all([
    getHomepageSnapshot(),
    getPrivacyPolicySnapshot(),
  ]);

  return (
    <LegalPage
      title={policy.title}
      content={policy.content}
      homepage={homepage}
    />
  );
}
