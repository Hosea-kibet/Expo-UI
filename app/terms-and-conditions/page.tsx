import type { Metadata } from "next";
import { LegalPage } from "@/src/components/legal-page";
import { getTermsAndConditionsSnapshot } from "@/src/lib/legal-cms";
import { getHomepageSnapshot } from "@/src/lib/homepage-cms";

export const metadata: Metadata = { title: "Terms and Conditions - Agri Africa" };

export default async function TermsAndConditionsPage() {
  const [homepage, terms] = await Promise.all([
    getHomepageSnapshot(),
    getTermsAndConditionsSnapshot(),
  ]);

  return (
    <LegalPage
      title={terms.title}
      content={terms.content}
      homepage={homepage}
    />
  );
}
