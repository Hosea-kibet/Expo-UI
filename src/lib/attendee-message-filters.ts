import type { AttendeeRecord } from "@/src/lib/server/strapi-admin";

export type AttendeeMessageFilters = {
  attendanceStatus: "" | AttendeeRecord["attendanceStatus"];
  registrationStatus: "" | AttendeeRecord["registrationStatus"];
  country: string;
  city: string;
  gender: string;
  company: string;
};

export const emptyAttendeeMessageFilters: AttendeeMessageFilters = {
  attendanceStatus: "",
  registrationStatus: "",
  country: "",
  city: "",
  gender: "",
  company: "",
};

function normalized(value: unknown) {
  return String(value ?? "").trim().toLocaleLowerCase();
}

export function normalizeAttendeeMessageFilters(
  value: Partial<Record<keyof AttendeeMessageFilters, unknown>> | null | undefined,
): AttendeeMessageFilters {
  const attendanceStatus = normalized(value?.attendanceStatus);
  const registrationStatus = normalized(value?.registrationStatus);

  return {
    attendanceStatus:
      attendanceStatus === "pending" ||
      attendanceStatus === "registered" ||
      attendanceStatus === "confirmed"
        ? attendanceStatus
        : "",
    registrationStatus:
      registrationStatus === "pending-verification" || registrationStatus === "verified"
        ? registrationStatus
        : "",
    country: String(value?.country ?? "").trim(),
    city: String(value?.city ?? "").trim(),
    gender: String(value?.gender ?? "").trim(),
    company: String(value?.company ?? "").trim(),
  };
}

export function filterAttendeesForMessage(
  attendees: AttendeeRecord[],
  untrustedFilters: Partial<Record<keyof AttendeeMessageFilters, unknown>> | null | undefined,
) {
  const filters = normalizeAttendeeMessageFilters(untrustedFilters);

  return attendees.filter((attendee) => {
    if (filters.attendanceStatus && attendee.attendanceStatus !== filters.attendanceStatus) {
      return false;
    }

    if (filters.registrationStatus && attendee.registrationStatus !== filters.registrationStatus) {
      return false;
    }

    if (filters.country && normalized(attendee.country) !== normalized(filters.country)) {
      return false;
    }

    if (filters.city && normalized(attendee.city) !== normalized(filters.city)) {
      return false;
    }

    if (filters.gender && normalized(attendee.gender) !== normalized(filters.gender)) {
      return false;
    }

    if (filters.company && normalized(attendee.company) !== normalized(filters.company)) {
      return false;
    }

    return true;
  });
}

export function hasAttendeeMessageFilters(filters: AttendeeMessageFilters) {
  return Object.values(filters).some(Boolean);
}
