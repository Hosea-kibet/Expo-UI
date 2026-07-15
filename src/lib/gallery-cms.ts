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
    attributes?: unknown;
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

  if (record.attributes && typeof record.attributes === "object") {
    return extractMediaUrl(record.attributes);
  }

  return undefined;
}

function normalizeYear(year: unknown) {
  if (typeof year === "number" && Number.isFinite(year)) {
    return String(Math.trunc(year));
  }

  if (typeof year !== "string") return undefined;

  // The CMS year field may be an enumeration label such as "Year 2025".
  const match = year.match(/(?:19|20)\d{2}/);
  return match?.[0];
}

export async function getGallerySnapshot(): Promise<GallerySnapshotItem[]> {
  const response = await getGalleryItemsContent();

  if (!Array.isArray(response.data)) {
    return [];
  }

  const items: GallerySnapshotItem[] = [];

  response.data.forEach((item) => {
    const record = item as Record<string, unknown>;
    const year = normalizeYear(record.year);
    if (
      typeof record.title !== "string" ||
      !year ||
      (record.mediaType !== "image" && record.mediaType !== "video")
    ) {
      return;
    }

    const src = extractMediaUrl(record.media);
    if (!src) return;

    const poster = extractMediaUrl(record.videoPoster ?? record.poster);

    items.push({
      year,
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
