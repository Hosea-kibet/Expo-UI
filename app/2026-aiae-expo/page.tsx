import type { Metadata } from "next";
import ExpoClient from "@/src/components/expo-client";
import { getExpoCmsSnapshot } from "@/src/lib/expo-cms";
import { getHomepageSnapshot } from "@/src/lib/homepage-cms";

export const metadata: Metadata = {
  title: "2026 Africa International Agricultural Expo | AIAE",
  description:
    "Explore the 2026 Africa International Agricultural Expo programme, exhibitors, speakers, partners, and visitor information for 23–25 October at KICC, Nairobi.",
  alternates: {
    canonical: "/2026-aiae-expo",
  },
};

export default async function ExpoPage() {
  const [snapshot, homepage] = await Promise.all([
    getExpoCmsSnapshot(),
    getHomepageSnapshot(),
  ]);

  return <ExpoClient initialData={snapshot} homepageData={homepage} />;
}
