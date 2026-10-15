import type { Metadata } from "next";
import { EXPO_STATUS } from "@/src/lib/event-status";
import ExpoClient from "@/src/components/expo-client";
import { getExpoCmsSnapshot } from "@/src/lib/expo-cms";
import { getHomepageSnapshot } from "@/src/lib/homepage-cms";

export const metadata: Metadata = {
  title: EXPO_STATUS.metadataTitle,
  description: EXPO_STATUS.summary,
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
