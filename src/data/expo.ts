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

export const exhibitors: Exhibitor[] = [
  {
    slug: "weiyan",
    logo: "WG",
    booth: "Booth CS3",
    name: "Weiyan Group",
    country: "China",
    countryFilter: "china",
    origin: "🇨🇳 China",
    category: "machinery",
    business: "Agricultural machinery and processing equipment",
    cardDescription: "Agricultural machinery & processing equipment across key value chains.",
    intro:
      "Weiyan Group develops practical agricultural machinery and processing systems designed to improve productivity across grain, horticulture, and post-harvest value chains.",
    products: ["Grain processing lines", "Feed milling equipment", "Post-harvest machinery", "Small-scale tractors"],
    services: ["Equipment installation", "Operator training", "Maintenance support"],
    contact: "Li Wei",
    phone: "+86 731 5550 0188",
    email: "expo@weiyangroup.cn",
  },
  {
    slug: "liangbadao",
    logo: "HL",
    booth: "Booth A47",
    name: "Hunan Liangbadao Technology",
    country: "China",
    countryFilter: "china",
    origin: "🇨🇳 China",
    category: "produce",
    business: "Plant nutrition and precision agriculture inputs",
    cardDescription: "Plant nutrition technology and precision agriculture inputs.",
    intro:
      "Hunan Liangbadao Technology supplies plant nutrition products and precision input systems that help commercial growers improve crop quality, input efficiency, and yields.",
    products: ["Specialty fertilizers", "Foliar nutrition", "Soil conditioners", "Precision dosing systems"],
    services: ["Crop nutrition programmes", "Technical field support"],
    contact: "Chen Mei",
    phone: "+86 731 5550 0247",
    email: "africa@liangbadao.cn",
  },
  {
    slug: "xianglian",
    logo: "XT",
    booth: "Booth A20",
    name: "Xianglian Tianxia New Material Technology",
    country: "China",
    countryFilter: "china",
    origin: "🇨🇳 China",
    category: "technology",
    business: "Nursery substrates and propagation materials",
    cardDescription: "Cocopeat and seed propagation materials for modern nurseries.",
    intro:
      "Xianglian Tianxia produces modern growing media and propagation materials for nurseries, greenhouse growers, and horticultural operations seeking reliable crop establishment.",
    products: ["Cocopeat blocks", "Seedling trays", "Propagation plugs", "Growing media"],
    services: ["Substrate specification", "Bulk export fulfilment"],
    contact: "Zhang Rui",
    phone: "+86 755 5550 1420",
    email: "sales@xianglian-tech.cn",
  },
  {
    slug: "wanzheng",
    logo: "HW",
    booth: "Booth B08",
    name: "Hunan Wanzheng Machinery",
    country: "China",
    countryFilter: "china",
    origin: "🇨🇳 China",
    category: "machinery",
    business: "Smallholder machinery and irrigation systems",
    cardDescription: "Smallholder-focused farming machinery and irrigation systems.",
    intro:
      "Hunan Wanzheng Machinery designs accessible equipment for small and medium farms, with a focus on efficient land preparation, irrigation, harvesting, and processing.",
    products: ["Power tillers", "Irrigation pumps", "Mini harvesters", "Shelling machines"],
    services: ["Dealer support", "Spare parts supply", "Technical training"],
    contact: "Wang Jun",
    phone: "+86 731 5550 0808",
    email: "export@wanzheng.cn",
  },
  {
    slug: "kofa",
    logo: "KOFA",
    booth: "Booth B12",
    name: "Kenya Organic Farmers Association",
    country: "Kenya",
    countryFilter: "kenya",
    origin: "🇰🇪 Kenya",
    category: "produce",
    business: "Organic farming, certification, and market linkage",
    cardDescription: "Organic produce certification, export readiness, and market linkage.",
    intro:
      "The Kenya Organic Farmers Association supports producers transitioning to organic agriculture through training, certification readiness, advocacy, and connections to premium markets.",
    products: ["Certified organic produce", "Organic farm inputs"],
    services: ["Farmer training", "Certification readiness", "Market linkage", "Producer advocacy"],
    contact: "Grace Wanjiku",
    phone: "+254 720 555 112",
    email: "info@kofa.or.ke",
  },
  {
    slug: "global-star",
    logo: "GS",
    booth: "Booth C05",
    name: "Global Star Agri Inputs",
    country: "Africa",
    countryFilter: "africa",
    origin: "🌍 Africa",
    category: "health",
    business: "Veterinary products and animal health solutions",
    cardDescription: "Veterinary products and animal health solutions across East Africa.",
    intro:
      "Global Star Agri Inputs supplies animal health products and technical support for livestock producers, veterinary professionals, and distributors across East Africa.",
    products: ["Veterinary medicines", "Mineral supplements", "Biosecurity products", "Animal care equipment"],
    services: ["Veterinary advisory", "Distributor support", "Product training"],
    contact: "Daniel Otieno",
    phone: "+254 711 555 205",
    email: "connect@globalstaragri.com",
  },
];

