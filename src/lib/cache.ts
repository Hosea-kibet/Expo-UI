export const CMS_CACHE_REVALIDATE_SECONDS = Number.parseInt(
  process.env.CMS_CACHE_REVALIDATE_SECONDS ?? "3600",
  10,
);

const CACHE_REVALIDATE_BY_ENDPOINT: Record<string, number> = {
  homepage: Number.parseInt(process.env.CMS_HOMEPAGE_REVALIDATE_SECONDS ?? "3600", 10),
  "expo-page": Number.parseInt(process.env.CMS_EXPO_PAGE_REVALIDATE_SECONDS ?? "21600", 10),
  exhibitors: Number.parseInt(process.env.CMS_EXHIBITORS_REVALIDATE_SECONDS ?? "21600", 10),
  "support-units": Number.parseInt(
    process.env.CMS_SUPPORT_UNITS_REVALIDATE_SECONDS ?? "21600",
    10,
  ),
  "programme-days": Number.parseInt(
    process.env.CMS_PROGRAMME_DAYS_REVALIDATE_SECONDS ?? "21600",
    10,
  ),
  "gallery-items": Number.parseInt(process.env.CMS_GALLERY_REVALIDATE_SECONDS ?? "43200", 10),
};

export const CACHE_TAGS = {
  strapi: "strapi",
  homepage: "strapi:homepage",
  expoPage: "strapi:expo-page",
  exhibitors: "strapi:exhibitors",
  supportUnits: "strapi:support-units",
  programmeDays: "strapi:programme-days",
  galleryItems: "strapi:gallery-items",
} as const;

const STRAPI_TAG_BY_ENDPOINT: Record<string, string> = {
  homepage: CACHE_TAGS.homepage,
  "expo-page": CACHE_TAGS.expoPage,
  exhibitors: CACHE_TAGS.exhibitors,
  "support-units": CACHE_TAGS.supportUnits,
  "programme-days": CACHE_TAGS.programmeDays,
  "gallery-items": CACHE_TAGS.galleryItems,
};

const STRAPI_TAG_BY_MODEL: Record<string, string[]> = {
  homepage: [CACHE_TAGS.homepage],
  "api::homepage.homepage": [CACHE_TAGS.homepage],
  "expo-page": [CACHE_TAGS.expoPage],
  "api::expo-page.expo-page": [CACHE_TAGS.expoPage],
  exhibitor: [CACHE_TAGS.exhibitors],
  exhibitors: [CACHE_TAGS.exhibitors],
  "api::exhibitor.exhibitor": [CACHE_TAGS.exhibitors],
  "support-unit": [CACHE_TAGS.supportUnits],
  "support-units": [CACHE_TAGS.supportUnits],
  "api::support-unit.support-unit": [CACHE_TAGS.supportUnits],
  "programme-day": [CACHE_TAGS.programmeDays],
  "programme-days": [CACHE_TAGS.programmeDays],
  "api::programme-day.programme-day": [CACHE_TAGS.programmeDays],
  "gallery-item": [CACHE_TAGS.galleryItems],
  "gallery-items": [CACHE_TAGS.galleryItems],
  "api::gallery-item.gallery-item": [CACHE_TAGS.galleryItems],
};

export function getStrapiCacheTags(endpoint: string) {
  const normalized = getNormalizedStrapiEndpoint(endpoint);
  const specificTag = STRAPI_TAG_BY_ENDPOINT[normalized];

  return specificTag ? [CACHE_TAGS.strapi, specificTag] : [CACHE_TAGS.strapi];
}

export function getNormalizedStrapiEndpoint(endpoint: string) {
  return endpoint.replace(/^\/+|\/+$/g, "").split("/")[0] ?? "";
}

export function getStrapiRevalidateSeconds(endpoint: string) {
  const normalized = getNormalizedStrapiEndpoint(endpoint);
  return CACHE_REVALIDATE_BY_ENDPOINT[normalized] ?? CMS_CACHE_REVALIDATE_SECONDS;
}

export function getHomepageSnapshotCacheTags() {
  return [CACHE_TAGS.strapi, CACHE_TAGS.homepage];
}

export function getExpoSnapshotCacheTags() {
  return [
    CACHE_TAGS.strapi,
    CACHE_TAGS.expoPage,
    CACHE_TAGS.exhibitors,
    CACHE_TAGS.supportUnits,
    CACHE_TAGS.programmeDays,
  ];
}

export function getGallerySnapshotCacheTags() {
  return [CACHE_TAGS.strapi, CACHE_TAGS.galleryItems];
}

export function getHomepageSnapshotRevalidateSeconds() {
  return getStrapiRevalidateSeconds("homepage");
}

export function getExpoSnapshotRevalidateSeconds() {
  return Math.max(
    getStrapiRevalidateSeconds("expo-page"),
    getStrapiRevalidateSeconds("exhibitors"),
    getStrapiRevalidateSeconds("support-units"),
    getStrapiRevalidateSeconds("programme-days"),
  );
}

export function getGallerySnapshotRevalidateSeconds() {
  return getStrapiRevalidateSeconds("gallery-items");
}

export function getAllCacheTags() {
  return Array.from(new Set(Object.values(CACHE_TAGS)));
}

function normalizeModelName(value: string) {
  return value.trim().toLowerCase();
}

export function getTagsForStrapiModel(model: string) {
  return STRAPI_TAG_BY_MODEL[normalizeModelName(model)] ?? [];
}

export function getTagsForStrapiModels(models: string[]) {
  const tags = models.flatMap((model) => getTagsForStrapiModel(model));
  return Array.from(new Set(tags));
}
