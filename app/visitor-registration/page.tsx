import type { Metadata } from "next";
import { VisitorRegistrationClient } from "@/src/components/visitor-registration-client";
import { getExpoRegistrationDetails } from "@/src/lib/expo-cms";
import { getHomepageSnapshot } from "@/src/lib/homepage-cms";

export const metadata: Metadata = { title: "Visitor Registration - 2026 - AIAE" };

export default async function VisitorRegistrationPage() {
  const [expoPage, homepage] = await Promise.all([
    getExpoRegistrationDetails(),
    getHomepageSnapshot(),
  ]);

  return (
    <VisitorRegistrationClient
      expoPage={expoPage}
      registration={{ eventName: homepage.eventName }}
    />
  );
}
