const dateUpdate = "New dates will be communicated in due course.";

// Official notice issued on 14 October 2026. Do not set a new date until confirmed.
export const EXPO_STATUS = {
  label: "Postponed to 2027",
  dates: "Early 2027 (tentative)",
  passDates: "Early 2027 (TBC)",
  title: "AIAE 2026 postponed to 2027",
  metadataTitle: "AIAE 2026 Postponed to 2027 | Agri Africa",
  dateUpdate,
  compactSummary: `Tentatively early 2027. ${dateUpdate}`,
  summary: `The Africa International Agricultural Expo (AIAE) 2026 has been postponed, tentatively to early 2027. ${dateUpdate}`,
  poster: "/assets/aiae-2026-postponement-notice.jpeg",
} as const;