export const vacantBooths = [
  {
    badge: "Booth Available",
    title: "Your Company Here",
    description: "Premium booth in the Technology & Innovation zone.",
  },
  {
    badge: "Booth Available",
    title: "Your Company Here",
    description: "Corner booth with high visitor footfall.",
  },
];

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

export const supportUnits: SupportUnit[] = [
  {
    slug: "ministry-agriculture-livestock",
    title: "Ministry of Agriculture & Livestock",
    group: "Government",
    country: "Kenya",
    description:
      "Kenya's national ministry responsible for agricultural policy, food security, crop development, livestock production, and sector coordination. It supports initiatives that strengthen resilient farming systems, improve market access, and accelerate sustainable agricultural growth.",
    logoSrc: "/assets/support-units/ministry-agriculture-kenya.jpg",
    alt: "Ministry of Agriculture and Livestock logo",
  },
  {
    slug: "kephis",
    title: "Kenya Plant Health Inspectorate Service",
    group: "Government",
    country: "Kenya",
    description:
      "KEPHIS is Kenya's regulatory body for plant health, seed quality, and agricultural produce standards. It protects the country's crops from pests and diseases while supporting safe trade through inspection, certification, and laboratory services.",
    logoSrc: "/assets/support-units/kephis.png",
    alt: "Kenya Plant Health Inspectorate Service logo",
  },
  {
    slug: "kentrade",
    title: "KenTrade",
    group: "Government",
    country: "Kenya",
    description:
      "KenTrade facilitates cross-border commerce through Kenya's National Electronic Single Window System. The agency simplifies trade processes, connects regulatory agencies, and helps agricultural exporters move goods efficiently through regional and international markets.",
    logoSrc: "/assets/support-units/kentrade.jpg",
    alt: "KenTrade logo",
  },
  {
    slug: "kra",
    title: "Kenya Revenue Authority",
    group: "Government",
    country: "Kenya",
    description:
      "The Kenya Revenue Authority administers tax and customs services across the country. Its trade and customs functions support compliant import and export activity for agricultural products, inputs, machinery, and related services.",
    logoSrc: "/assets/support-units/kra.webp",
    alt: "Kenya Revenue Authority logo",
  },
  {
    slug: "kncci",
    title: "Kenya National Chamber of Commerce & Industry",
    group: "Industry",
    country: "Kenya",
    description:
      "KNCCI represents and advocates for businesses across Kenya. Through its national network, it connects enterprises to markets, policy dialogue, investment opportunities, and partnerships that strengthen agricultural value chains.",
    logoSrc: "/assets/support-units/kncci.png",
    alt: "Kenya National Chamber of Commerce and Industry logo",
  },
  {
    slug: "kenya-flower-council",
    title: "Kenya Flower Council",
    group: "Industry",
    country: "Kenya",
    description:
      "The Kenya Flower Council is the leading association for Kenya's floriculture industry. It promotes responsible production, market access, sustainability standards, and the global competitiveness of flowers grown in Kenya.",
    logoSrc: "/assets/support-units/kenya-flower-council.png",
    alt: "Kenya Flower Council logo",
  },
  {
    slug: "fpeak",
    title: "Fresh Produce Exporters Association of Kenya",
    group: "Industry",
    country: "Kenya",
    description:
      "FPEAK brings together growers, exporters, and service providers in Kenya's fresh produce sector. It supports quality standards, export readiness, market development, and sustainable production for fruits, vegetables, and herbs.",
    logoSrc: "/assets/support-units/fpeak.png",
    alt: "Fresh Produce Exporters Association of Kenya logo",
  },
  {
    slug: "eagc",
    title: "East Africa Grain Council",
    group: "Industry",
    country: "East Africa",
    description:
      "The East Africa Grain Council supports structured grain trade across the region. It connects value-chain actors, advances quality standards, improves market information, and promotes efficient, inclusive grain markets.",
    logoSrc: "/assets/support-units/eagc.png",
    alt: "East Africa Grain Council logo",
  },
  {
    slug: "african-agri-magazine",
    title: "African Agri Magazine",
    group: "Media",
    country: "Africa",
    description:
      "African Agri Magazine covers the people, technologies, markets, and ideas shaping agriculture across the continent. Its reporting connects producers, agribusiness leaders, suppliers, and sector decision-makers.",
    logoSrc: "/assets/support-units/african-agri-magazine.png",
    alt: "African Agri Magazine logo",
  },
  {
    slug: "kbc-agricultural-programming",
    title: "KBC Agricultural Programming",
    group: "Media",
    country: "Kenya",
    description:
      "KBC Agricultural Programming brings practical farming information and sector conversations to audiences across Kenya. Its coverage helps producers access knowledge, discover opportunities, and engage with agricultural policy and innovation.",
    logoSrc: "/assets/support-units/kbc.png",
    alt: "Kenya Broadcasting Corporation logo",
  },
  {
    slug: "farm-radio-international",
    title: "Farm Radio International",
    group: "Media",
    country: "International",
    description:
      "Farm Radio International works with broadcasters to deliver trusted, practical agricultural information to rural communities. Its programs help farmers make informed decisions, adapt to change, and strengthen their livelihoods.",
    logoSrc: "/assets/support-units/farm-radio-international.png",
    alt: "Farm Radio International logo",
  },
  {
    slug: "african-farming",
    title: "African Farming",
    group: "Media",
    country: "Africa",
    description:
      "African Farming shares sector news, technology, production insights, and market opportunities with agricultural professionals across Africa. It supports informed decision-making throughout the farming value chain.",
    logoSrc: "/assets/support-units/african-farming.webp",
    alt: "African Farming logo",
  },
];

