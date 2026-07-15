import { getHomepageContent } from "@/src/lib/strapi-content";
import { normalizeStrapiAssetUrl } from "@/src/lib/strapi-media";

type HomepagePartner = {
  name: string;
  logoUrl: string;
  title: string;
  about: string;
  involvement: string;
  url: string;
};

type HomepageSocialLink = {
  platform: "facebook" | "instagram" | "youtube" | "linkedin";
  url: string;
};

type HomepageOrganiser = {
  name: string;
  logoUrl: string;
};

export type HomepageSnapshot = {
  eyebrow: string;
  title: string;
  highlightText: string;
  subtitle: string;
  topbarTagline: string;
  heroEyebrowPrimary: string;
  heroEyebrowSecondary: string;
  heroPills: string[];
  organiserLabel: string;
  organisers: HomepageOrganiser[];
  heroImageUrl: string;
  heroVideoUrl: string;
  eventStatus: string;
  eventName: string;
  eventFullTitle: string;
  eventDates: string;
  eventVenue: string;
  registrationEyebrow: string;
  registrationTitle: string;
  registrationDates: string;
  registrationVenue: string;
  registrationBody: string;
  footerBrandCopy: string;
  partners: HomepagePartner[];
  socialLinks: HomepageSocialLink[];
  phone: string;
  email: string;
  address: string;
  legalLeft: string;
  legalRight: string;
};

function normalizeAssetUrl(value?: string | null) {
  return normalizeStrapiAssetUrl(value);
}

function normalizeMediaUrl(media: unknown) {
  if (!media || typeof media !== "object") return undefined;
  const direct = media as { url?: unknown };
  if (typeof direct.url === "string") return normalizeAssetUrl(direct.url);

  const wrapped = media as { data?: unknown };
  if (wrapped.data && typeof wrapped.data === "object") {
    const data = wrapped.data as { url?: unknown };
    if (typeof data.url === "string") return normalizeAssetUrl(data.url);
  }

  return undefined;
}

function normalizeHeroPills(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const label = (item as Record<string, unknown>).label;
      return typeof label === "string" && label ? label : null;
    })
    .filter((item): item is string => item !== null);
}

function normalizeOrganisers(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const logoUrl = normalizeMediaUrl(record.logo);
      if (typeof record.name !== "string" || !record.name || !logoUrl) return null;
      return { name: record.name, logoUrl };
    })
    .filter((item): item is HomepageOrganiser => item !== null);
}

function normalizePartners(value: unknown) {
  if (!Array.isArray(value)) return [];
  const items = value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const logoUrl = normalizeMediaUrl(record.logo);
      if (typeof record.name !== "string" || typeof record.title !== "string" || !logoUrl) return null;
      return {
        name: record.name,
        logoUrl,
        title: record.title,
        about: typeof record.about === "string" ? record.about : "",
        involvement: typeof record.involvement === "string" ? record.involvement : "",
        url: typeof record.websiteUrl === "string" ? record.websiteUrl : "#",
      };
    })
    .filter((item): item is HomepagePartner => item !== null);

  return items;
}

function normalizeSocialLinks(value: unknown) {
  if (!Array.isArray(value)) return [];
  const items = value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      if (
        record.platform !== "facebook" &&
        record.platform !== "instagram" &&
        record.platform !== "youtube" &&
        record.platform !== "linkedin"
      ) {
        return null;
      }

      return {
        platform: record.platform,
        url: typeof record.url === "string" ? record.url : "#",
      };
    })
    .filter((item): item is HomepageSocialLink => item !== null);

  return items;
}

