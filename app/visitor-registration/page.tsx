import type { Metadata } from "next";
import { VisitorRegistrationClient } from "@/src/components/visitor-registration-client";
import { getExpoCmsSnapshot } from "@/src/lib/expo-cms";
import { getHomepageSnapshot } from "@/src/lib/homepage-cms";

export const metadata: Metadata = { title: "Visitor Registration - 2026 - AIAE" };

export default async function VisitorRegistrationPage() {
  const [expoSnapshot, homepage] = await Promise.all([
    getExpoCmsSnapshot(),
    getHomepageSnapshot(),
  ]);

  return (
    <VisitorRegistrationClient
      expoPage={expoSnapshot.expoPage}
      registration={{ eventName: homepage.eventName }}
    />
  );
}
