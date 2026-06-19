import type { Metadata } from "next";
import ExpoClient from "@/src/components/expo-client";
import { getExpoCmsSnapshot } from "@/src/lib/expo-cms";

export const metadata: Metadata = {
  title: "2026 - Africa International Agricultural Expo - Agri Africa",
};

export default async function ExpoPage() {
  const snapshot = await getExpoCmsSnapshot();
  return <ExpoClient initialData={snapshot} />;
}
