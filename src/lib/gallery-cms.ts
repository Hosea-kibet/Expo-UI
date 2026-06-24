import { normalizeStrapiAssetUrl } from "@/src/lib/strapi-media";
import { getGalleryItemsContent } from "@/src/lib/strapi-content";

export type GallerySnapshotItem = {
  year: string;
  type: "image" | "video";
  src: string;
  poster?: string;
  title: string;
  caption: string;
  alt: string;
  wide: boolean;
};

function normalizeAssetUrl(value?: string | null) {
  return normalizeStrapiAssetUrl(value);
}

function extractMediaUrl(media: unknown) {
  if (!media || typeof media !== "object") return undefined;

  const record = media as {
    url?: unknown;
    formats?: {
      large?: { url?: unknown };
      medium?: { url?: unknown };
      small?: { url?: unknown };
      thumbnail?: { url?: unknown };
    };
    data?: unknown;
  };

  if (typeof record.url === "string") {
    return normalizeAssetUrl(record.url);
  }

  const preferredFormats = [
    record.formats?.large?.url,
    record.formats?.medium?.url,
    record.formats?.small?.url,
    record.formats?.thumbnail?.url,
  ];

  for (const candidate of preferredFormats) {
    if (typeof candidate === "string") {
      return normalizeAssetUrl(candidate);
    }
  }

  if (record.data && typeof record.data === "object") {
    return extractMediaUrl(record.data);
  }

  return undefined;
}

export async function getGallerySnapshot(): Promise<GallerySnapshotItem[]> {
  const response = await getGalleryItemsContent();

  if (!Array.isArray(response.data)) {
    return [];
  }

  const items: GallerySnapshotItem[] = [];

  response.data.forEach((item) => {
    const record = item as Record<string, unknown>;
    if (
      typeof record.title !== "string" ||
      typeof record.year !== "number" ||
      (record.mediaType !== "image" && record.mediaType !== "video")
    ) {
      return;
    }

    const src = extractMediaUrl(record.media);
    if (!src) return;

    const poster = extractMediaUrl(record.poster);

    items.push({
      year: String(record.year),
      type: record.mediaType,
      src,
      ...(poster ? { poster } : {}),
      title: record.title,
      caption: typeof record.caption === "string" ? record.caption : "",
      alt:
        typeof record.alt === "string" && record.alt.length > 0
          ? record.alt
          : record.title,
      wide: record.wide === true,
    });
  });

  return items;
}
