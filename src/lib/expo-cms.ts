import {
  exhibitors as fallbackExhibitors,
  getExhibitorBySlug as getFallbackExhibitorBySlug,
  programmeDays as fallbackProgrammeDays,
  supportUnits as fallbackSupportUnits,
  type Exhibitor,
  type SupportUnit,
} from "@/src/data/expo";
import {
  getExhibitorsContent,
  getExpoPageContent,
  getProgrammeDaysContent,
  getSupportUnitsContent,
} from "@/src/lib/strapi-content";
import { normalizeStrapiAssetUrl } from "@/src/lib/strapi-media";

type ExpoPageSnapshot = {
  dates: string;
  venue: string;
  theme: string;
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

const fallbackExpoPage: ExpoPageSnapshot = {
  dates: "27–30 October 2026",
  venue: "KICC, Nairobi, Kenya",
  theme:
    "Improving agricultural productivity in Africa through innovations and market access.",
  floorPlanUrl: "/assets/aiae-2026-exhibition-layout.png",
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

function normalizeExhibitor(record: Record<string, unknown>): Exhibitor | null {
  if (typeof record.slug !== "string" || typeof record.name !== "string") return null;

  return {
    slug: record.slug,
    logo: typeof record.logo === "string" ? record.logo : "",
    booth: typeof record.booth === "string" ? record.booth : "",
    name: record.name,
    country: typeof record.country === "string" ? record.country : "",
    countryFilter:
      record.countryFilter === "china" ||
      record.countryFilter === "kenya" ||
      record.countryFilter === "africa"
        ? record.countryFilter
        : "africa",
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
    cardDescription:
      typeof record.cardDescription === "string" ? record.cardDescription : "",
    intro: typeof record.intro === "string" ? record.intro : "",
    products: Array.isArray(record.products)
      ? record.products.filter((item): item is string => typeof item === "string")
      : [],
    services: Array.isArray(record.services)
      ? record.services.filter((item): item is string => typeof item === "string")
      : [],
    contact: typeof record.contact === "string" ? record.contact : "",
    phone: typeof record.phone === "string" ? record.phone : "",
    email: typeof record.email === "string" ? record.email : "",
  };
}

function normalizeSupportUnit(record: Record<string, unknown>): SupportUnit | null {
  if (typeof record.slug !== "string" || typeof record.title !== "string") return null;

  const logoUrl =
    normalizeAssetUrl(typeof record.logoUrl === "string" ? record.logoUrl : undefined) ??
    fallbackSupportUnits.find((item) => item.slug === record.slug)?.logoSrc;

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
    logoSrc: logoUrl ?? "",
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

export async function getExpoCmsSnapshot(): Promise<ExpoCmsSnapshot> {
  try {
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

    return {
      expoPage: {
        dates:
          expoPageRecord && typeof expoPageRecord.dates === "string"
            ? expoPageRecord.dates
            : fallbackExpoPage.dates,
        venue:
          expoPageRecord && typeof expoPageRecord.venue === "string"
            ? expoPageRecord.venue
            : fallbackExpoPage.venue,
        theme:
          expoPageRecord && typeof expoPageRecord.theme === "string"
            ? expoPageRecord.theme
            : fallbackExpoPage.theme,
        floorPlanUrl:
          extractMediaUrl(expoPageRecord?.floorPlan) ??
          normalizeAssetUrl(
            expoPageRecord && typeof expoPageRecord.floorPlanUrl === "string"
              ? expoPageRecord.floorPlanUrl
              : undefined,
          ) ??
          fallbackExpoPage.floorPlanUrl,
      },
      exhibitors: exhibitors.length > 0 ? exhibitors : fallbackExhibitors,
      supportUnits: supportUnits.length > 0 ? supportUnits : fallbackSupportUnits,
      programmeDays:
        programmeDays.length > 0
          ? programmeDays
          : fallbackProgrammeDays.map((item) => ({
              id: item.id,
              label: item.label,
              heading: item.heading,
              hours: item.hours,
              sessions: item.sessions.map((session) => [
                session[0],
                session[1],
                session[2],
                session[3],
              ] as [string, string, string, string]),
            })),
    };
  } catch {
    return {
      expoPage: fallbackExpoPage,
      exhibitors: fallbackExhibitors,
      supportUnits: fallbackSupportUnits,
      programmeDays: fallbackProgrammeDays.map((item) => ({
        id: item.id,
        label: item.label,
        heading: item.heading,
        hours: item.hours,
        sessions: item.sessions.map((session) => [
          session[0],
          session[1],
          session[2],
          session[3],
        ] as [string, string, string, string]),
      })),
    };
  }
}

export async function getExpoExhibitorBySlug(slug: string) {
  const snapshot = await getExpoCmsSnapshot();
  return (
    snapshot.exhibitors.find((item) => item.slug === slug) ??
    getFallbackExhibitorBySlug(slug) ??
    null
  );
}