export async function getHomepageSnapshot(): Promise<HomepageSnapshot> {
  const response = await getHomepageContent();
  const data =
    response.data && typeof response.data === "object"
      ? (response.data as Record<string, unknown>)
      : null;

  if (!data) {
    throw new Error("Homepage content is missing in Strapi.");
  }

  const snapshot: HomepageSnapshot = {
    eyebrow: typeof data.eyebrow === "string" ? data.eyebrow : "",
    title: typeof data.title === "string" ? data.title : "",
    highlightText: typeof data.highlightText === "string" ? data.highlightText : "",
    subtitle: typeof data.subtitle === "string" ? data.subtitle : "",
    topbarTagline: typeof data.topbarTagline === "string" ? data.topbarTagline : "",
    heroEyebrowPrimary: typeof data.heroEyebrowPrimary === "string" ? data.heroEyebrowPrimary : "",
    heroEyebrowSecondary: typeof data.heroEyebrowSecondary === "string" ? data.heroEyebrowSecondary : "",
    heroPills: normalizeHeroPills(data.heroPills),
    organiserLabel: typeof data.organiserLabel === "string" ? data.organiserLabel : "",
    organisers: normalizeOrganisers(data.organisers),
    heroImageUrl: normalizeMediaUrl(data.heroImage) ?? "",
    heroVideoUrl: normalizeMediaUrl(data.heroVideo) ?? "",
    eventStatus: typeof data.eventStatus === "string" ? data.eventStatus : "",
    eventName: typeof data.eventName === "string" ? data.eventName : "",
    eventFullTitle: typeof data.eventFullTitle === "string" ? data.eventFullTitle : "",
    eventDates: typeof data.eventDates === "string" ? data.eventDates : "",
    eventVenue: typeof data.eventVenue === "string" ? data.eventVenue : "",
    registrationEyebrow: typeof data.registrationEyebrow === "string" ? data.registrationEyebrow : "",
    registrationTitle: typeof data.registrationTitle === "string" ? data.registrationTitle : "",
    registrationDates: typeof data.registrationDates === "string" ? data.registrationDates : "",
    registrationVenue: typeof data.registrationVenue === "string" ? data.registrationVenue : "",
    registrationBody: typeof data.registrationBody === "string" ? data.registrationBody : "",
    footerBrandCopy: typeof data.footerBrandCopy === "string" ? data.footerBrandCopy : "",
    partners: normalizePartners(data.partners),
    socialLinks: normalizeSocialLinks(data.socialLinks),
    phone: typeof data.phone === "string" ? data.phone : "",
    email: typeof data.email === "string" ? data.email : "",
    address: typeof data.address === "string" ? data.address : "",
    legalLeft: typeof data.legalLeft === "string" ? data.legalLeft : "",
    legalRight: typeof data.legalRight === "string" ? data.legalRight : "",
  };

  const missingFields: string[] = [];

  if (!snapshot.title) missingFields.push("title");
  if (!snapshot.highlightText) missingFields.push("highlightText");
  if (!snapshot.subtitle) missingFields.push("subtitle");
  if (!snapshot.topbarTagline) missingFields.push("topbarTagline");
  if (!snapshot.heroEyebrowPrimary) missingFields.push("heroEyebrowPrimary");
  if (!snapshot.heroEyebrowSecondary) missingFields.push("heroEyebrowSecondary");
  if (snapshot.heroPills.length === 0) missingFields.push("heroPills");
  if (!snapshot.organiserLabel) missingFields.push("organiserLabel");
  if (snapshot.organisers.length === 0) missingFields.push("organisers");
  if (!snapshot.heroImageUrl) missingFields.push("heroImage");
  if (!snapshot.heroVideoUrl) missingFields.push("heroVideo");
  if (!snapshot.eventStatus) missingFields.push("eventStatus");
  if (!snapshot.eventName) missingFields.push("eventName");
  if (!snapshot.eventFullTitle) missingFields.push("eventFullTitle");
  if (!snapshot.eventDates) missingFields.push("eventDates");
  if (!snapshot.eventVenue) missingFields.push("eventVenue");
  if (!snapshot.registrationEyebrow) missingFields.push("registrationEyebrow");
  if (!snapshot.registrationTitle) missingFields.push("registrationTitle");
  if (!snapshot.registrationDates) missingFields.push("registrationDates");
  if (!snapshot.registrationVenue) missingFields.push("registrationVenue");
  if (!snapshot.registrationBody) missingFields.push("registrationBody");
  if (!snapshot.footerBrandCopy) missingFields.push("footerBrandCopy");
  if (snapshot.partners.length === 0) missingFields.push("partners");
  if (snapshot.socialLinks.length === 0) missingFields.push("socialLinks");
  if (!snapshot.phone) missingFields.push("phone");
  if (!snapshot.email) missingFields.push("email");
  if (!snapshot.address) missingFields.push("address");
  if (!snapshot.legalLeft) missingFields.push("legalLeft");
  if (!snapshot.legalRight) missingFields.push("legalRight");

  if (missingFields.length > 0) {
    throw new Error(`Homepage content is incomplete in Strapi. Missing fields: ${missingFields.join(", ")}`);
  }

  return snapshot;
}
