import type { Metadata } from "next";
import GalleryClient from "@/src/components/gallery-client";
import { getHomepageSnapshot } from "@/src/lib/homepage-cms";

export const metadata: Metadata = {
  title: "Past Events Gallery - Agri Africa",
};

export default async function GalleryPage() {
  const homepage = await getHomepageSnapshot();

  return <GalleryClient homepage={homepage} />;
}
