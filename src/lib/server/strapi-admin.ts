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
type StrapiMeResponse = {
  id: number;
  username: string;
  email: string;
  blocked?: boolean;
  role?: {
    id: number;
    name: string;
    type: string;
  } | null;
};
type StrapiLocalAuthResponse = {
  jwt: string;
  user: {
    id: number;
    username: string;
    email: string;
    blocked?: boolean;
  };
};
type StrapiAdminLoginResponse = {
  data?: {
    token?: string;
    accessToken?: string;
    user?: {
      id: number;
      firstname?: string | null;
      lastname?: string | null;
      email: string;
      isActive?: boolean;
    };
  };
};

export type ExpoAccessRole = "admin" | "staff";
export type ExpoAuthResult = {
  id: string;
  email: string;
  name: string;
  expoAccess: ExpoAccessRole;
  authProvider: "strapi-admin" | "strapi-staff";
  strapiJwt?: string;
  strapiRoleName?: string;
  strapiRoleType?: string;
};

function getStrapiAdminBaseUrl() {
  const strapiUrl = process.env.STRAPI_URL;

  if (!strapiUrl) {
    throw new Error("STRAPI_URL is not configured.");
  }

  return `${strapiUrl.replace(/\/$/, "")}/api`;
}

function getStrapiBaseUrl() {
  const strapiUrl = process.env.STRAPI_URL;

  if (!strapiUrl) {
    throw new Error("STRAPI_URL is not configured.");
  }

  return strapiUrl.replace(/\/$/, "");
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

async function strapiAdminRequest<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${getStrapiBaseUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const text = await response.text();

  if (!response.ok) {
    let message: string | undefined;
    try {
      const parsed = JSON.parse(text) as { error?: { message?: string }; data?: { error?: { message?: string } } };
      message = parsed?.error?.message ?? parsed?.data?.error?.message;
    } catch {
      // not JSON
    }

    const err = new Error(message || text || `Strapi admin request failed with ${response.status}`);
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

export async function loginExpoUser(identifier: string, password: string): Promise<ExpoAuthResult> {
  const normalizedIdentifier = identifier.trim();

  try {
    const adminResult = await strapiAdminRequest<StrapiAdminLoginResponse>("/admin/login", {
      method: "POST",
      body: JSON.stringify({
        email: normalizedIdentifier,
        password,
      }),
    });

    const accessToken = adminResult.data?.accessToken ?? adminResult.data?.token;
    const adminUser = adminResult.data?.user;

    if (accessToken && adminUser?.email) {
      const fullName = [adminUser.firstname, adminUser.lastname].filter(Boolean).join(" ").trim();

      return {
        id: `admin-${adminUser.id}`,
        email: adminUser.email,
        name: fullName || adminUser.email,
        expoAccess: "admin",
        authProvider: "strapi-admin",
      };
    }
  } catch {
    // Fall through to users-permissions login
  }

  const result = await loginStrapiUser(normalizedIdentifier, password);
  const me = await strapiJwtRequest<StrapiMeResponse>("/users/me?populate=role", result.jwt);

  if (me.blocked) {
    throw new Error("Your account has been blocked by an administrator.");
  }

  const roleName = me.role?.name?.trim() ?? "";
  const roleType = me.role?.type?.trim() ?? "";
  const normalizedRoleName = roleName.toLowerCase();

  if (normalizedRoleName === "event admin") {
    return {
      id: `staff-${me.id}`,
      email: me.email,
      name: me.username,
      expoAccess: "admin",
      authProvider: "strapi-staff",
      strapiJwt: result.jwt,
      strapiRoleName: roleName,
      strapiRoleType: roleType,
    };
  }

  if (normalizedRoleName === "check in staff") {
    return {
      id: `staff-${me.id}`,
      email: me.email,
      name: me.username,
      expoAccess: "staff",
      authProvider: "strapi-staff",
      strapiJwt: result.jwt,
      strapiRoleName: roleName,
      strapiRoleType: roleType,
    };
  }

  throw new Error(
    roleName
      ? `The Strapi role "${roleName}" is not allowed to access Expo admin.`
      : "Your Strapi account does not have an Expo staff role."
  );
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

export async function getAttendeeByReference(reference: string, jwt?: string) {
  const params = new URLSearchParams({
    "filters[registrationReference][$eq]": reference,
    "pagination[pageSize]": "1",
    sort: "registeredAt:desc",
  });

  const path = `/attendees?${params.toString()}`;
  const result = jwt
    ? await strapiJwtRequest<StrapiCollectionResponse<AttendeeRecord>>(path, jwt)
    : await strapiRequest<StrapiCollectionResponse<AttendeeRecord>>(path);

  return result.data[0] ?? null;
}

export async function listAttendees(jwt?: string) {
  const params = new URLSearchParams({
    "pagination[pageSize]": "250",
    sort: "registeredAt:desc",
  });

  const path = `/attendees?${params.toString()}`;
  const result = jwt
    ? await strapiJwtRequest<StrapiCollectionResponse<AttendeeRecord>>(path, jwt)
    : await strapiRequest<StrapiCollectionResponse<AttendeeRecord>>(path);

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
