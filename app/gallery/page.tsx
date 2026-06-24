import type { Metadata } from "next";
import GalleryClient from "@/src/components/gallery-client";
import { getGallerySnapshot } from "@/src/lib/gallery-cms";
import { getHomepageSnapshot } from "@/src/lib/homepage-cms";

export const metadata: Metadata = {
  title: "Past Events Gallery - Agri Africa",
};

export default async function GalleryPage() {
  const [homepage, galleryItems] = await Promise.all([
    getHomepageSnapshot(),
    getGallerySnapshot(),
  ]);

  return <GalleryClient homepage={homepage} items={galleryItems} />;
}
