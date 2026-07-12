import {
  getExhibitorsContent,
  getExpoPageContent,
  getProgrammeDaysContent,
  getSupportUnitsContent,
} from "@/src/lib/strapi-content";
import { normalizeStrapiAssetUrl } from "@/src/lib/strapi-media";
import type { Exhibitor, ExhibitorCountryFilter, SupportUnit } from "@/src/lib/expo-types";

type ExpoPageSnapshot = {
  dates: string;
  venue: string;
  theme: string;
  overviewIntro: string;
  overviewBody: string;
  overviewGuests: Array<{
    imageUrl: string;
    alt: string;
    name: string;
    title: string;
    org: string;
  }>;
  overviewObjectives: Array<{
    title: string;
    copy: string;
  }>;
  overviewCategories: string[];
  floorPlanUrl: string;
};

type ProgrammeDay = {
  id: string;
  label: string;
  heading: string;
  hours: string;
  sessions: Array<[string, string, string, string]>;
};

export type ExpoCmsSnapshot = {
  expoPage: ExpoPageSnapshot;
  exhibitors: Exhibitor[];
  supportUnits: SupportUnit[];
  programmeDays: ProgrammeDay[];
};

export type ExhibitorSearchParams = {
  query?: string;
  booth?: string;
  country?: "all" | ExhibitorCountryFilter;
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

export function normalizeExhibitor(record: Record<string, unknown>): Exhibitor | null {
  if (typeof record.slug !== "string" || typeof record.name !== "string") return null;

  return {
    slug: record.slug,
    logo:
      typeof record.logo === "string"
        ? record.logo
        : record.name
            .split(/\s+/)
            .map((part) => part[0])
            .join("")
            .slice(0, 3)
            .toUpperCase(),
    logoSrc: extractMediaUrl(record.logo) ?? "",
    booth: typeof record.booth === "string" ? record.booth : "",
    name: record.name,
    country: typeof record.country === "string" ? record.country : "",
    countryFilter:
      record.country === "China" ? "china" : record.country === "Kenya" ? "kenya" : "africa",
    origin:
      typeof record.origin === "string" && record.origin.length > 0
        ? record.origin.startsWith("🇨🇳") ||
          record.origin.startsWith("🇰🇪") ||
          record.origin.startsWith("🌍")
          ? record.origin
          : record.country === "China"
            ? `🇨🇳 ${record.origin}`
            : record.country === "Kenya"
              ? `🇰🇪 ${record.origin}`
              : `🌍 ${record.origin}`
        : "",
    category:
      record.category === "machinery" ||
      record.category === "technology" ||
      record.category === "produce" ||
      record.category === "health"
        ? record.category
        : "machinery",
    business: typeof record.business === "string" ? record.business : "",
    intro: typeof record.intro === "string" ? record.intro : "",
    products: normalizeListItems(record.products),
    services: normalizeListItems(record.services),
    contact: typeof record.contact === "string" ? record.contact : "",
    phone: typeof record.phone === "string" ? record.phone : "",
    email: typeof record.email === "string" ? record.email : "",
    brochureUrl: extractMediaUrl(record.brochure) ?? "",
  };
}

function normalizeListItems(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (typeof item === "string") return item.trim() ? [item.trim()] : [];
    if (!item || typeof item !== "object") return [];
    const entry = (item as { value?: unknown }).value;
    return typeof entry === "string" && entry.trim() ? [entry.trim()] : [];
  });
}

function normalizeSupportUnit(record: Record<string, unknown>): SupportUnit | null {
  if (typeof record.slug !== "string" || typeof record.title !== "string") return null;

  const logoSrc = extractMediaUrl(record.logo);

  return {
    slug: record.slug,
    title: record.title,
    group:
      record.group === "Government" ||
      record.group === "Industry" ||
      record.group === "Media"
        ? record.group
        : "Government",
    country: typeof record.country === "string" ? record.country : "",
    description: typeof record.description === "string" ? record.description : "",
    logoSrc: logoSrc ?? "",
    alt: typeof record.logoAlt === "string" ? record.logoAlt : record.title,
  };
}

function normalizeProgrammeDay(record: Record<string, unknown>): ProgrammeDay | null {
  if (
    typeof record.dayKey !== "string" ||
    typeof record.label !== "string" ||
    typeof record.heading !== "string"
  ) {
    return null;
  }

  const sessions = Array.isArray(record.sessions)
    ? record.sessions
        .map((session) => {
          if (!session || typeof session !== "object") return null;
          const item = session as Record<string, unknown>;
          if (typeof item.time !== "string" || typeof item.title !== "string") return null;
          return [
            item.time,
            item.title,
            typeof item.description === "string" ? item.description : "",
            typeof item.tag === "string" ? item.tag : "",
          ] as [string, string, string, string];
        })
        .filter((session): session is [string, string, string, string] => session !== null)
    : [];

  return {
    id: record.dayKey,
    label: record.label,
    heading: record.heading,
    hours: typeof record.hours === "string" ? record.hours : "",
    sessions,
  };
}

function normalizeOverviewGuests(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      if (
        typeof record.imageUrl !== "string" ||
        typeof record.alt !== "string" ||
        typeof record.name !== "string" ||
        typeof record.title !== "string" ||
        typeof record.org !== "string"
      ) {
        return null;
      }

      return {
        imageUrl: record.imageUrl,
        alt: record.alt,
        name: record.name,
        title: record.title,
        org: record.org,
      };
    })
    .filter(
      (
        item,
      ): item is {
        imageUrl: string;
        alt: string;
        name: string;
        title: string;
        org: string;
      } => item !== null,
    );
}