export const programmeDays = [
  {
    id: "tue",
    label: "Tue 27",
    heading: "Tuesday, 27th October",
    hours: "09:00 – 16:00",
    sessions: [
      ["09:00", "Opening Ceremony & Official Welcome", "Remarks from the Cabinet Secretary, Agriculture. Ribbon-cutting and expo floor opening.", "Plenary"],
      ["10:30", "Keynote: Africa's Agricultural Decade", "The macro opportunity — where capital, policy, and innovation converge on the continent.", "Keynote"],
      ["12:00", "Exhibitor Introduction & Networking Lunch", "Guided tour of exhibition zones followed by a hosted lunch for all registered participants.", "Networking"],
      ["14:00", "B2B Speed Networking — Session 1", "12-minute structured meetings. Pre-matched by value chain and market interest.", "B2B"],
      ["16:00", "Panel: Market Access & Export Readiness", "Standards, logistics, and the practical path from farm to international shelf.", "Panel"],
    ],
  },
  {
    id: "wed",
    label: "Wed 28",
    heading: "Wednesday, 28th October",
    hours: "09:00 – 17:00",
    sessions: [
      ["09:00", "Seminar: Digital Agriculture & Precision Farming", "From satellite imaging to soil sensors — tools now available for smallholders.", "Seminar"],
      ["11:00", "Value Chain Workshop: Livestock & Meat", "Deep-dive into cold chain gaps, slaughter standards, and regional export corridors.", "Workshop"],
      ["13:00", "B2B Speed Networking — Session 2", "Focus: Machinery & Technology buyers meeting regional distributors.", "B2B"],
      ["15:00", "Innovation Showcase & Startup Pitches", "Eight agri-tech startups pitch to a panel of investors and support units.", "Innovation"],
      ["17:00", "Awards Ceremony: Agri-Africa Excellence Awards", "Recognising the year's outstanding exhibitors, innovators, and partnerships.", "Awards"],
    ],
  },
  {
    id: "thu",
    label: "Thu 29",
    heading: "Thursday, 29th October",
    hours: "09:00 – 19:00",
    sessions: [
      ["09:00", "Seminar: Agri-Finance & Investment Landscape", "Blended finance, DFI participation, and catalytic capital entering African agri-business.", "Seminar"],
      ["11:00", "Value Chain Workshop: Horticulture & Exports", "GlobalG.A.P. certification, EU market requirements, and air-freight logistics.", "Workshop"],
      ["13:00", "International Trade Delegation Meetings", "Bilateral meetings between African producers and procurement teams from 6 countries.", "Trade"],
      ["16:00", "B2B Speed Networking — Session 3", "Focus: Produce & Commodities. Buyers meeting growers and cooperatives.", "B2B"],
      ["19:00", "Gala Cultural Evening", "Celebrating African agricultural heritage — hosted dinner for all delegates.", "Cultural"],
    ],
  },
  {
    id: "fri",
    label: "Fri 30",
    heading: "Friday, 30th October",
    hours: "09:00 – 15:00",
    sessions: [
      ["09:00", "Closing Keynote: Seeds of the Next Decade", "The commitments made this week — and what comes next for African agriculture.", "Keynote"],
      ["11:00", "Deal-Signing & MOU Ceremony", "Formal signing of partnerships, trade agreements, and cooperation memoranda.", "Ceremony"],
      ["13:00", "Closing Luncheon", "Hosted farewell lunch. Final networking. Brochure and contact exchange.", "Networking"],
      ["15:00", "Official Closing & 2027 Announcement", "Closing address and first glimpse of the 2027 AIAE Expo dates and theme.", "Plenary"],
    ],
  },
] as const;

export function getExhibitorBySlug(slug: string) {
  return exhibitors.find((item) => item.slug === slug);
}
