import { getStrapiCollection, getStrapiSingle } from "@/src/lib/strapi-client";

export type StrapiEntity<T> = {
  id: number;
  documentId?: string;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string | null;
  [key: string]: unknown;
} & T;

export type HomepageContent = {
  eyebrow?: string;
  title: string;
  highlightText?: string;
  subtitle?: string;
  heroImage?: unknown;
  heroVideo?: unknown;
  topbarTagline?: string;
  heroEyebrowPrimary?: string;
  heroEyebrowSecondary?: string;
  heroPills?: unknown;
  organiserLabel?: string;
  organisers?: unknown;
  eventStatus?: string;
  eventName?: string;
  eventFullTitle?: string;
  eventDates?: string;
  eventVenue?: string;
  registrationEyebrow?: string;
  registrationTitle?: string;
  registrationDates?: string;
  registrationVenue?: string;
  registrationBody?: string;
  footerBrandCopy?: string;
  partners?: unknown;
  socialLinks?: unknown;
  phone?: string;
  email?: string;
  address?: string;
  legalLeft?: string;
  legalRight?: string;
};

export type PrivacyPolicyContent = {
  title?: string;
  content?: string;
};

export type TermsAndConditionContent = {
  title?: string;
  content?: string;
};

export type ExpoPageContent = {
  theme?: string;
  dates?: string;
  venue?: string;
  overviewIntro?: string;
  overviewBody?: string;
  overviewGuests?: unknown;
  overviewObjectives?: unknown;
  overviewCategories?: unknown;
  floorPlan?: unknown;
  floorPlanUrl?: string;
};

export type ExhibitorContent = {
  name: string;
  slug: string;
  logo?: unknown;
  booth?: string;
  country?: string;
  countryFilter?: "china" | "kenya" | "africa";
  origin?: string;
  category?: "machinery" | "technology" | "produce" | "health";
  business?: string;
  intro?: string;
  products?: Array<string | { value?: string }>;
  services?: Array<string | { value?: string }>;
  contact?: string;
  phone?: string;
  email?: string;
  brochure?: unknown;
};

export type SupportUnitContent = {
  title: string;
  slug: string;
  group?: "Government" | "Industry" | "Media";
  country?: string;
  description?: string;
  logo?: unknown;
  logoAlt?: string;
};

export type ProgrammeSessionContent = {
  time: string;
  title: string;
  description?: string;
  tag?: string;
};

export type ProgrammeDayContent = {
  label: string;
  heading: string;
  hours?: string;
  sessions?: ProgrammeSessionContent[];
};

export type GalleryItemContent = {
  title: string;
  slug?: string;
  year: number | string;
  mediaType: "image" | "video";
  caption?: string;
  alt?: string;
  wide?: boolean;
  sortOrder?: number;
  media?: unknown;
  poster?: unknown;
  videoPoster?: unknown;
};

export async function getHomepageContent() {
  return getStrapiSingle<{ data: StrapiEntity<HomepageContent> | null }>("homepage", {
    "populate[heroImage]": true,
    "populate[heroVideo]": true,
    "populate[heroPills]": true,
    "populate[organisers][populate]": "logo",
    "populate[partners][populate]": "logo",
    "populate[socialLinks]": true,
  });
}

export async function getPrivacyPolicyContent() {
  return getStrapiSingle<{ data: StrapiEntity<PrivacyPolicyContent> | null }>("privacy-policy");
}

export async function getTermsAndConditionContent() {
  return getStrapiSingle<{ data: StrapiEntity<TermsAndConditionContent> | null }>(
    "terms-and-condition",
  );
}

export async function getExpoPageContent() {
  return getStrapiSingle<{ data: StrapiEntity<ExpoPageContent> | null }>("expo-page", {
    "populate[overviewGuests][populate][imageUrl]": true,
    "populate[overviewObjectives]": true,
    "populate[overviewCategories]": true,
    "populate[floorPlan]": true,
  });
}

export async function getExhibitorsContent(params?: Record<string, string>) {
  return getStrapiCollection<{ data: Array<StrapiEntity<ExhibitorContent>> }>("exhibitors", {
    populate: "*",
    "sort[0]": "name:asc",
    ...params,
  });
}

export async function getSupportUnitsContent() {
  return getStrapiCollection<{ data: Array<StrapiEntity<SupportUnitContent>> }>("support-units", {
    populate: "*",
    "sort[0]": "title:asc",
  });
}

export async function getProgrammeDaysContent() {
  return getStrapiCollection<{ data: Array<StrapiEntity<ProgrammeDayContent>> }>("programme-days", {
    populate: "*",
    "sort[0]": "label:asc",
  });
}

export async function getGalleryItemsContent() {
  return getStrapiCollection<{ data: Array<StrapiEntity<GalleryItemContent>> }>("gallery-items", {
    populate: "*",
    "sort[0]": "year:desc",
    "sort[1]": "sortOrder:asc",
    "sort[2]": "title:asc",
  });
}
