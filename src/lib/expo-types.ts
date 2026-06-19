export type ExhibitorCategory = "machinery" | "technology" | "produce" | "health";
export type ExhibitorCountryFilter = "china" | "kenya" | "africa";

export type Exhibitor = {
  slug: string;
  logo: string;
  booth: string;
  name: string;
  country: string;
  countryFilter: ExhibitorCountryFilter;
  origin: string;
  category: ExhibitorCategory;
  business: string;
  cardDescription: string;
  intro: string;
  products: string[];
  services: string[];
  contact: string;
  phone: string;
  email: string;
};

export type SupportUnitGroup = "Government" | "Industry" | "Media";

export type SupportUnit = {
  slug: string;
  title: string;
  group: SupportUnitGroup;
  country: string;
  description: string;
  logoSrc: string;
  alt: string;
};
