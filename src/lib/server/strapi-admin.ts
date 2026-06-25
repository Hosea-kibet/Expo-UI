import type { PendingRegistration } from "@/src/lib/registration";
import { normalizePhone } from "@/src/lib/registration";

export type AttendeeRecord = {
  id: number;
  documentId: string;
  registrationReference: string;
  registrationStatus: "pending-verification" | "verified";
  attendanceStatus: "pending" | "registered" | "confirmed";
  registeredAt: string;
  checkedInAt?: string | null;
  gender: string;
  firstName: string;
  lastName: string;
  email: string;
  countryCode: string;
  phone: string;
  fullPhoneNumber: string;
  country: string;
  city: string;
  company?: string;
  jobTitle?: string;
  notes?: string | null;
  consent: boolean;
  otpHash?: string | null;
  otpSalt?: string | null;
  otpExpiresAt?: string | null;
  otpLastSentAt?: string | null;
  otpAttemptCount?: number | null;
  otpUsedAt?: string | null;
};

type StrapiSingleResponse<T> = { data: T | null };
type StrapiCollectionResponse<T> = { data: T[] };
type StrapiLocalAuthResponse = {
  jwt: string;
  user: {
    id: number;
    username: string;
    email: string;
    blocked?: boolean;
  };
};

function getStrapiAdminBaseUrl() {
  const strapiUrl = process.env.STRAPI_URL;

  if (!strapiUrl) {
    throw new Error("STRAPI_URL is not configured.");
  }

  return `${strapiUrl.replace(/\/$/, "")}/api`;
}

function getStrapiAdminHeaders() {
  const token = process.env.STRAPI_API_TOKEN;

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function strapiRequest<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${getStrapiAdminBaseUrl()}${path}`, {
    ...init,
    headers: {
      ...getStrapiAdminHeaders(),
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const text = await response.text();

  if (!response.ok) {
    // Parse Strapi error shape and surface a readable message instead of raw JSON
    let message: string | undefined;
    try {
      const parsed = JSON.parse(text) as { error?: { message?: string; status?: number } };
      message = parsed?.error?.message;
    } catch {
      // not JSON — use raw text below
    }
    const err = new Error(message || text || `Strapi request failed with ${response.status}`);
    (err as Error & { status?: number }).status = response.status;
    throw err;
  }

  return JSON.parse(text) as T;
}

async function strapiJwtRequest<T>(path: string, jwt: string, init?: RequestInit) {
  return strapiRequest<T>(path, {
    ...init,
    headers: {
      Authorization: `Bearer ${jwt}`,
      ...(init?.headers ?? {}),
    },
  });
}

export async function loginStrapiUser(identifier: string, password: string) {
  const result = await strapiRequest<StrapiLocalAuthResponse>("/auth/local", {
    method: "POST",
    body: JSON.stringify({
      identifier,
      password,
    }),
  });

  if (!result.jwt || !result.user) {
    throw new Error("Strapi did not return an authenticated user.");
  }

  return result;
}

export async function getAttendeeByEmail(email: string) {
  const params = new URLSearchParams({
    "filters[email][$eq]": email,
    "pagination[pageSize]": "1",
  });

  const result = await strapiRequest<StrapiCollectionResponse<AttendeeRecord>>(
    `/attendees?${params.toString()}`,
  );

  return result.data[0] ?? null;
}

export async function getAttendeeByReference(reference: string, jwt: string) {
  const params = new URLSearchParams({
    "filters[registrationReference][$eq]": reference,
    "pagination[pageSize]": "1",
    sort: "registeredAt:desc",
  });

  const result = await strapiJwtRequest<StrapiCollectionResponse<AttendeeRecord>>(
    `/attendees?${params.toString()}`,
    jwt,
  );

  return result.data[0] ?? null;
}

export async function listAttendees(jwt: string) {
  const params = new URLSearchParams({
    "pagination[pageSize]": "250",
    sort: "registeredAt:desc",
  });

  const result = await strapiJwtRequest<StrapiCollectionResponse<AttendeeRecord>>(
    `/attendees?${params.toString()}`,
    jwt,
  );

  return result.data;
}

export async function createAttendee(data: Record<string, unknown>) {
  const result = await strapiRequest<StrapiSingleResponse<AttendeeRecord>>("/attendees", {
    method: "POST",
    body: JSON.stringify({ data }),
  });

  if (!result.data) {
    throw new Error("Strapi did not return the attendee record.");
  }

  return result.data;
}

export async function updateAttendee(documentId: string, data: Record<string, unknown>) {
  const result = await strapiRequest<StrapiSingleResponse<AttendeeRecord>>(`/attendees/${documentId}`, {
    method: "PUT",
    body: JSON.stringify({ data }),
  });

  if (!result.data) {
    throw new Error("Strapi did not return the updated attendee record.");
  }

  return result.data;
}

export async function updateAttendeeWithJwt(
  documentId: string,
  data: Record<string, unknown>,
  jwt: string,
) {
  const result = await strapiJwtRequest<StrapiSingleResponse<AttendeeRecord>>(
    `/attendees/${documentId}`,
    jwt,
    {
      method: "PUT",
      body: JSON.stringify({ data }),
    },
  );

  if (!result.data) {
    throw new Error("Strapi did not return the updated attendee record.");
  }

  return result.data;
}

export function attendeePayloadFromRegistration(
  registration: PendingRegistration,
  extra: Record<string, unknown> = {},
) {
  return {
    gender: registration.gender,
    firstName: registration.firstName,
    lastName: registration.lastName,
    email: registration.email,
    countryCode: registration.countryCode,
    phone: normalizePhone(registration.phone),
    fullPhoneNumber: `${registration.countryCode}${normalizePhone(registration.phone)}`,
    country: registration.country,
    city: registration.city,
    company: registration.company || null,
    jobTitle: registration.jobTitle || null,
    notes: null,
    consent: registration.consent,
    ...extra,
  };
}