function normalizeOverviewObjectives(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      if (typeof record.title !== "string" || typeof record.copy !== "string") return null;

      return {
        title: record.title,
        copy: record.copy,
      };
    })
    .filter((item): item is { title: string; copy: string } => item !== null);
}

function normalizeOverviewCategories(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (typeof item === "string") return item;
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      return typeof record.label === "string" ? record.label : null;
    })
    .filter((item): item is string => typeof item === "string" && item.length > 0);
}

export async function getExpoCmsSnapshot(): Promise<ExpoCmsSnapshot> {
  const [expoPageResponse, exhibitorsResponse, supportUnitsResponse, programmeDaysResponse] =
    await Promise.all([
      getExpoPageContent(),
      getExhibitorsContent(),
      getSupportUnitsContent(),
      getProgrammeDaysContent(),
    ]);

  const expoPageRecord =
    expoPageResponse.data && typeof expoPageResponse.data === "object"
      ? (expoPageResponse.data as Record<string, unknown>)
      : null;

  const exhibitors = Array.isArray(exhibitorsResponse.data)
    ? exhibitorsResponse.data
        .map((item) => normalizeExhibitor(item as Record<string, unknown>))
        .filter((item): item is Exhibitor => item !== null)
    : [];

  const supportUnits = Array.isArray(supportUnitsResponse.data)
    ? supportUnitsResponse.data
        .map((item) => normalizeSupportUnit(item as Record<string, unknown>))
        .filter((item): item is SupportUnit => item !== null)
    : [];

  const programmeDays = Array.isArray(programmeDaysResponse.data)
    ? programmeDaysResponse.data
        .map((item) => normalizeProgrammeDay(item as Record<string, unknown>))
        .filter((item): item is ProgrammeDay => item !== null)
    : [];

  const snapshot: ExpoCmsSnapshot = {
    expoPage: {
      dates:
        expoPageRecord && typeof expoPageRecord.dates === "string"
          ? expoPageRecord.dates
          : "",
      venue:
        expoPageRecord && typeof expoPageRecord.venue === "string"
          ? expoPageRecord.venue
          : "",
      theme:
        expoPageRecord && typeof expoPageRecord.theme === "string"
          ? expoPageRecord.theme
          : "",
      overviewIntro:
        expoPageRecord && typeof expoPageRecord.overviewIntro === "string"
          ? expoPageRecord.overviewIntro
          : "",
      overviewBody:
        expoPageRecord && typeof expoPageRecord.overviewBody === "string"
          ? expoPageRecord.overviewBody
          : "",
      overviewGuests: normalizeOverviewGuests(expoPageRecord?.overviewGuests),
      overviewObjectives: normalizeOverviewObjectives(expoPageRecord?.overviewObjectives),
      overviewCategories: normalizeOverviewCategories(expoPageRecord?.overviewCategories),
      floorPlanUrl:
        extractMediaUrl(expoPageRecord?.floorPlan) ??
        normalizeAssetUrl(
          expoPageRecord && typeof expoPageRecord.floorPlanUrl === "string"
            ? expoPageRecord.floorPlanUrl
            : undefined,
        ) ??
        "",
    },
    exhibitors,
    supportUnits,
    programmeDays,
  };

  const missingFields: string[] = [];

  if (!snapshot.expoPage.dates) missingFields.push("expo-page.dates");
  if (!snapshot.expoPage.venue) missingFields.push("expo-page.venue");
  if (!snapshot.expoPage.theme) missingFields.push("expo-page.theme");
  if (!snapshot.expoPage.overviewIntro) missingFields.push("expo-page.overviewIntro");
  if (!snapshot.expoPage.overviewBody) missingFields.push("expo-page.overviewBody");
  if (!snapshot.expoPage.floorPlanUrl) missingFields.push("expo-page.floorPlan");
  if (snapshot.exhibitors.length === 0) missingFields.push("exhibitors");
  if (snapshot.supportUnits.length === 0) missingFields.push("support-units");
  if (snapshot.supportUnits.some((item) => !item.logoSrc)) missingFields.push("support-units.logo");
  if (snapshot.programmeDays.length === 0) missingFields.push("programme-days");

  if (missingFields.length > 0) {
    throw new Error(`Expo content is incomplete in Strapi. Missing fields: ${missingFields.join(", ")}`);
  }

  return snapshot;
}

export async function getExpoExhibitorBySlug(slug: string) {
  const snapshot = await getExpoCmsSnapshot();
  return snapshot.exhibitors.find((item) => item.slug === slug) ?? null;
}

export async function getFilteredExhibitors({
  query,
  booth,
  country = "all",
}: ExhibitorSearchParams = {}): Promise<Exhibitor[]> {
  const params: Record<string, string> = {};
  const trimmedQuery = query?.trim();
  const trimmedBooth = booth?.trim();

  if (trimmedQuery) {
    params["filters[$or][0][name][$containsi]"] = trimmedQuery;
    params["filters[$or][1][business][$containsi]"] = trimmedQuery;
    params["filters[$or][2][intro][$containsi]"] = trimmedQuery;
  }

  if (trimmedBooth) {
    params["filters[booth][$containsi]"] = trimmedBooth;
  }

  if (country !== "all") {
    params["filters[countryFilter][$eq]"] = country;
  }

  const exhibitorsResponse = await getExhibitorsContent(params);

  return Array.isArray(exhibitorsResponse.data)
    ? exhibitorsResponse.data
        .map((item) => normalizeExhibitor(item as Record<string, unknown>))
        .filter((item): item is Exhibitor => item !== null)
    : [];
}
